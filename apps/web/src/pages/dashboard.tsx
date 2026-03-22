import { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  UserPlus,
  FolderOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { get } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
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

interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
  wonRevenue: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  revenueOverTime: { month: string; revenue: number }[];
  dealsByStage: Record<string, number>;
}

const STAGE_COLORS: Record<string, string> = {
  new: '#bcc3ff',
  qualified: '#4ae176',
  proposal: '#ffb595',
  negotiation: '#ff6b6b',
  won: '#4ae176',
  lost: '#ffb4ab',
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await get<DashboardStats>('/dashboard');
      if (response.success && response.data) {
        setStats(response.data);
      }
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Loading dashboard...</div>
      </div>
    );
  }

  const leadsBySourceData = stats
    ? Object.entries(stats.leadsBySource).map(([source, count]) => ({
        name: source,
        value: count,
      }))
    : [];

  const dealsByStageData = stats
    ? Object.entries(stats.dealsByStage).map(([stage, count]) => ({
        name: stage,
        value: count,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Architectural Overview</h1>
        <p className="text-on-surface-variant mt-1">
          Status of your high-value pipeline as of today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="p-3 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">+12.4%</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Won Revenue</p>
            <h3 className="text-2xl font-black mt-1 text-on-surface">{formatCurrency(stats?.wonRevenue ?? 0)}</h3>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="p-3 rounded-lg bg-secondary/5 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors duration-500">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">+8.1%</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">New Leads</p>
            <h3 className="text-2xl font-black mt-1 text-on-surface">{stats?.totalLeads ?? 0}</h3>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="p-3 rounded-lg bg-tertiary/5 text-tertiary group-hover:bg-tertiary group-hover:text-white transition-colors duration-500">
              <FolderOpen className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Stable</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Open Deals</p>
            <h3 className="text-2xl font-black mt-1 text-on-surface">{stats?.totalDeals ?? 0}</h3>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors duration-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">-2.4%</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Conversion Rate</p>
            <h3 className="text-2xl font-black mt-1 text-on-surface">{((stats?.conversionRate ?? 0) * 100).toFixed(1)}%</h3>
          </CardContent>
        </Card>
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsBySourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#1E2A78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="h-64 flex items-center justify-center">
              {dealsByStageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Pie
                      data={dealsByStageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {dealsByStageData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={STAGE_COLORS[entry.name] || '#bcc3ff'}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-on-surface-variant">No deals data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Revenue Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.revenueOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value: number) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
