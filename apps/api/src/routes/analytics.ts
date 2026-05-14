import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, type AuthRequest, companyDataScope } from '../middleware/auth.js';
import { campaignScope, dealScope, leadScope } from '../utils/data-scope.js';
import { parseDateRange, getStartDate } from '../utils/date.js';
import { assertFeature } from '../utils/entitlements.js';

const router = Router();

router.use(authenticate, companyDataScope);

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── GET /analytics/funnel ───────────────────────────────────────────────────
// Deal-stage conversion funnel: counts and drop-off rates between stages.
router.get('/funnel', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'analytics');

    const range = parseDateRange(req.query.range);
    const startDate = getStartDate(range);

    const dealWhere = await dealScope(
      req,
      startDate ? { createdAt: { gte: startDate } } : {}
    );

    // Fetch company's default pipeline stages
    const defaultPipeline = req.companyId
      ? await prisma.pipeline.findFirst({
          where: { companyId: req.companyId, isDefault: true },
          include: { stages: { orderBy: { order: 'asc' } } },
        })
      : null;
    const allStages = defaultPipeline?.stages ?? [];

    const stageCounts = await prisma.deal.groupBy({
      by: ['pipelineStageId'],
      where: dealWhere,
      _count: { id: true },
    });

    const countMap: Record<string, number> = {};
    for (const row of stageCounts) {
      countMap[row.pipelineStageId] = row._count.id;
    }

    // Funnel = non-lost stages in order; lost stages reported separately
    const funnelStages = allStages.filter((s) => !s.isLost);
    const lostStages = allStages.filter((s) => s.isLost);

    const funnelRows = funnelStages.map((stage, i) => {
      const count = countMap[stage.id] ?? 0;
      const prevStage = i === 0 ? undefined : funnelStages[i - 1];
      const prevCount = prevStage === undefined ? null : (countMap[prevStage.id] ?? 0);
      const conversionFromPrev =
        prevCount === null ? null : prevCount > 0 ? count / prevCount : 0;
      return { stage: stage.name, stageId: stage.id, isWon: stage.isWon, count, conversionFromPrev };
    });

    const totalDeals = Object.values(countMap).reduce((s, v) => s + v, 0);
    const wonCount = funnelStages
      .filter((s) => s.isWon)
      .reduce((s, stage) => s + (countMap[stage.id] ?? 0), 0);
    const lostCount = lostStages.reduce((s, stage) => s + (countMap[stage.id] ?? 0), 0);
    const overallConversion = totalDeals > 0 ? wonCount / totalDeals : 0;

    res.json({
      success: true,
      data: {
        range,
        funnel: funnelRows,
        lost: lostCount,
        totalDeals,
        overallConversion,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /analytics/attribution ──────────────────────────────────────────────
// Single-touch campaign attribution: per-campaign lead count, deal count,
// won revenue, and cost-per-lead / ROAS.
router.get('/attribution', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'analytics');

    const range = parseDateRange(req.query.range);
    const startDate = getStartDate(range);

    const campaignWhere = await campaignScope(
      req,
      startDate ? { startDate: { gte: startDate } } : {}
    );

    const campaigns = await prisma.campaign.findMany({
      where: campaignWhere,
      select: {
        id: true,
        name: true,
        channel: true,
        type: true,
        cost: true,
        startDate: true,
        leads: {
          select: {
            id: true,
            status: true,
            deals: {
              select: {
                id: true,
                isWon: true,
                value: true,
                closedAt: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const rows = campaigns.map((campaign) => {
      const leads = campaign.leads.length;
      const allDeals = campaign.leads.flatMap((l) => l.deals);
      const deals = allDeals.length;
      const wonDeals = allDeals.filter((d) => d.isWon);
      const revenue = wonDeals.reduce((s, d) => s + d.value, 0);
      const cost = campaign.cost ?? 0;
      const costPerLead = leads > 0 && cost > 0 ? cost / leads : null;
      const roas = cost > 0 ? revenue / cost : null;
      const conversionRate = leads > 0 ? wonDeals.length / leads : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        type: campaign.type ?? null,
        cost,
        leads,
        deals,
        wonDeals: wonDeals.length,
        revenue,
        costPerLead,
        roas,
        conversionRate,
      };
    });

    // Sort by revenue desc as default
    rows.sort((a, b) => b.revenue - a.revenue);

    const totals = rows.reduce(
      (acc, row) => ({
        cost: acc.cost + row.cost,
        leads: acc.leads + row.leads,
        deals: acc.deals + row.deals,
        wonDeals: acc.wonDeals + row.wonDeals,
        revenue: acc.revenue + row.revenue,
      }),
      { cost: 0, leads: 0, deals: 0, wonDeals: 0, revenue: 0 }
    );

    res.json({
      success: true,
      data: {
        range,
        campaigns: rows,
        totals: {
          ...totals,
          roas: totals.cost > 0 ? totals.revenue / totals.cost : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /analytics/forecast ─────────────────────────────────────────────────
// Linear regression forecast: uses closed-won revenue from the last N months
// to project the next 3 months.
router.get('/forecast', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'analytics');

    const HISTORY_MONTHS = 6;
    const FORECAST_MONTHS = 3;

    const historyStart = new Date();
    historyStart.setDate(1);
    historyStart.setHours(0, 0, 0, 0);
    historyStart.setMonth(historyStart.getMonth() - HISTORY_MONTHS);

    const wonWhere = await dealScope(req, {
      isWon: true,
      closedAt: { gte: historyStart },
    });

    const wonDeals = await prisma.deal.findMany({
      where: wonWhere,
      select: { value: true, closedAt: true },
    });

    const buckets: Record<string, number> = {};
    const now = new Date();

    // Seed zero buckets for last HISTORY_MONTHS months
    for (let i = HISTORY_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[monthKey(d)] = 0;
    }

    for (const deal of wonDeals) {
      if (!deal.closedAt) continue;
      const key = monthKey(deal.closedAt);
      if (key in buckets) {
        buckets[key] = (buckets[key] ?? 0) + deal.value;
      }
    }

    const historicalPoints = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue], index) => {
        const parts = key.split('-').map(Number);
        const year = parts[0] as number;
        const month = parts[1] as number;
        const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
        return { key, label, revenue, index };
      });

    // Simple linear regression: y = a + b*x
    const n = historicalPoints.length;
    const sumX = historicalPoints.reduce((s, p) => s + p.index, 0);
    const sumY = historicalPoints.reduce((s, p) => s + p.revenue, 0);
    const sumXX = historicalPoints.reduce((s, p) => s + p.index * p.index, 0);
    const sumXY = historicalPoints.reduce((s, p) => s + p.index * p.revenue, 0);

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = denominator !== 0 ? (sumY - slope * sumX) / n : sumY / n;

    // Forecast points
    const forecastPoints = Array.from({ length: FORECAST_MONTHS }, (_, i) => {
      const x = n + i;
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
      const label = forecastDate.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      const projected = Math.max(0, intercept + slope * x);
      return { label, projected, index: x };
    });

    // Compute R² as a confidence indicator
    const meanY = sumY / n;
    const ssTot = historicalPoints.reduce((s, p) => s + (p.revenue - meanY) ** 2, 0);
    const ssRes = historicalPoints.reduce((s, p) => {
      const yHat = intercept + slope * p.index;
      return s + (p.revenue - yHat) ** 2;
    }, 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    res.json({
      success: true,
      data: {
        historyMonths: HISTORY_MONTHS,
        forecastMonths: FORECAST_MONTHS,
        slope,
        intercept,
        rSquared,
        historical: historicalPoints.map(({ label, revenue }) => ({ label, revenue })),
        forecast: forecastPoints.map(({ label, projected }) => ({ label, projected })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /analytics/lead-velocity ────────────────────────────────────────────
// Lead-to-deal velocity: average days from lead creation to first deal
// creation, and lead-to-win time. Grouped by source.
router.get('/lead-velocity', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'analytics');

    const range = parseDateRange(req.query.range);
    const startDate = getStartDate(range);

    const leadWhere = await leadScope(
      req,
      startDate ? { createdAt: { gte: startDate } } : {}
    );

    const leads = await prisma.lead.findMany({
      where: leadWhere,
      select: {
        source: true,
        createdAt: true,
        deals: {
          select: {
            isWon: true,
            createdAt: true,
            closedAt: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    type VelocityAccum = {
      count: number;
      qualifiedCount: number;
      totalDaysToFirstDeal: number;
      totalDaysToWin: number;
      wonCount: number;
    };

    const bySource: Record<string, VelocityAccum> = {};

    for (const lead of leads) {
      const src = lead.source || 'unknown';
      if (!bySource[src]) {
        bySource[src] = {
          count: 0,
          qualifiedCount: 0,
          totalDaysToFirstDeal: 0,
          totalDaysToWin: 0,
          wonCount: 0,
        };
      }

      bySource[src].count += 1;
      const firstDeal = lead.deals[0];

      if (firstDeal) {
        bySource[src].qualifiedCount += 1;
        const daysToFirstDeal =
          (firstDeal.createdAt.getTime() - lead.createdAt.getTime()) / 86_400_000;
        bySource[src].totalDaysToFirstDeal += daysToFirstDeal;

        if (firstDeal.isWon && firstDeal.closedAt) {
          bySource[src].wonCount += 1;
          const daysToWin =
            (firstDeal.closedAt.getTime() - lead.createdAt.getTime()) / 86_400_000;
          bySource[src].totalDaysToWin += daysToWin;
        }
      }
    }

    const rows = Object.entries(bySource).map(([source, accum]) => ({
      source,
      leads: accum.count,
      qualified: accum.qualifiedCount,
      avgDaysToFirstDeal:
        accum.qualifiedCount > 0
          ? Math.round(accum.totalDaysToFirstDeal / accum.qualifiedCount)
          : null,
      won: accum.wonCount,
      avgDaysToWin:
        accum.wonCount > 0
          ? Math.round(accum.totalDaysToWin / accum.wonCount)
          : null,
    }));

    rows.sort((a, b) => b.leads - a.leads);

    res.json({ success: true, data: { range, sources: rows } });
  } catch (error) {
    next(error);
  }
});

export default router;
