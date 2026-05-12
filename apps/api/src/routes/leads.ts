import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalEnum,
  optionalNonEmptyString,
  optionalString,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { getQueryDate, getQueryString } from '../utils/query.js';
import { buildLeadImportCandidates } from '../utils/lead-import.js';
import { dispatchWebhookEvent, toWebhookPayload } from '../utils/webhooks.js';
import { dispatchAutomationEvent, toAutomationPayload } from '../utils/automation.js';
import { assertCampaignInCompany, leadScope } from '../utils/data-scope.js';

const router = Router();
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'] as const;
type ImportedLead = Prisma.LeadGetPayload<{
  include: { owner: { select: { id: true; name: true } } };
}>;

router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const status = getQueryString(req.query.status);
    const source = getQueryString(req.query.source);
    const search = getQueryString(req.query.search);
    const ownerId = getQueryString(req.query.ownerId);
    const campaignId = getQueryString(req.query.campaignId);
    const createdFrom = getQueryDate(req.query.createdFrom, 'createdFrom');
    const createdTo = getQueryDate(req.query.createdTo, 'createdTo');
    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumLeadStatusFilter['equals'];
    }

    if (source) {
      where.source = { contains: source, mode: 'insensitive' };
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pagination = getPagination(req.query);
    const scopedWhere = await leadScope(req, where);
    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where: scopedWhere,
        include: {
          owner: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.lead.count({ where: scopedWhere }),
    ]);

    res.json(paginatedResponse(leads, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/lookups', async (req: AuthRequest, res, next) => {
  try {
    const [sources, companies, serviceTypes] = await Promise.all([
      prisma.lead.findMany({
        select: { source: true },
        distinct: ['source'],
        where: await leadScope(req, { source: { not: '' } }),
      }),
      prisma.lead.findMany({
        select: { companyName: true },
        distinct: ['companyName'],
        where: await leadScope(req, { companyName: { not: null } }),
      }),
      prisma.lead.findMany({
        select: { serviceType: true },
        distinct: ['serviceType'],
        where: await leadScope(req, { serviceType: { not: null } }),
      }),
    ]);

    res.json({
      success: true,
      data: {
        sources: sources.map((s) => s.source),
        companies: companies.map((c) => c.companyName).filter(Boolean),
        serviceTypes: serviceTypes.map((s) => s.serviceType).filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/import', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const { candidates, errors, totalRows } = buildLeadImportCandidates(body.leads, req.userId!, req.companyId!);
    const existingLeads = candidates.length > 0
      ? await prisma.lead.findMany({
        where: {
          companyId: req.companyId!,
          OR: candidates.map((candidate) => ({
            email: { equals: candidate.email, mode: 'insensitive' },
          })),
        },
        select: { email: true },
      })
      : [];
    const existingEmails = new Set(existingLeads.map((lead) => lead.email.toLowerCase()));
    const importableCandidates = candidates.filter((candidate) => {
      if (!existingEmails.has(candidate.email)) {
        return true;
      }

      errors.push({
        rowNumber: candidate.rowNumber,
        email: candidate.email,
        reason: 'Lead already exists for this company and email',
      });
      return false;
    });
    const created: ImportedLead[] = [];

    for (const candidate of importableCandidates) {
      try {
        const lead = await prisma.lead.create({
          data: candidate.data,
          include: {
            owner: { select: { id: true, name: true } },
          },
        });

        created.push(lead);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          errors.push({
            rowNumber: candidate.rowNumber,
            email: candidate.email,
            reason: error.code === 'P2002'
              ? 'Lead already exists for this owner and email'
              : error.code === 'P2003'
                ? 'Campaign was not found'
                : 'Lead could not be imported',
          });
          continue;
        }

        throw error;
      }
    }

    created.forEach((lead) => {
      void dispatchWebhookEvent('lead_created', toWebhookPayload({ lead }), req.companyId!).catch((error) => {
        console.error('Lead webhook dispatch failed:', error);
      });
      void dispatchAutomationEvent(req.companyId!, 'lead_created', toAutomationPayload({ lead })).catch((error) => {
        console.error('Lead automation dispatch failed:', error);
      });
    });

    res.status(201).json({
      success: true,
      data: {
        createdCount: created.length,
        skippedCount: errors.length,
        totalRows,
        errors,
        leads: created,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: await leadScope(req, { id: req.params.id }),
      include: {
        owner: { select: { id: true, name: true } },
        campaign: true,
        activities: { include: { creator: { select: { id: true, name: true } } } },
        deals: true,
      },
    });

    if (!lead) {
      throw new AppError(404, 'Lead not found');
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const fullName = requireString(body, 'fullName', 'Full name');
    const email = requireString(body, 'email', 'Email').toLowerCase();
    const source = requireString(body, 'source', 'Source');
    const campaignId = optionalString(body.campaignId);

    if (campaignId) {
      await assertCampaignInCompany(req, campaignId);
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        companyId: req.companyId!,
        email: { equals: email, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existingLead) {
      throw new AppError(409, 'Lead already exists for this company and email', 'DUPLICATE_LEAD');
    }

    const lead = await prisma.lead.create({
      data: {
        companyId: req.companyId!,
        fullName,
        email,
        phone: optionalString(body.phone),
        companyName: optionalString(body.companyName),
        source,
        serviceType: optionalString(body.serviceType),
        campaignId,
        status: optionalEnum(LEAD_STATUSES, 'Status')(body.status) || 'new',
        notes: optionalString(body.notes),
        ownerId: req.userId!,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    void dispatchWebhookEvent('lead_created', toWebhookPayload({ lead }), req.companyId!).catch((error) => {
      console.error('Lead webhook dispatch failed:', error);
    });
    void dispatchAutomationEvent(req.companyId!, 'lead_created', toAutomationPayload({ lead })).catch((error) => {
      console.error('Lead automation dispatch failed:', error);
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'fullName', optionalNonEmptyString);
    setIfPresent(data, body, 'email', (value) => optionalNonEmptyString(value).toLowerCase());
    setIfPresent(data, body, 'phone', optionalString);
    setIfPresent(data, body, 'companyName', optionalString);
    setIfPresent(data, body, 'source', optionalNonEmptyString);
    setIfPresent(data, body, 'serviceType', optionalString);
    setIfPresent(data, body, 'campaignId', optionalString);
    setIfPresent(data, body, 'status', optionalEnum(LEAD_STATUSES, 'Status'));
    setIfPresent(data, body, 'notes', optionalString);
    requireAtLeastOneField(data);

    if (typeof data.campaignId === 'string' && data.campaignId) {
      await assertCampaignInCompany(req, data.campaignId);
    }

    const existingLead = await prisma.lead.findFirst({
      where: await leadScope(req, { id: req.params.id }),
      select: { id: true },
    });

    if (!existingLead) {
      throw new AppError(404, 'Lead not found');
    }

    const lead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: data as Prisma.LeadUncheckedUpdateInput,
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existingLead = await prisma.lead.findFirst({
      where: await leadScope(req, { id: req.params.id }),
      select: { id: true },
    });

    if (!existingLead) {
      throw new AppError(404, 'Lead not found');
    }

    await prisma.lead.delete({ where: { id: existingLead.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
