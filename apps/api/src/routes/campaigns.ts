import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalDate,
  optionalNonEmptyString,
  optionalNumber,
  requiredDate,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { search } = req.query;
    const where: Prisma.CampaignWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { channel: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const pagination = getPagination(req.query);
    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.campaign.count({ where }),
    ]);

    res.json(paginatedResponse(campaigns, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        leads: true,
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');
    const channel = requireString(body, 'channel', 'Channel');

    const campaign = await prisma.campaign.create({
      data: {
        name,
        channel,
        cost: optionalNumber(body.cost),
        startDate: requiredDate(body.startDate),
        endDate: optionalDate(body.endDate),
      },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'name', optionalNonEmptyString);
    setIfPresent(data, body, 'channel', optionalNonEmptyString);
    setIfPresent(data, body, 'cost', optionalNumber);
    setIfPresent(data, body, 'startDate', requiredDate);
    setIfPresent(data, body, 'endDate', optionalDate);
    requireAtLeastOneField(data);

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: data as Prisma.CampaignUpdateInput,
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
