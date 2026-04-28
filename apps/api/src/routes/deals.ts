import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
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

const router = Router();
const DEAL_STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
const DEAL_STATUSES = ['active', 'closed'] as const;

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { stage, status } = req.query;
    const where: Record<string, unknown> = {};

    if (stage) {
      where.stage = stage;
    }

    if (status) {
      where.status = status;
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

    const deal = await prisma.deal.create({
      data: {
        leadId,
        title,
        value,
        stage: optionalEnum(DEAL_STAGES, 'Stage')(body.stage) || 'new',
        expectedCloseDate: optionalDate(body.expectedCloseDate) ?? undefined,
        ownerId: req.userId!,
      },
      include: {
        lead: { select: { id: true, fullName: true, companyName: true } },
        owner: { select: { id: true, name: true } },
      },
    });

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

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: data as Prisma.DealUncheckedUpdateInput,
      include: {
        lead: { select: { id: true, fullName: true, companyName: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
