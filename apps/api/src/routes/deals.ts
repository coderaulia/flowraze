// Force IDE re-evaluation for Prisma types
import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalDate,
  optionalEnum,
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireNumber,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { getQueryDate, getQueryNumber, getQueryString } from '../utils/query.js';
import { dispatchWebhookEvent, toWebhookPayload } from '../utils/webhooks.js';

const router = Router();
const DEAL_STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
const DEAL_STATUSES = ['active', 'closed'] as const;

router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const stage = getQueryString(req.query.stage);
    const status = getQueryString(req.query.status);
    const search = getQueryString(req.query.search);
    const ownerId = getQueryString(req.query.ownerId);
    const leadId = getQueryString(req.query.leadId);
    const minValue = getQueryNumber(req.query.minValue, 'minValue');
    const maxValue = getQueryNumber(req.query.maxValue, 'maxValue');
    const createdFrom = getQueryDate(req.query.createdFrom, 'createdFrom');
    const createdTo = getQueryDate(req.query.createdTo, 'createdTo');
    const expectedCloseFrom = getQueryDate(req.query.expectedCloseFrom, 'expectedCloseFrom');
    const expectedCloseTo = getQueryDate(req.query.expectedCloseTo, 'expectedCloseTo');
    const where: Prisma.DealWhereInput = { companyId: req.companyId! };

    if (stage) {
      where.stage = stage as Prisma.EnumDealStageFilter['equals'];
    }

    if (status) {
      where.status = status as Prisma.EnumDealStatusFilter['equals'];
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {
        ...(minValue !== undefined ? { gte: minValue } : {}),
        ...(maxValue !== undefined ? { lte: maxValue } : {}),
      };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    if (expectedCloseFrom || expectedCloseTo) {
      where.expectedCloseDate = {
        ...(expectedCloseFrom ? { gte: expectedCloseFrom } : {}),
        ...(expectedCloseTo ? { lte: expectedCloseTo } : {}),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { lead: { fullName: { contains: search, mode: 'insensitive' } } },
        { lead: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const pagination = getPagination(req.query);
    const [deals, total] = await prisma.$transaction([
      prisma.deal.findMany({
        where,
        include: {
          lead: { select: { id: true, fullName: true, companyName: true } },
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.deal.count({ where }),
    ]);

    res.json(paginatedResponse(deals, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        lead: true,
        owner: { select: { id: true, name: true } },
      },
    });

    if (!deal) {
      throw new AppError(404, 'Deal not found');
    }

    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const leadId = requireString(body, 'leadId', 'Lead');
    const title = requireString(body, 'title', 'Title');
    const value = requireNumber(body, 'value', 'Value');
    const stage = optionalEnum(DEAL_STAGES, 'Stage')(body.stage) || 'new';
    const expectedCloseDate = optionalDate(body.expectedCloseDate) ?? undefined;

    const existingDeal = await prisma.deal.findFirst({
      where: {
        leadId,
        ownerId: req.userId!,
        title: { equals: title, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existingDeal) {
      throw new AppError(409, 'Deal already exists for this lead and owner', 'DUPLICATE_DEAL');
    }

    const deal = await prisma.deal.create({
      data: {
        companyId: req.companyId!,
        leadId,
        title,
        value,
        stage,
        expectedCloseDate,
        closedAt: stage === 'won' ? new Date() : undefined,
        ownerId: req.userId!,
      },
      include: {
        lead: { select: { id: true, fullName: true, companyName: true, serviceType: true, source: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        companyId: req.companyId!,
        name: `[Project] ${deal.title}`,
        type: deal.lead.serviceType || 'Project',
        channel: deal.lead.source || 'organic',
        startDate: new Date(),
        salesOwnerId: deal.ownerId,
        cost: 0,
      },
    });

    await prisma.lead.update({
      where: { id: deal.leadId },
      data: { campaignId: campaign.id },
    });

    void dispatchWebhookEvent('deal_created', toWebhookPayload({ deal })).catch((error) => {
      console.error('Deal webhook dispatch failed:', error);
    });
    if (deal.stage === 'won') {
      void dispatchWebhookEvent('deal_won', toWebhookPayload({ deal })).catch((error) => {
        console.error('Deal won webhook dispatch failed:', error);
      });
    }

    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'title', optionalNonEmptyString);
    setIfPresent(data, body, 'value', (value) => requireNumber({ value }, 'value', 'Value'));
    setIfPresent(data, body, 'stage', optionalEnum(DEAL_STAGES, 'Stage'));
    setIfPresent(data, body, 'expectedCloseDate', optionalDate);
    setIfPresent(data, body, 'status', optionalEnum(DEAL_STATUSES, 'Status'));
    requireAtLeastOneField(data);

    const existingDeal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      select: { stage: true, ownerId: true },
    });

    if (!existingDeal) {
      throw new AppError(404, 'Deal not found');
    }

    const isPrivileged = req.userRole === 'admin' || req.userRole === 'superadmin';
    if (!isPrivileged && existingDeal.ownerId !== req.userId!) {
      throw new AppError(403, 'Access denied');
    }

    // Auto-manage closedAt: set when transitioning to won, clear when leaving won
    const newStage = data.stage as string | undefined;
    if (newStage !== undefined) {
      if (newStage === 'won' && existingDeal.stage !== 'won') {
        data.closedAt = new Date();
      } else if (newStage !== 'won' && existingDeal.stage === 'won') {
        data.closedAt = null;
      }
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: data as Prisma.DealUncheckedUpdateInput,
      include: {
        lead: { select: { id: true, fullName: true, companyName: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    if (existingDeal.stage !== 'won' && deal.stage === 'won') {
      void dispatchWebhookEvent('deal_won', toWebhookPayload({ deal })).catch((error) => {
        console.error('Deal won webhook dispatch failed:', error);
      });
    }

    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const isPrivileged = req.userRole === 'admin' || req.userRole === 'superadmin';
    const ownerWhere = isPrivileged ? {} : { ownerId: req.userId! };
    await prisma.deal.delete({ where: { id: req.params.id, ...ownerWhere } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
