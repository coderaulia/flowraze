import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { requireEnum, requireObjectBody, requireString } from '../utils/request.js';

const router = Router();
const ACTIVITY_TYPES = ['note', 'call', 'follow_up'] as const;

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { leadId } = req.query;
    const where: Record<string, unknown> = {};

    if (leadId) {
      where.leadId = String(leadId);
    }

    const pagination = getPagination(req.query);
    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        include: {
          lead: { select: { id: true, fullName: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.activity.count({ where }),
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

    const activity = await prisma.activity.create({
      data: {
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

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
});

export default router;
