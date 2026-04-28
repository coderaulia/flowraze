import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';

const router = Router();

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
    const { leadId, type, content } = req.body;

    if (!leadId || !type || !content) {
      throw new AppError(400, 'Lead, type, and content are required');
    }

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
