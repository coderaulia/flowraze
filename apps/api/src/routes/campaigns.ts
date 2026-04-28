import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { optionalDate, requiredDate, requireAtLeastOneField, requireObjectBody, setIfPresent } from '../utils/request.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.campaign.count(),
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
    const { name, channel, cost, startDate, endDate } = req.body;

    if (!name || !channel || !startDate) {
      throw new AppError(400, 'Name, channel, and start date are required');
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        channel,
        cost,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
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

    setIfPresent(data, body, 'name');
    setIfPresent(data, body, 'channel');
    setIfPresent(data, body, 'cost');
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
