import { Router } from 'express';
import type { Prisma, SalesTarget, SalesTeamMember } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
import { parseDateRange, getStartDate } from '../utils/date.js';

type WonDealWithCampaign = Prisma.DealGetPayload<{
  include: {
    lead: {
      include: {
        campaign: {
          select: { type: true };
        };
      };
    };
  };
}>;

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
    const range = parseDateRange(req.query.range);
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

// ─── GET /dashboard/targets ──────────────────────────────────────────────────
// Returns achievement vs target for a given period / scope / year.
router.get('/targets', async (req: AuthRequest, res, next) => {
  try {
    const {
      year: yearStr,
      quarter: quarterStr,
      month: monthStr,
      period,
      scope,
      teamId,
      userId,
    } = req.query as Record<string, string>;

    const year = parseInt(yearStr || String(new Date().getFullYear()), 10);
    const quarter = quarterStr ? parseInt(quarterStr, 10) : undefined;
    const month = monthStr ? parseInt(monthStr, 10) : undefined;
    const effectiveScope = scope || 'company';
    const effectivePeriod = period || 'yearly';

    // -- Build date range for actuals --
    let periodStart: Date;
    let periodEnd: Date;

    if (effectivePeriod === 'monthly' && month) {
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (effectivePeriod === 'quarterly' && quarter) {
      const startMonth = (quarter - 1) * 3;
      periodStart = new Date(year, startMonth, 1);
      periodEnd = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    } else {
      // yearly
      periodStart = new Date(year, 0, 1);
      periodEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    // -- Fetch all relevant targets for the year and scope --
    const allTargets = await prisma.salesTarget.findMany({
      where: {
        year,
        scope: effectiveScope as 'company' | 'team' | 'individual',
        ...(effectiveScope === 'team' && teamId ? { teamId } : {}),
        ...(effectiveScope === 'individual' && userId ? { userId } : {}),
      },
    });

    // Main target for the current period
    const currentPeriodTargets = allTargets.filter((t: SalesTarget) => {
      if (t.period !== effectivePeriod) return false;
      if (effectivePeriod === 'monthly' && t.month !== month) return false;
      if (effectivePeriod === 'quarterly' && t.quarter !== quarter) return false;
      return true;
    });

    const revenueTarget = currentPeriodTargets
      .filter((t: SalesTarget) => !t.category)
      .reduce((s: number, t: SalesTarget) => s + t.targetValue, 0);

    // -- Fetch won deals in range --
    let dealOwnerFilter: Prisma.DealWhereInput = {};
    if (effectiveScope === 'individual' && userId) {
      dealOwnerFilter = { ownerId: userId };
    } else if (effectiveScope === 'team' && teamId) {
      const members = await prisma.salesTeamMember.findMany({ where: { teamId } });
      const memberIds = members.map((m: SalesTeamMember) => m.userId);
      dealOwnerFilter = { ownerId: { in: memberIds } };
    }

    const wonDeals = await prisma.deal.findMany({
      where: {
        stage: 'won',
        closedAt: { gte: periodStart, lte: periodEnd },
        ...dealOwnerFilter,
      },
      include: {
        lead: {
          include: {
            campaign: { select: { type: true } },
          },
        },
      },
    });

    const revenueActual = wonDeals.reduce((s, d) => s + d.value, 0);
    const achievementPct = revenueTarget > 0 ? (revenueActual / revenueTarget) * 100 : 0;
    const remainingTarget = revenueTarget - revenueActual;

    // -- Leads and deals counts --
    const leadsTarget = currentPeriodTargets.find((t: SalesTarget) => !t.category)?.targetLeads ?? null;
    const dealsTarget = currentPeriodTargets.find((t: SalesTarget) => !t.category)?.targetDeals ?? null;

    let leadOwnerFilter: Prisma.LeadWhereInput = {};
    if (effectiveScope === 'individual' && userId) {
      leadOwnerFilter = { ownerId: userId };
    } else if (effectiveScope === 'team' && teamId) {
      const members = await prisma.salesTeamMember.findMany({ where: { teamId } });
      leadOwnerFilter = { ownerId: { in: members.map((m: SalesTeamMember) => m.userId) } };
    }

    const [leadsActual, dealsActual, activeCampaigns] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: periodStart, lte: periodEnd }, ...leadOwnerFilter } }),
      prisma.deal.count({ where: { createdAt: { gte: periodStart, lte: periodEnd }, ...dealOwnerFilter } }),
      prisma.campaign.count({ where: { startDate: { lte: periodEnd }, OR: [{ endDate: null }, { endDate: { gte: periodStart } }] } }),
    ]);

    // -- Category breakdown from Campaign.type --
    const campaignTypes = await prisma.campaign.findMany({
      where: { type: { not: null } },
      select: { type: true },
      distinct: ['type'],
    });
    const uniqueTypes = campaignTypes
      .map((campaign) => campaign.type)
      .filter((type): type is string => Boolean(type));

    const categories = uniqueTypes.map((catType) => {
      const catTarget = currentPeriodTargets
        .filter((t: SalesTarget) => t.category === catType)
        .reduce((s: number, t: SalesTarget) => s + t.targetValue, 0);

      const catActual = wonDeals
        .filter((deal: WonDealWithCampaign) => deal.lead?.campaign?.type === catType)
        .reduce((s: number, deal: WonDealWithCampaign) => s + deal.value, 0);

      const achievementPct = catTarget > 0 ? (catActual / catTarget) * 100 : 0;

      return {
        name: catType,
        target: catTarget,
        actual: catActual,
        pct: achievementPct,
      };
    });

    // -- Monthly breakdown for table (always show all 12 months for the year) --
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const mStart = new Date(year, i, 1);
      const mEnd = new Date(year, i + 1, 0, 23, 59, 59, 999);
      const mLabel = mStart.toLocaleString('en-US', { month: 'short' });

      const mTargets = allTargets.filter(t => t.period === 'monthly' && t.month === i + 1 && !t.category);
      const mTarget = mTargets.reduce((s, t) => s + t.targetValue, 0);
      const mShareOfParent = mTargets[0]?.shareOfParent ?? null;

      const mQuarter = Math.floor(i / 3) + 1;

      const mDeals = wonDeals.filter((deal: WonDealWithCampaign) => {
        const c = deal.closedAt;
        return c && c >= mStart && c <= mEnd;
      });
      const mActual = mDeals.reduce((s: number, deal: WonDealWithCampaign) => s + deal.value, 0);

      return {
        month: mLabel,
        monthIndex: i + 1,
        quarter: mQuarter,
        target: mTarget,
        actual: mActual,
        pct: mTarget > 0 ? (mActual / mTarget) * 100 : 0,
        shareOfParent: mShareOfParent,
        remaining: Math.max(0, mTarget - mActual),
      };
    });

    // -- Quarterly summary --
    const quarterlyBreakdown = Array.from({ length: 4 }, (_, i) => {
      const q = i + 1;
      const qStart = new Date(year, i * 3, 1);
      const qEnd = new Date(year, i * 3 + 3, 0, 23, 59, 59, 999);

      // find top-level quarterly target
      const qTargetRows = allTargets.filter((t) => t.period === 'quarterly' && t.quarter === q && !t.category);
      const explicitQTarget = qTargetRows.reduce((s, t) => s + t.targetValue, 0);
      const qShareOfParent = qTargetRows[0]?.shareOfParent ?? null;

      // sum monthly targets for this quarter as fallback
      const mTargetsSum = allTargets
        .filter((t) => t.period === 'monthly' && t.quarter === q && !t.category)
        .reduce((s, t) => s + t.targetValue, 0);

      const qTarget = explicitQTarget || mTargetsSum;

      const qDeals = wonDeals.filter((deal: WonDealWithCampaign) => {
        const c = deal.closedAt;
        return c && c >= qStart && c <= qEnd;
      });
      const qActual = qDeals.reduce((s: number, deal: WonDealWithCampaign) => s + deal.value, 0);
      const qPct = qTarget > 0 ? (qActual / qTarget) * 100 : 0;

      return {
        quarter: `Q${q}`,
        quarterIndex: q,
        target: qTarget,
        actual: qActual,
        pct: qPct,
        shareOfParent: qShareOfParent,
        remaining: Math.max(0, qTarget - qActual),
      };
    });

    // -- Individual leaderboard (company/team scope) --
    let leaderboard: { userId: string; userName: string; actual: number; target: number; pct: number }[] = [];
    if (effectiveScope !== 'individual') {
      const individualTargets = allTargets.filter((t) => 
        t.scope === 'individual' && 
        t.period === effectivePeriod &&
        (!quarter || t.quarter === quarter) &&
        (!month || t.month === month) &&
        !t.category &&
        t.userId
      );

      leaderboard = await Promise.all(
        individualTargets.map(async (t) => {
          const userDeals = await prisma.deal.findMany({
            where: { stage: 'won', ownerId: t.userId!, closedAt: { gte: periodStart, lte: periodEnd } },
            select: { value: true },
          });
          const actual = userDeals.reduce((s, d) => s + d.value, 0);
          
          // Need user name, which is not in allTargets
          const user = await prisma.user.findUnique({ where: { id: t.userId! }, select: { name: true } });

          return {
            userId: t.userId!,
            userName: user?.name ?? 'Unknown',
            actual,
            target: t.targetValue,
            pct: t.targetValue > 0 ? (actual / t.targetValue) * 100 : 0,
          };
        })
      );
      leaderboard.sort((a, b) => b.pct - a.pct);
    }

    res.json({
      success: true,
      data: {
        year,
        quarter: quarter ?? null,
        month: month ?? null,
        period: effectivePeriod,
        scope: effectiveScope,
        revenueTarget,
        revenueActual,
        achievementPct,
        remainingTarget,
        leadsTarget,
        leadsActual,
        dealsTarget,
        dealsActual,
        activeCampaigns,
        categories,
        monthlyBreakdown,
        quarterlyBreakdown,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
