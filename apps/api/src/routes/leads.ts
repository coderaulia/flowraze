import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
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

const router = Router();
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'] as const;

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, source, search } = req.query;
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = { contains: String(source), mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { companyName: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const pagination = getPagination(req.query);
    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.lead.count({ where }),
    ]);

    res.json(paginatedResponse(leads, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
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
    const email = requireString(body, 'email', 'Email');
    const source = requireString(body, 'source', 'Source');

    const lead = await prisma.lead.create({
      data: {
        fullName,
        email,
        phone: optionalString(body.phone),
        companyName: optionalString(body.companyName),
        source,
        campaignId: optionalString(body.campaignId),
        status: optionalEnum(LEAD_STATUSES, 'Status')(body.status) || 'new',
        notes: optionalString(body.notes),
        ownerId: req.userId!,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
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
    setIfPresent(data, body, 'email', optionalNonEmptyString);
    setIfPresent(data, body, 'phone', optionalString);
    setIfPresent(data, body, 'companyName', optionalString);
    setIfPresent(data, body, 'source', optionalNonEmptyString);
    setIfPresent(data, body, 'campaignId', optionalString);
    setIfPresent(data, body, 'status', optionalEnum(LEAD_STATUSES, 'Status'));
    setIfPresent(data, body, 'notes', optionalString);
    requireAtLeastOneField(data);

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
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
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
