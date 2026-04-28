import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';

const router = Router();

router.use(authenticate);

router.get('/performance', async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        include: {
          leads: { select: { id: true } },
          deals: {
            where: { stage: 'won' },
            select: { id: true, value: true },
          },
          activities: { select: { id: true } },
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
