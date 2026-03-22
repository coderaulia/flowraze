import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

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

    const deals = await prisma.deal.findMany({
      where,
      include: {
        lead: { select: { id: true, fullName: true, companyName: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: deals });
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
    const { leadId, title, value, stage, expectedCloseDate, notes } = req.body;

    if (!leadId || !title || value === undefined) {
      throw new AppError(400, 'Lead, title, and value are required');
    }

    const deal = await prisma.deal.create({
      data: {
        leadId,
        title,
        value,
        stage: stage || 'new',
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
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
    const { title, value, stage, expectedCloseDate, status } = req.body;

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        title,
        value,
        stage,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        status,
      },
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
