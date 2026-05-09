import { useEffect, useMemo, useState } from 'react';
import { ActivityFeed } from '@/components/activity-feed';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  UserPlus,
  FolderOpen,
  CalendarRange,
  RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { get } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { TooltipProps } from 'recharts';

interface DashboardStats {
  range: DashboardRange;
  totalLeads: number;
  totalDeals: number;
  wonRevenue: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  revenueOverTime: { month: string; revenue: number }[];
  leadsOverTime: { month: string; leads: number }[];
  dealsByStage: Record<string, number>;
}

type DashboardRange = '30d' | '90d' | '6m' | '12m' | 'all';
type ChartDatum = { name: string; value: number };

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
  { value: 'all', label: 'All' },
];

const STAGE_COLORS: Record<string, string> = {
  new: '#bcc3ff',
  qualified: '#4ae176',
  proposal: '#ffb595',
  negotiation: '#ff6b6b',
  won: '#4ae176',
  lost: '#ffb4ab',
};

const SOURCE_COLORS = ['#1e2a78', '#4ae176', '#ffb595', '#7dd3fc', '#f0abfc', '#c4b5fd'];

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center rounded-lg bg-surface-container-high/60 px-6 text-center">
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

function DashboardTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = Number(payload[0]?.value ?? 0);
  const name = payload[0]?.name || 'Value';
  const isRevenue = name === 'Revenue' || payload[0]?.dataKey === 'revenue';

  return (
    <div className="rounded-lg bg-surface-container-high px-3 py-2 text-sm">
      <p className="font-semibold text-on-surface">{label}</p>
      <p className="text-on-surface-variant">
        {isRevenue ? formatCurrency(value) : value.toLocaleString('id-ID')}
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'neutral';
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/15 text-tertiary',
    neutral: 'bg-surface-container-high text-primary',
  };

  return (
    <Card className="transition-colors hover:bg-surface-container-high">
      <CardHeader className="flex flex-row items-start justify-between pb-5">
        <div className={cn('rounded-lg p-3', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded bg-surface-container-high px-2 py-1 text-xs font-semibold text-on-surface-variant">
          Live
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
        <h3 className="mt-2 text-2xl font-black text-on-surface">{value}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<DashboardRange>('6m');
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError('');
      const response = await get<DashboardStats>(`/dashboard?range=${range}`);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setStats(null);
        setError(response.error || 'Unable to load dashboard data');
      }
      setIsLoading(false);
    };
    fetchStats();
  }, [range, refreshNonce]);

  const leadsBySourceData = useMemo<ChartDatum[]>(
    () =>
      stats
        ? Object.entries(stats.leadsBySource)
          .map(([source, count]) => ({ name: source, value: count }))
          .sort((a, b) => b.value - a.value)
        : [],
    [stats]
  );

  const dealsByStageData = useMemo<ChartDatum[]>(
    () =>
      stats
        ? Object.entries(stats.dealsByStage)
          .map(([stage, count]) => ({
            name: STAGE_LABELS[stage] || stage,
            value: count,
          }))
          .filter((stage) => stage.value > 0)
        : [],
    [stats]
  );

  const hasRevenueData = Boolean(stats?.revenueOverTime.some((item) => item.revenue > 0));
  const hasSourceData = leadsBySourceData.some((item) => item.value > 0);
  const hasStageData = dealsByStageData.some((item) => item.value > 0);
  const hasLeadsOverTime = Boolean(stats?.leadsOverTime.some((item) => item.leads > 0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Performance Overview</h1>
          <p className="mt-1 text-on-surface-variant">
            Pipeline movement, conversion, and revenue for the selected period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-surface-container px-2 py-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={cn(
                  'h-8 rounded px-3 text-sm font-semibold transition-colors',
                  range === option.value
                    ? 'bg-primary text-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
                type="button"
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setRefreshNonce((value) => value + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          detail="Closed-won deal value"
          icon={DollarSign}
          label="Won Revenue"
          tone="primary"
          value={formatCurrency(stats?.wonRevenue ?? 0)}
        />
        <StatCard
          detail="Leads created in range"
          icon={UserPlus}
          label="New Leads"
          tone="secondary"
          value={(stats?.totalLeads ?? 0).toLocaleString('id-ID')}
        />
        <StatCard
          detail="Deals created in range"
          icon={FolderOpen}
          label="Deals"
          tone="tertiary"
          value={(stats?.totalDeals ?? 0).toLocaleString('id-ID')}
        />
        <StatCard
          detail="Won deals divided by leads"
          icon={TrendingUp}
          label="Conversion Rate"
          tone="neutral"
          value={`${((stats?.conversionRate ?? 0) * 100).toFixed(1)}%`}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-secondary" />
              Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 lg:h-80">
              {hasSourceData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsBySourceData} margin={{ left: -18, right: 8, top: 12 }}>
                    <CartesianGrid stroke="#dfe3ea" vertical={false} />
                    <XAxis dataKey="name" stroke="#464555" fontSize={12} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#464555" fontSize={12} tickLine={false} />
                    <Tooltip content={<DashboardTooltip />} cursor={{ fill: '#e6e8ea' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {leadsBySourceData.map((entry, index) => (
                        <Cell key={entry.name} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmptyState label="Create leads with source values to see acquisition channels here." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-secondary" />
              Deals by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 lg:h-80 flex items-center justify-center">
              {hasStageData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<DashboardTooltip />} />
                    <Pie
                      data={dealsByStageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                      paddingAngle={2}
                    >
                      {dealsByStageData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={STAGE_COLORS[entry.name.toLowerCase()] || '#bcc3ff'}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmptyState label="Add deals to start seeing how the pipeline is distributed." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-72 lg:h-80">
                {hasRevenueData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.revenueOverTime || []} margin={{ left: 0, right: 20, top: 12 }}>
                      <CartesianGrid stroke="#dfe3ea" vertical={false} />
                      <XAxis dataKey="month" stroke="#464555" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#464555"
                        fontSize={12}
                        tickFormatter={(value: number) => formatCompactCurrency(value)}
                        tickLine={false}
                      />
                      <Tooltip content={<DashboardTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#1e2a78' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState label="Mark deals as won to populate revenue movement across this range." />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed className="h-[360px] lg:h-full lg:min-h-[400px]" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-secondary" />
            Leads Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72">
            {hasLeadsOverTime ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.leadsOverTime || []} margin={{ left: -18, right: 8, top: 12 }}>
                  <CartesianGrid stroke="#dfe3ea" vertical={false} />
                  <XAxis dataKey="month" stroke="#464555" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="#464555" fontSize={12} tickLine={false} />
                  <Tooltip content={<DashboardTooltip />} />
                  <Bar dataKey="leads" name="Leads" radius={[6, 6, 0, 0]} fill="#bcc3ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState label="Leads created in the selected range will appear here month by month." />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
