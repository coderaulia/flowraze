import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res, next) => {
  try {
    const [totalLeads, totalDeals, wonDeals] = await Promise.all([
      prisma.lead.count(),
      prisma.deal.count(),
      prisma.deal.findMany({ where: { stage: 'won' } }),
    ]);

    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const conversionRate = totalLeads > 0 ? wonDeals.length / totalLeads : 0;

    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    const leadsBySourceMap: Record<string, number> = {};
    for (const item of leadsBySource) {
      leadsBySourceMap[item.source] = item._count.id;
    }

    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    const dealsByStageMap: Record<string, number> = {};
    for (const item of dealsByStage) {
      dealsByStageMap[item.stage] = item._count.id;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.deal.findMany({
      where: {
        stage: 'won',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        value: true,
        createdAt: true,
      },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap: Record<string, number> = {};
    
    // Initialize last 6 months with 0
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()];
      if (monthName) {
        revenueMap[monthName] = 0;
      }
    }

    monthlyRevenue.forEach((deal) => {
      const monthName = months[deal.createdAt.getMonth()];
      if (monthName && revenueMap[monthName] !== undefined) {
        revenueMap[monthName] = revenueMap[monthName] + deal.value;
      }
    });

    const revenueOverTime = Object.entries(revenueMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse();

    res.json({
      success: true,
      data: {
        totalLeads,
        totalDeals,
        wonRevenue,
        conversionRate,
        leadsBySource: leadsBySourceMap,
        dealsByStage: dealsByStageMap,
        revenueOverTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
