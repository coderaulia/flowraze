import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, CreditCard, TrendingUp, ChevronRight } from 'lucide-react';
import { get } from '@/lib/api';
import type { Company } from '@/types';

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  activeSeats: number;
  estimatedMRR: number;
  planDistribution: Record<string, number>;
  billingStatusDistribution: Record<string, number>;
}

interface AdminOverviewResponse {
  stats: PlatformStats;
  recentCompanies: Company[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const overviewRes = await get<AdminOverviewResponse>('/admin/overview');

    if (overviewRes.success && overviewRes.data) {
      setCompanies(overviewRes.data.recentCompanies);
      setStats(overviewRes.data.stats);
    } else {
      setError(overviewRes.error || 'Failed to load platform data');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    {
      label: 'Total Companies',
      value: stats?.totalCompanies ?? '—',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/companies',
    },
    {
      label: 'Active Companies',
      value: stats?.activeCompanies ?? '—',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/admin/companies',
    },
    {
      label: 'Active Users',
      value: stats ? `${stats.activeUsers}/${stats.totalUsers}` : '—',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/admin/users',
    },
    {
      label: 'Estimated MRR',
      value: stats ? formatRupiah(stats.estimatedMRR) : '—',
      icon: CreditCard,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: '/admin/billing',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Platform Overview</h1>
        <p className="text-on-surface-variant mt-1">Superadmin — platform-wide visibility</p>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            to={href}
            className="rounded-xl bg-white border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 text-2xl font-bold text-primary">
              {isLoading ? <span className="animate-pulse">...</span> : value}
            </p>
            <p className="text-sm text-on-surface-variant">{label}</p>
          </Link>
        ))}
      </div>

      {!isLoading && stats && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-white border border-gray-200 p-5">
            <h2 className="font-semibold text-primary">Plan Distribution</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['starter', 'growth', 'custom'].map((plan) => (
                <div key={plan} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs uppercase text-on-surface-variant">{plan}</p>
                  <p className="mt-1 text-xl font-semibold text-primary">
                    {stats.planDistribution[plan] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-5">
            <h2 className="font-semibold text-primary">Billing Health</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['trialing', 'active', 'past_due', 'canceled'].map((status) => (
                <div key={status} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs uppercase text-on-surface-variant">{status}</p>
                  <p className="mt-1 text-xl font-semibold text-primary">
                    {stats.billingStatusDistribution[status] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-primary">Recent Companies</h2>
          <Link
            to="/admin/companies"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-on-surface-variant text-sm">
            Loading...
          </div>
        ) : companies.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-on-surface-variant text-sm">
            No companies yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {companies.map((company) => (
              <li key={company.id}>
                <Link
                  to={`/admin/companies/${company.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                      <p className="text-xs text-on-surface-variant">{company.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {company._count && (
                      <span className="text-xs text-on-surface-variant">
                        {company._count.users} users
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        company.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
