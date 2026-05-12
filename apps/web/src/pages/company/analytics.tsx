import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  GitMerge,
  Megaphone,
  Zap,
  RefreshCw,
  CalendarRange,
  BarChart3,
  ArrowRight,
  ArrowDown,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { get } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '12m' | 'all';

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '12m', label: '12M' },
  { value: 'all', label: 'All' },
];

interface FunnelRow {
  stage: string;
  count: number;
  conversionFromPrev: number | null;
}

interface FunnelData {
  range: DateRange;
  funnel: FunnelRow[];
  lost: number;
  totalDeals: number;
  overallConversion: number;
}

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  type: string | null;
  cost: number;
  leads: number;
  deals: number;
  wonDeals: number;
  revenue: number;
  costPerLead: number | null;
  roas: number | null;
  conversionRate: number;
}

interface AttributionData {
  range: DateRange;
  campaigns: CampaignRow[];
  totals: {
    cost: number;
    leads: number;
    deals: number;
    wonDeals: number;
    revenue: number;
    roas: number | null;
  };
}

interface ForecastData {
  historyMonths: number;
  forecastMonths: number;
  rSquared: number;
  historical: { label: string; revenue: number }[];
  forecast: { label: string; projected: number }[];
}

interface VelocityRow {
  source: string;
  leads: number;
  qualified: number;
  avgDaysToFirstDeal: number | null;
  won: number;
  avgDaysToWin: number | null;
}

interface VelocityData {
  range: DateRange;
  sources: VelocityRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  new: '#bcc3ff',
  qualified: '#7dd3fc',
  proposal: '#f0abfc',
  negotiation: '#ffb595',
  won: '#4ae176',
};

const CHANNEL_COLORS = [
  '#bcc3ff', '#4ae176', '#ffb595', '#7dd3fc', '#f0abfc', '#c4b5fd', '#fde68a',
];

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function AnalyticsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-surface-container-high px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-on-surface">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-on-surface-variant">
          {p.name}:{' '}
          <span className="font-semibold text-on-surface">
            {p.dataKey === 'revenue' || p.dataKey === 'projected'
              ? formatCurrency(Number(p.value))
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl bg-surface-container-high/60 px-6 text-center">
      <div>
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-on-surface">No data yet</p>
        <p className="mt-1 max-w-xs text-sm text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

// ─── Sub-panel: Funnel ───────────────────────────────────────────────────────

function FunnelPanel({ range }: { range: DateRange }) {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<FunnelData>(`/analytics/funnel?range=${range}`).then((res) => {
      setData(res.success && res.data ? res.data : null);
      setLoading(false);
    });
  }, [range]);

  if (loading) return <div className="flex h-64 items-center justify-center text-on-surface-variant">Loading funnel…</div>;
  if (!data) return <EmptyState label="Create deals to see how they move through your pipeline." />;

  const chartData = data.funnel.map((row) => ({
    name: row.stage.charAt(0).toUpperCase() + row.stage.slice(1),
    value: row.count,
    fill: STAGE_COLORS[row.stage] ?? '#bcc3ff',
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-container-high px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Total Deals</p>
          <p className="mt-2 text-2xl font-black text-on-surface">{data.totalDeals.toLocaleString('id-ID')}</p>
        </div>
        <div className="rounded-xl bg-surface-container-high px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Overall Conversion</p>
          <p className="mt-2 text-2xl font-black text-secondary">{pct(data.overallConversion)}</p>
        </div>
        <div className="rounded-xl bg-surface-container-high px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Lost Deals</p>
          <p className="mt-2 text-2xl font-black text-error">{data.lost.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Funnel bars */}
      <div className="space-y-3">
        {data.funnel.map((row, i) => {
          const maxCount = data.funnel[0]?.count ?? 1;
          const widthPct = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
          return (
            <div key={row.stage}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold capitalize text-on-surface">{row.stage}</span>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span>{row.count.toLocaleString('id-ID')} deals</span>
                  {row.conversionFromPrev !== null && (
                    <span className="flex items-center gap-1 text-xs">
                      <ArrowDown className="h-3 w-3" />
                      {pct(row.conversionFromPrev)} from prev
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8 overflow-hidden rounded-lg bg-surface-container-high">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: STAGE_COLORS[row.stage] ?? '#bcc3ff',
                  }}
                />
              </div>
              {i < data.funnel.length - 1 && (
                <div className="mt-1 flex items-center gap-1.5 pl-2 text-xs text-on-surface-variant">
                  <ArrowRight className="h-3 w-3" />
                  {row.conversionFromPrev !== null
                    ? `${pct(row.conversionFromPrev)} move to next stage`
                    : '—'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recharts funnel visualization */}
      {chartData.some((d) => d.value > 0) && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={<AnalyticsTooltip />} />
              <Funnel dataKey="value" data={chartData} isAnimationActive>
                <LabelList
                  position="inside"
                  fill="#0b1326"
                  stroke="none"
                  dataKey="name"
                  fontSize={12}
                  fontWeight={700}
                />
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Sub-panel: Attribution ──────────────────────────────────────────────────

function AttributionPanel({ range }: { range: DateRange }) {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<AttributionData>(`/analytics/attribution?range=${range}`).then((res) => {
      setData(res.success && res.data ? res.data : null);
      setLoading(false);
    });
  }, [range]);

  if (loading) return <div className="flex h-64 items-center justify-center text-on-surface-variant">Loading attribution…</div>;
  if (!data || data.campaigns.length === 0) return <EmptyState label="Create campaigns and link leads to see attribution here." />;

  const topChannels = (() => {
    const channelMap: Record<string, number> = {};
    for (const c of data.campaigns) {
      channelMap[c.channel] = (channelMap[c.channel] ?? 0) + c.revenue;
    }
    return Object.entries(channelMap)
      .map(([channel, revenue]) => ({ channel, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  })();

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Campaigns', value: data.campaigns.length.toString() },
          { label: 'Leads Generated', value: data.totals.leads.toLocaleString('id-ID') },
          { label: 'Revenue Won', value: formatCurrency(data.totals.revenue) },
          { label: 'Overall ROAS', value: data.totals.roas !== null ? `${data.totals.roas.toFixed(2)}x` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-surface-container-high px-5 py-4">
            <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">{label}</p>
            <p className="mt-2 text-xl font-black text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue by channel bar chart */}
      {topChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topChannels} margin={{ left: 0, right: 12, top: 8 }}>
                  <CartesianGrid stroke="#dfe3ea" vertical={false} />
                  <XAxis dataKey="channel" stroke="#464555" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#464555"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
                    }
                  />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                    {topChannels.map((entry, i) => (
                      <Cell key={entry.channel} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-campaign table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Attribution Table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container-high text-left">
                {['Campaign', 'Channel', 'Leads', 'Won', 'Revenue', 'Cost/Lead', 'ROAS', 'Conv.'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-surface-container-high/60 transition-colors hover:bg-surface-container-high/40"
                >
                  <td className="px-4 py-3 font-semibold text-on-surface">{c.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant capitalize">{c.channel}</td>
                  <td className="px-4 py-3 text-on-surface">{c.leads}</td>
                  <td className="px-4 py-3 text-secondary font-semibold">{c.wonDeals}</td>
                  <td className="px-4 py-3 font-semibold text-on-surface">{formatCurrency(c.revenue)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {c.costPerLead !== null ? formatCurrency(c.costPerLead) : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {c.roas !== null ? `${c.roas.toFixed(2)}x` : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{pct(c.conversionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-panel: Forecast ─────────────────────────────────────────────────────

function ForecastPanel() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<ForecastData>('/analytics/forecast').then((res) => {
      setData(res.success && res.data ? res.data : null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-on-surface-variant">Loading forecast…</div>;
  if (!data) return <EmptyState label="Win deals to generate a revenue forecast." />;

  const combined = [
    ...data.historical.map((h) => ({
      label: h.label,
      revenue: h.revenue,
      projected: undefined as number | undefined,
    })),
    ...data.forecast.map((f) => ({
      label: f.label,
      revenue: undefined as number | undefined,
      projected: f.projected,
    })),
  ];

  const confidenceLabel =
    data.rSquared >= 0.75 ? 'High confidence' :
    data.rSquared >= 0.4 ? 'Moderate confidence' : 'Low confidence (limited history)';

  const confidenceColor =
    data.rSquared >= 0.75 ? 'text-secondary' :
    data.rSquared >= 0.4 ? 'text-warning' : 'text-error';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {data.forecast.map((f) => (
          <div key={f.label} className="rounded-xl bg-primary/10 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">{f.label} Projection</p>
            <p className="mt-2 text-2xl font-black text-primary">{formatCurrency(f.projected)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-on-surface-variant">Model confidence (R²):</span>
        <span className={cn('font-semibold', confidenceColor)}>
          {(data.rSquared * 100).toFixed(1)}% — {confidenceLabel}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue History + 3-Month Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combined} margin={{ left: 0, right: 24, top: 12 }}>
                <CartesianGrid stroke="#dfe3ea" vertical={false} />
                <XAxis dataKey="label" stroke="#464555" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#464555"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
                  }
                />
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Actual Revenue"
                  stroke="#4ae176"
                  strokeWidth={3}
                  dot={{ fill: '#4ae176', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Forecast"
                  stroke="#bcc3ff"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ fill: '#bcc3ff', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-on-surface-variant">
        Linear regression over the last {data.historyMonths} months of closed-won revenue. Forecast is indicative only — actual performance may vary.
      </p>
    </div>
  );
}

// ─── Sub-panel: Lead Velocity ────────────────────────────────────────────────

function VelocityPanel({ range }: { range: DateRange }) {
  const [data, setData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<VelocityData>(`/analytics/lead-velocity?range=${range}`).then((res) => {
      setData(res.success && res.data ? res.data : null);
      setLoading(false);
    });
  }, [range]);

  if (loading) return <div className="flex h-64 items-center justify-center text-on-surface-variant">Loading velocity…</div>;
  if (!data || data.sources.length === 0) return <EmptyState label="Link leads to deals to measure how quickly they convert per source." />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Average days from lead creation to first deal, and to won — by source.
      </p>
      <div className="overflow-x-auto rounded-xl border border-surface-container-high">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-container-high bg-surface-container text-left">
              {['Source', 'Leads', 'Qualified', 'Avg Days → Deal', 'Won', 'Avg Days → Win'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sources.map((row) => (
              <tr
                key={row.source}
                className="border-b border-surface-container-high/60 transition-colors hover:bg-surface-container-high/40"
              >
                <td className="px-4 py-3 font-semibold capitalize text-on-surface">{row.source}</td>
                <td className="px-4 py-3 text-on-surface">{row.leads}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.qualified}</td>
                <td className="px-4 py-3">
                  {row.avgDaysToFirstDeal !== null ? (
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {row.avgDaysToFirstDeal}d
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-secondary">{row.won}</td>
                <td className="px-4 py-3">
                  {row.avgDaysToWin !== null ? (
                    <span className="flex items-center gap-1 font-semibold text-on-surface">
                      <Clock className="h-3.5 w-3.5 text-secondary" />
                      {row.avgDaysToWin}d
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'funnel' | 'attribution' | 'forecast' | 'velocity';

const TABS: { id: Tab; label: string; icon: typeof GitMerge }[] = [
  { id: 'funnel', label: 'Conversion Funnel', icon: GitMerge },
  { id: 'attribution', label: 'Campaign Attribution', icon: Megaphone },
  { id: 'forecast', label: 'Revenue Forecast', icon: TrendingUp },
  { id: 'velocity', label: 'Lead Velocity', icon: Zap },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('funnel');
  const [range, setRange] = useState<DateRange>('30d');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Growth Analytics</h1>
          <p className="mt-1 text-on-surface-variant">
            Funnel conversion, campaign attribution, revenue forecast, and lead velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-surface-container px-2 py-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'h-8 rounded px-3 text-sm font-semibold transition-colors',
                  range === opt.value
                    ? 'bg-primary text-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface-container p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
              tab === id
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div key={`${tab}-${range}-${refreshKey}`}>
        {tab === 'funnel' && <FunnelPanel range={range} />}
        {tab === 'attribution' && <AttributionPanel range={range} />}
        {tab === 'forecast' && <ForecastPanel />}
        {tab === 'velocity' && <VelocityPanel range={range} />}
      </div>
    </div>
  );
}
