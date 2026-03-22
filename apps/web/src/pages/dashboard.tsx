import { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  Percent,
  BarChart3,
  PieChart as PieChartIcon,
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
        <div className="text-on_surface_variant">Loading dashboard...</div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-on_surface_variant mt-1">
          Overview of your sales performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on_surface_variant">
              Total Leads
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.totalLeads ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on_surface_variant">
              Total Deals
            </CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.totalDeals ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on_surface_variant">
              Won Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(stats?.wonRevenue ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on_surface_variant">
              Conversion Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tertiary">
              {((stats?.conversionRate ?? 0) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#454651" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#c6c5d3" fontSize={12} />
                  <YAxis stroke="#c6c5d3" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171f33',
                      border: '1px solid #454651',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#bcc3ff" radius={[4, 4, 0, 0]} />
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
                        backgroundColor: '#171f33',
                        border: '1px solid #454651',
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
                <div className="text-on_surface_variant">No deals data</div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#454651" opacity={0.3} />
                <XAxis dataKey="month" stroke="#c6c5d3" fontSize={12} />
                <YAxis
                  stroke="#c6c5d3"
                  fontSize={12}
                  tickFormatter={(value: number) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171f33',
                    border: '1px solid #454651',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4ae176"
                  strokeWidth={2}
                  dot={{ fill: '#4ae176', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
