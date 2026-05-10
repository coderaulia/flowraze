import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { requireEnum, requireObjectBody, requireString } from '../utils/request.js';
import { getQueryDate, getQueryString } from '../utils/query.js';
import { dispatchWebhookEvent, toWebhookPayload } from '../utils/webhooks.js';
import { activityScope, assertLeadVisible } from '../utils/data-scope.js';

const router = Router();
const ACTIVITY_TYPES = ['note', 'call', 'follow_up'] as const;
type ActivityTypeValue = (typeof ACTIVITY_TYPES)[number];

router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const leadId = getQueryString(req.query.leadId);
    const type = getQueryString(req.query.type);
    const createdBy = getQueryString(req.query.createdBy);
    const search = getQueryString(req.query.search);
    const createdFrom = getQueryDate(req.query.createdFrom, 'createdFrom');
    const createdTo = getQueryDate(req.query.createdTo, 'createdTo');
    const where: Prisma.ActivityWhereInput = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (type && ACTIVITY_TYPES.includes(type as ActivityTypeValue)) {
      where.type = type as ActivityTypeValue;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    const pagination = getPagination(req.query);
    const scopedWhere = await activityScope(req, where);
    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where: scopedWhere,
        include: {
          lead: { select: { id: true, fullName: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.activity.count({ where: scopedWhere }),
    ]);

    res.json(paginatedResponse(activities, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const leadId = requireString(body, 'leadId', 'Lead');
    const type = requireEnum(body, 'type', ACTIVITY_TYPES, 'Type');
    const content = requireString(body, 'content', 'Content');
    await assertLeadVisible(req, leadId);

    const existingActivity = await prisma.activity.findFirst({
      where: { companyId: req.companyId!, leadId, type, content, createdBy: req.userId! },
      select: { id: true },
    });

    if (existingActivity) {
      throw new AppError(409, 'Activity already exists for this lead', 'DUPLICATE_ACTIVITY');
    }

    const activity = await prisma.activity.create({
      data: {
        companyId: req.companyId!,
        leadId,
        type,
        content,
        createdBy: req.userId!,
      },
      include: {
        lead: { select: { id: true, fullName: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    void dispatchWebhookEvent('activity_created', toWebhookPayload({ activity })).catch((error) => {
      console.error('Activity webhook dispatch failed:', error);
    });

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
});

export default router;
