import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res, next) => {
  try {
    const [totalLeads, totalDeals, wonDeals, _allDeals] = await Promise.all([
      prisma.lead.count(),
      prisma.deal.count(),
      prisma.deal.findMany({ where: { stage: 'won' } }),
      prisma.deal.findMany(),
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

    const revenueOverTime = [
      { month: 'Jan', revenue: Math.random() * 50000000 + 10000000 },
      { month: 'Feb', revenue: Math.random() * 50000000 + 10000000 },
      { month: 'Mar', revenue: Math.random() * 50000000 + 10000000 },
      { month: 'Apr', revenue: Math.random() * 50000000 + 10000000 },
      { month: 'May', revenue: Math.random() * 50000000 + 10000000 },
      { month: 'Jun', revenue: Math.random() * 50000000 + 10000000 },
    ];

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
