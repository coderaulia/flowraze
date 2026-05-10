// Force IDE re-evaluation for Prisma types
import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope, requireAdminOrManager } from '../middleware/auth.js';
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
import { assertUserInCompany, campaignScope } from '../utils/data-scope.js';

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
    const where: Prisma.CampaignWhereInput = {};

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
    const scopedWhere = await campaignScope(req, where);
    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where: scopedWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          salesOwner: { select: { id: true, name: true, email: true } }
        },
        ...getPaginationArgs(pagination),
      }),
      prisma.campaign.count({ where: scopedWhere }),
    ]);

    res.json(paginatedResponse(campaigns, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: await campaignScope(req, { id: req.params.id }),
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

router.post('/', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');
    const channel = requireString(body, 'channel', 'Channel');
    const startDate = requiredDate(body.startDate);
    const ownerId = optionalNonEmptyString(body.ownerId);
    const salesOwnerId = optionalNonEmptyString(body.salesOwnerId);

    if (ownerId) {
      await assertUserInCompany(req, ownerId);
    }

    if (salesOwnerId) {
      await assertUserInCompany(req, salesOwnerId);
    }

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
        ownerId,
        salesOwnerId,
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

router.put('/:id', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
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

    if (typeof data.ownerId === 'string') {
      await assertUserInCompany(req, data.ownerId);
    }

    if (typeof data.salesOwnerId === 'string') {
      await assertUserInCompany(req, data.salesOwnerId);
    }

    const existingCampaign = await prisma.campaign.findFirst({
      where: await campaignScope(req, { id: req.params.id }),
      select: { id: true },
    });

    if (!existingCampaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const campaign = await prisma.campaign.update({
      where: { id: existingCampaign.id },
      data: data as Prisma.CampaignUpdateInput,
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const existingCampaign = await prisma.campaign.findFirst({
      where: await campaignScope(req, { id: req.params.id }),
      select: { id: true },
    });

    if (!existingCampaign) {
      throw new AppError(404, 'Campaign not found');
    }

    await prisma.campaign.delete({ where: { id: existingCampaign.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
