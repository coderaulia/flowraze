import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const DASHBOARD_RANGES = ['30d', '90d', '6m', '12m', 'all'] as const;
type DashboardRange = (typeof DASHBOARD_RANGES)[number];

function getDashboardRange(value: unknown): DashboardRange {
  if (typeof value !== 'string') {
    return '6m';
  }

  return DASHBOARD_RANGES.includes(value as DashboardRange)
    ? (value as DashboardRange)
    : '6m';
}

function getStartDate(range: DashboardRange) {
  if (range === 'all') {
    return undefined;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (range === '30d') {
    startDate.setDate(startDate.getDate() - 29);
    return startDate;
  }

  if (range === '90d') {
    startDate.setDate(startDate.getDate() - 89);
    return startDate;
  }

  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - (range === '12m' ? 11 : 5));
  return startDate;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const range = getDashboardRange(req.query.range);
    const startDate = getStartDate(range);
    const createdAtFilter = startDate ? { gte: startDate } : undefined;
    const leadWhere: Prisma.LeadWhereInput = createdAtFilter
      ? { createdAt: createdAtFilter }
      : {};
    const dealWhere: Prisma.DealWhereInput = createdAtFilter
      ? { createdAt: createdAtFilter }
      : {};

    const [totalLeads, totalDeals, wonDeals] = await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.deal.count({ where: dealWhere }),
      prisma.deal.findMany({
        where: { ...dealWhere, stage: 'won' },
        select: { value: true, createdAt: true },
      }),
    ]);

    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const conversionRate = totalLeads > 0 ? wonDeals.length / totalLeads : 0;

    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: leadWhere,
      _count: { id: true },
    });

    const leadsBySourceMap: Record<string, number> = {};
    for (const item of leadsBySource) {
      leadsBySourceMap[item.source] = item._count.id;
    }

    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: dealWhere,
      _count: { id: true },
    });

    const dealsByStageMap: Record<string, number> = {};
    for (const item of dealsByStage) {
      dealsByStageMap[item.stage] = item._count.id;
    }

    const revenueWindowStart =
      startDate ||
      wonDeals.reduce<Date | undefined>((earliest, deal) => {
        if (!earliest || deal.createdAt < earliest) {
          return deal.createdAt;
        }

        return earliest;
      }, undefined);
    const revenueMap = new Map<string, { month: string; revenue: number }>();

    if (revenueWindowStart) {
      const cursor = new Date(revenueWindowStart);
      cursor.setDate(1);
      cursor.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(1);
      end.setHours(0, 0, 0, 0);

      while (cursor <= end) {
        revenueMap.set(getMonthKey(cursor), {
          month: getMonthLabel(cursor),
          revenue: 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    for (const deal of wonDeals) {
      const monthKey = getMonthKey(deal.createdAt);
      const current = revenueMap.get(monthKey);
      if (current) {
        current.revenue += deal.value;
      }
    }

    const revenueOverTime = Array.from(revenueMap.values());

    res.json({
      success: true,
      data: {
        range,
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
