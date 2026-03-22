import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/performance', async (_req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        leads: { select: { id: true } },
        deals: {
          where: { stage: 'won' },
          select: { id: true, value: true },
        },
        activities: { select: { id: true } },
      },
    });

    const performance = users.map((user) => ({
      userId: user.id,
      userName: user.name,
      leadsAssigned: user.leads.length,
      dealsWon: user.deals.length,
      revenueClosed: user.deals.reduce((sum, d) => sum + d.value, 0),
      activitiesLogged: user.activities.length,
    }));

    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
});

export default router;
