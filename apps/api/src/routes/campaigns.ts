// Force IDE re-evaluation for Prisma types
import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
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
import { getQueryDate, getQueryNumber, getQueryString } from '../utils/query.js';

const router = Router();

router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const search = getQueryString(req.query.search);
    const channel = getQueryString(req.query.channel);
    const minCost = getQueryNumber(req.query.minCost, 'minCost');
    const maxCost = getQueryNumber(req.query.maxCost, 'maxCost');
    const createdFrom = getQueryDate(req.query.createdFrom, 'createdFrom');
    const createdTo = getQueryDate(req.query.createdTo, 'createdTo');
    const startFrom = getQueryDate(req.query.startFrom, 'startFrom');
    const startTo = getQueryDate(req.query.startTo, 'startTo');
    const where: Prisma.CampaignWhereInput = { companyId: req.companyId! };

    if (channel) {
      where.channel = { contains: channel, mode: 'insensitive' };
    }

    if (minCost !== undefined || maxCost !== undefined) {
      where.cost = {
        ...(minCost !== undefined ? { gte: minCost } : {}),
        ...(maxCost !== undefined ? { lte: maxCost } : {}),
      };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    if (startFrom || startTo) {
      where.startDate = {
        ...(startFrom ? { gte: startFrom } : {}),
        ...(startTo ? { lte: startTo } : {}),
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { channel: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pagination = getPagination(req.query);
    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          salesOwner: { select: { id: true, name: true, email: true } }
        },
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
        leads: { include: { deals: true } },
        owner: { select: { id: true, name: true, email: true } },
        salesOwner: { select: { id: true, name: true, email: true } }
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
    const startDate = requiredDate(body.startDate);

    const existingCampaign = await prisma.campaign.findFirst({
      where: { companyId: req.companyId!, name, channel, startDate },
      select: { id: true },
    });

    if (existingCampaign) {
      throw new AppError(409, 'Campaign already exists for this channel and start date', 'DUPLICATE_CAMPAIGN');
    }

    const campaign = await prisma.campaign.create({
      data: {
        companyId: req.companyId!,
        name,
        channel,
        type: optionalNonEmptyString(body.type),
        ownerId: optionalNonEmptyString(body.ownerId),
        salesOwnerId: optionalNonEmptyString(body.salesOwnerId),
        cost: optionalNumber(body.cost),
        startDate,
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
    setIfPresent(data, body, 'type', optionalNonEmptyString);
    setIfPresent(data, body, 'ownerId', optionalNonEmptyString);
    setIfPresent(data, body, 'salesOwnerId', optionalNonEmptyString);
    setIfPresent(data, body, 'cost', optionalNumber);
    setIfPresent(data, body, 'startDate', requiredDate);
    setIfPresent(data, body, 'endDate', optionalDate);
    requireAtLeastOneField(data);

    const isPrivileged = req.userRole === 'admin' || req.userRole === 'superadmin';
    if (!isPrivileged) {
      const existingCampaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        select: { ownerId: true, salesOwnerId: true },
      });
      if (!existingCampaign) throw new AppError(404, 'Campaign not found');
      if (existingCampaign.ownerId !== req.userId! && existingCampaign.salesOwnerId !== req.userId!) {
        throw new AppError(403, 'Access denied');
      }
    }

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
    const isPrivileged = req.userRole === 'admin' || req.userRole === 'superadmin';
    if (!isPrivileged) {
      const existingCampaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        select: { ownerId: true, salesOwnerId: true },
      });
      if (!existingCampaign) throw new AppError(404, 'Campaign not found');
      if (existingCampaign.ownerId !== req.userId! && existingCampaign.salesOwnerId !== req.userId!) {
        throw new AppError(403, 'Access denied');
      }
    }
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
