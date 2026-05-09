import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  AlertCircle,
  Plus,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import type { TargetAchievement, TargetScope, TargetPeriod, SalesTeam } from '@/types';

export function TargetsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TargetAchievement | null>(null);
  const [scope, setScope] = useState<TargetScope>('company');
  const [period] = useState<TargetPeriod>('yearly');
  const [year] = useState(2026); 
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const [teams, setTeams] = useState<SalesTeam[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    async function fetchLookups() {
      const [teamsRes, usersRes] = await Promise.all([
        get<SalesTeam[]>('/targets/teams'),
        get<{ id: string; name: string; email: string }[]>('/users/lookup')
      ]);
      if (teamsRes.success && teamsRes.data) setTeams(teamsRes.data);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
    }
    fetchLookups();
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        year: year.toString(),
        scope,
        period,
      });
      if (scope === 'team' && selectedTeamId) query.append('teamId', selectedTeamId);
      if (scope === 'individual' && selectedUserId) query.append('userId', selectedUserId);

      const response = await get<TargetAchievement>(`/dashboard/targets?${query.toString()}`);
      if (response.success && response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch target data');
      }
    } catch (err) {
      setError('An error occurred while fetching targets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [scope, period, selectedTeamId, selectedUserId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp');
  };

  const getAchievementColor = (pct: number) => {
    if (pct >= 100) return 'text-[#4ae176] bg-[#4ae176]/10';
    if (pct >= 80) return 'text-lime-400 bg-lime-400/10';
    if (pct >= 60) return 'text-amber-400 bg-amber-400/10';
    if (pct >= 40) return 'text-orange-400 bg-orange-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  const getAchievementBorder = (pct: number) => {
    if (pct >= 100) return 'border-[#4ae176]/30';
    if (pct >= 80) return 'border-lime-400/30';
    if (pct >= 60) return 'border-amber-400/30';
    if (pct >= 40) return 'border-orange-400/30';
    return 'border-red-400/30';
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Sales Targets</h1>
          <p className="text-on-surface-variant mt-1">Track revenue, leads, and deals achievement across the company.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as TargetScope);
              setSelectedTeamId('');
              setSelectedUserId('');
            }}
            className="bg-white border border-slate-200 text-on-surface text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none shadow-sm hover:bg-slate-50 transition-colors"
          >
            <option value="company">Company Wide</option>
            <option value="team">Sales Team</option>
            <option value="individual">Individual</option>
          </select>

          {scope === 'team' && (
            <select 
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-white border border-slate-200 text-on-surface text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none shadow-sm hover:bg-slate-50 transition-colors"
            >
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}

          {scope === 'individual' && (
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-white border border-slate-200 text-on-surface text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none shadow-sm hover:bg-slate-50 transition-colors"
            >
              <option value="">All Users</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}

          <button className="flex items-center gap-2 bg-gradient-to-br from-primary to-[#2A3BB0] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Set Target
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container rounded-[2rem] p-6 border border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getAchievementColor(data.achievementPct))}>
                    {data.achievementPct.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">Revenue Actual</h3>
                <p className="text-2xl font-black text-on-surface mt-1">{formatCurrency(data.revenueActual)}</p>
                <p className="text-xs text-on-surface-variant mt-2">Target: {formatCurrency(data.revenueTarget)}</p>
              </div>
            </div>

            <div className="bg-surface-container rounded-[2rem] p-6 border border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ae176]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-[#4ae176]/10 text-[#4ae176]">
                    <Users className="h-6 w-6" />
                  </div>
                  {data.leadsTarget && (
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getAchievementColor((data.leadsActual / data.leadsTarget) * 100))}>
                      {((data.leadsActual / data.leadsTarget) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">Leads Generated</h3>
                <p className="text-2xl font-black text-on-surface mt-1">{data.leadsActual}</p>
                <p className="text-xs text-on-surface-variant mt-2">Target: {data.leadsTarget || '-'}</p>
              </div>
            </div>

            <div className="bg-surface-container rounded-[2rem] p-6 border border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-400/10 text-amber-400">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  {data.dealsTarget && (
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getAchievementColor((data.dealsActual / data.dealsTarget) * 100))}>
                      {((data.dealsActual / data.dealsTarget) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">Deals Won</h3>
                <p className="text-2xl font-black text-on-surface mt-1">{data.dealsActual}</p>
                <p className="text-xs text-on-surface-variant mt-2">Target: {data.dealsTarget || '-'}</p>
              </div>
            </div>

            <div className="bg-surface-container rounded-[2rem] p-6 border border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">Remaining Target</h3>
                <p className={cn("text-2xl font-black mt-1", data.remainingTarget <= 0 ? "text-[#4ae176]" : "text-on-surface")}>
                  {data.remainingTarget <= 0 ? 'GOAL REACHED' : formatCurrency(data.remainingTarget)}
                </p>
                <p className="text-xs text-on-surface-variant mt-2">To reach {year} goal</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown */}
            <div className="lg:col-span-1 bg-surface-container rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-on-surface tracking-tight">Category Mix</h2>
              </div>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="actual"
                      nameKey="name"
                    >
                      {data.categories.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#bcc3ff', // Primary
                          '#4ae176', // Success
                          '#fde047', // Amber
                          '#fb923c', // Orange
                        ][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171f33', border: 'none', borderRadius: '1rem', color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-3">
                {data.categories.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [
                        '#bcc3ff', '#4ae176', '#fde047', '#fb923c'
                      ][i % 4] }} />
                      <span className="text-sm font-bold text-on-surface">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-on-surface">{cat.pct.toFixed(1)}%</p>
                      <p className="text-[10px] text-on-surface-variant">{formatCurrency(cat.actual)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="lg:col-span-2 bg-surface-container rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-on-surface tracking-tight">Monthly Achievement</h2>
                </div>
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#171f33', border: 'none', borderRadius: '1rem', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Bar dataKey="target" name="Target" fill="#ffffff10" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" radius={[8, 8, 0, 0]}>
                      {data.monthlyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pct >= 100 ? '#4ae176' : '#bcc3ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Achievement Table */}
          <div className="bg-surface-container rounded-[2.5rem] overflow-hidden border border-white/5">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xl font-black text-on-surface tracking-tight">Performance Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Period</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Target</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Actual</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Achievement</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Share of Q</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.monthlyBreakdown.map((item) => (
                    <tr key={item.month} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-on-surface">{item.month}</span>
                          <span className="text-[10px] font-bold text-primary/50 uppercase tracking-widest">Q{item.quarter}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-on-surface">{formatCurrency(item.target)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-on-surface">{formatCurrency(item.actual)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "inline-flex items-center justify-center min-w-[70px] px-3 py-1 rounded-full text-xs font-black border",
                          getAchievementColor(item.pct),
                          getAchievementBorder(item.pct)
                        )}>
                          {item.pct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-on-surface-variant">{item.shareOfParent ? `${item.shareOfParent}%` : '-'}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={cn("text-sm font-medium", item.remaining <= 0 ? "text-[#4ae176]" : "text-on-surface-variant")}>
                          {item.remaining <= 0 ? '✓' : formatCurrency(item.remaining)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard for Team/Company scope */}
          {scope !== 'individual' && data.leaderboard.length > 0 && (
            <div className="bg-surface-container rounded-[2.5rem] p-8 border border-white/5">
              <h2 className="text-xl font-black text-on-surface tracking-tight mb-8">Individual Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.leaderboard.map((member, index) => (
                  <div key={member.userId} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-on-surface truncate">{member.userName}</h4>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                        {formatCurrency(member.actual)} / {formatCurrency(member.target)}
                      </p>
                      <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", member.pct >= 100 ? "bg-[#4ae176]" : "bg-primary")}
                          style={{ width: `${Math.min(member.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-xs font-black", member.pct >= 100 ? "text-[#4ae176]" : "text-primary")}>
                        {member.pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
