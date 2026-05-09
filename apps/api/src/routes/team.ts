import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { parseDateRange, getStartDate } from '../utils/date.js';
import type { Prisma } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/performance', async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const range = parseDateRange(req.query.range);
    const startDate = getStartDate(range);

    const dateFilter: Prisma.DateTimeFilter | undefined = startDate
      ? { gte: startDate }
      : undefined;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        include: {
          leads: {
            where: dateFilter ? { createdAt: dateFilter } : undefined,
            select: { id: true }
          },
          deals: {
            where: {
              stage: 'won',
              ...(dateFilter ? { closedAt: dateFilter } : {}),
            },
            select: { id: true, value: true },
          },
          activities: {
            where: dateFilter ? { createdAt: dateFilter } : undefined,
            select: { id: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.user.count(),
    ]);

    const performance = users.map((user) => ({
      userId: user.id,
      userName: user.name,
      leadsAssigned: user.leads.length,
      dealsWon: user.deals.length,
      revenueClosed: user.deals.reduce((sum, d) => sum + d.value, 0),
      activitiesLogged: user.activities.length,
    }));

    res.json(paginatedResponse(performance, pagination, total));
  } catch (error) {
    next(error);
  }
});

export default router;
