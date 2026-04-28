import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { requireAtLeastOneField, requireObjectBody, setIfPresent } from '../utils/request.js';

const router = Router();

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
    const { fullName, email, phone, companyName, source, campaignId, status, notes } = req.body;

    if (!fullName || !email) {
      throw new AppError(400, 'Full name and email are required');
    }

    const lead = await prisma.lead.create({
      data: {
        fullName,
        email,
        phone,
        companyName,
        source,
        campaignId,
        status: status || 'new',
        notes,
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

    setIfPresent(data, body, 'fullName');
    setIfPresent(data, body, 'email');
    setIfPresent(data, body, 'phone');
    setIfPresent(data, body, 'companyName');
    setIfPresent(data, body, 'source');
    setIfPresent(data, body, 'campaignId');
    setIfPresent(data, body, 'status');
    setIfPresent(data, body, 'notes');
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
