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

/** Build a map of month keys → { month label, value: 0 } covering the full window */
function buildMonthMap(windowStart: Date, windowEnd: Date): Map<string, { month: string; value: number }> {
  const map = new Map<string, { month: string; value: number }>();
  const cursor = new Date(windowStart);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date(windowEnd);
  end.setDate(1);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    map.set(getMonthKey(cursor), { month: getMonthLabel(cursor), value: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return map;
}

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const range = getDashboardRange(req.query.range);
    const startDate = getStartDate(range);

    const leadWhere: Prisma.LeadWhereInput = startDate
      ? { createdAt: { gte: startDate } }
      : {};

    // Deals are scoped by createdAt for counts; won revenue by closedAt
    const dealWhere: Prisma.DealWhereInput = startDate
      ? { createdAt: { gte: startDate } }
      : {};

    const wonWhere: Prisma.DealWhereInput = {
      stage: 'won',
      ...(startDate ? { closedAt: { gte: startDate } } : {}),
    };

    const [totalLeads, totalDeals, wonDeals, allLeads] = await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.deal.count({ where: dealWhere }),
      prisma.deal.findMany({
        where: wonWhere,
        select: { value: true, closedAt: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: leadWhere,
        select: { createdAt: true },
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

    // --- Revenue over time (grouped by closedAt month) ---
    const windowStart = startDate ?? wonDeals.reduce<Date | undefined>((earliest, deal) => {
      const date = deal.closedAt ?? deal.createdAt;
      if (!earliest || date < earliest) return date;
      return earliest;
    }, undefined);

    const revenueMap = windowStart
      ? buildMonthMap(windowStart, new Date())
      : new Map<string, { month: string; value: number }>();

    for (const deal of wonDeals) {
      const dateToUse = deal.closedAt ?? deal.createdAt;
      const key = getMonthKey(dateToUse);
      const current = revenueMap.get(key);
      if (current) {
        current.value += deal.value;
      }
    }

    const revenueOverTime = Array.from(revenueMap.values()).map(({ month, value }) => ({
      month,
      revenue: value,
    }));

    // --- Leads over time (grouped by createdAt month) ---
    const leadsWindowStart = startDate ?? allLeads.reduce<Date | undefined>((earliest, lead) => {
      if (!earliest || lead.createdAt < earliest) return lead.createdAt;
      return earliest;
    }, undefined);

    const leadsMap = leadsWindowStart
      ? buildMonthMap(leadsWindowStart, new Date())
      : new Map<string, { month: string; value: number }>();

    for (const lead of allLeads) {
      const key = getMonthKey(lead.createdAt);
      const current = leadsMap.get(key);
      if (current) {
        current.value += 1;
      }
    }

    const leadsOverTime = Array.from(leadsMap.values()).map(({ month, value }) => ({
      month,
      leads: value,
    }));

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
        leadsOverTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
