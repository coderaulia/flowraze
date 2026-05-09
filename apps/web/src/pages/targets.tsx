import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Pencil,
  PieChart as PieChartIcon,
  Plus,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { del, get, post, put } from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import type {
  SalesTarget,
  SalesTeam,
  TargetAchievement,
  TargetPeriod,
  TargetScope,
} from '@/types';

type LookupUser = { id: string; name: string; email: string };

type TargetFormData = {
  name: string;
  scope: TargetScope;
  period: TargetPeriod;
  year: string;
  quarter: string;
  month: string;
  targetValue: string;
  targetLeads: string;
  targetDeals: string;
  category: string;
  shareOfParent: string;
  teamId: string;
  userId: string;
};

type TeamFormData = {
  name: string;
  managerId: string;
};

const PERIOD_OPTIONS: { value: TargetPeriod; label: string }[] = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
];

const TARGET_SET_PERIOD_OPTIONS: { value: TargetPeriod; label: string }[] = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
];

const SCOPE_OPTIONS: { value: TargetScope; label: string }[] = [
  { value: 'company', label: 'Company' },
  { value: 'team', label: 'Team' },
  { value: 'individual', label: 'Individual' },
];

const MONTH_OPTIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const TARGET_QUARTER_STYLES: Record<number, { badge: string; marker: string; row: string; summaryRow: string }> = {
  1: {
    badge: 'bg-primary/15 text-primary',
    marker: 'bg-primary',
    row: 'bg-primary/[0.055] hover:bg-primary/[0.09]',
    summaryRow: 'bg-primary/[0.14] hover:bg-primary/[0.18]',
  },
  2: {
    badge: 'bg-[#4ae176]/15 text-[#4ae176]',
    marker: 'bg-[#4ae176]',
    row: 'bg-[#4ae176]/[0.055] hover:bg-[#4ae176]/[0.09]',
    summaryRow: 'bg-[#4ae176]/[0.14] hover:bg-[#4ae176]/[0.18]',
  },
  3: {
    badge: 'bg-amber-400/15 text-amber-300',
    marker: 'bg-amber-400',
    row: 'bg-amber-400/[0.065] hover:bg-amber-400/[0.1]',
    summaryRow: 'bg-amber-400/[0.16] hover:bg-amber-400/[0.2]',
  },
  4: {
    badge: 'bg-sky-400/15 text-sky-300',
    marker: 'bg-sky-400',
    row: 'bg-sky-400/[0.06] hover:bg-sky-400/[0.095]',
    summaryRow: 'bg-sky-400/[0.15] hover:bg-sky-400/[0.19]',
  },
};

const CHART_TOOLTIP_STYLES = {
  contentStyle: {
    backgroundColor: '#171f33',
    border: 'none',
    borderRadius: '1rem',
    color: '#f8fafc',
  },
  itemStyle: { color: '#f8fafc' },
  labelStyle: { color: '#f8fafc', fontWeight: 700 },
};

const emptyTargetForm = (year: number, scope: TargetScope): TargetFormData => ({
  name: '',
  scope,
  period: 'yearly',
  year: String(year),
  quarter: '',
  month: '',
  targetValue: '',
  targetLeads: '',
  targetDeals: '',
  category: '',
  shareOfParent: '',
  teamId: '',
  userId: '',
});

const emptyTeamForm: TeamFormData = {
  name: '',
  managerId: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp');
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  return toNumber(value);
}

function quarterForMonth(month: string) {
  const monthNumber = optionalNumber(month);
  return monthNumber ? Math.ceil(monthNumber / 3) : undefined;
}

function getAchievementColor(pct: number) {
  if (pct >= 100) return 'text-[#4ae176] bg-[#4ae176]/10';
  if (pct >= 80) return 'text-lime-400 bg-lime-400/10';
  if (pct >= 60) return 'text-amber-400 bg-amber-400/10';
  if (pct >= 40) return 'text-orange-400 bg-orange-400/10';
  return 'text-red-400 bg-red-400/10';
}

function getAchievementBorder(pct: number) {
  if (pct >= 100) return 'border-[#4ae176]/30';
  if (pct >= 80) return 'border-lime-400/30';
  if (pct >= 60) return 'border-amber-400/30';
  if (pct >= 40) return 'border-orange-400/30';
  return 'border-red-400/30';
}

function buildTargetForm(target: SalesTarget): TargetFormData {
  return {
    name: target.name,
    scope: target.scope,
    period: target.period,
    year: String(target.year),
    quarter: target.quarter ? String(target.quarter) : '',
    month: target.month ? String(target.month) : '',
    targetValue: String(target.targetValue),
    targetLeads: target.targetLeads ? String(target.targetLeads) : '',
    targetDeals: target.targetDeals ? String(target.targetDeals) : '',
    category: target.category ?? '',
    shareOfParent: target.shareOfParent ? String(target.shareOfParent) : '',
    teamId: target.teamId ?? '',
    userId: target.userId ?? '',
  };
}

function getTargetFamilyKey(target: SalesTarget) {
  return [
    target.scope,
    target.scope === 'team' ? target.teamId ?? 'unassigned-team' : '',
    target.scope === 'individual' ? target.userId ?? 'unassigned-user' : '',
    target.year,
  ].join(':');
}

function isTargetSet(target: SalesTarget, yearlyTargetKeys: Set<string>) {
  if (target.category) return false;
  if (target.period === 'yearly') return true;
  return target.period === 'monthly' && !yearlyTargetKeys.has(getTargetFamilyKey(target));
}

function isTargetDetail(parent: SalesTarget, detail: SalesTarget) {
  if (parent.id === detail.id) return false;
  if (getTargetFamilyKey(parent) !== getTargetFamilyKey(detail)) return false;

  if (parent.period === 'yearly') return true;

  return (
    parent.period === 'monthly' &&
    detail.period === 'monthly' &&
    detail.month === parent.month
  );
}

function sortTargetDetails(first: SalesTarget, second: SalesTarget) {
  const periodOrder: Record<TargetPeriod, number> = {
    quarterly: 1,
    monthly: 2,
    yearly: 3,
  };

  return (
    periodOrder[first.period] - periodOrder[second.period] ||
    (first.quarter ?? 0) - (second.quarter ?? 0) ||
    (first.month ?? 0) - (second.month ?? 0) ||
    first.name.localeCompare(second.name)
  );
}

function getTargetQuarterIndex(target: SalesTarget) {
  if (target.quarter) return target.quarter;
  if (target.month) return Math.ceil(target.month / 3);
  return 0;
}

function getQuarterStyle(target: SalesTarget) {
  const quarter = getTargetQuarterIndex(target);
  return TARGET_QUARTER_STYLES[quarter] ?? {
    badge: 'bg-white/10 text-on-surface-variant',
    marker: 'bg-white/30',
    row: 'bg-white/[0.025] hover:bg-white/[0.045]',
    summaryRow: 'bg-white/[0.09] hover:bg-white/[0.12]',
  };
}

export function TargetsPage() {
  const { isAdmin, isSuperadmin } = useAuthStore();
  const canManageTargets = isAdmin();
  const canManageTeams = isSuperadmin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<TargetAchievement | null>(null);
  const [scope, setScope] = useState<TargetScope>('company');
  const [period] = useState<TargetPeriod>('yearly');
  const [year] = useState(2026);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [teams, setTeams] = useState<SalesTeam[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [users, setUsers] = useState<LookupUser[]>([]);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);
  const [targetForm, setTargetForm] = useState<TargetFormData>(
    emptyTargetForm(year, 'company')
  );
  const [targetFormError, setTargetFormError] = useState('');
  const [expandedTargetIds, setExpandedTargetIds] = useState<Set<string>>(() => new Set());

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<SalesTeam | null>(null);
  const [teamForm, setTeamForm] = useState<TeamFormData>(emptyTeamForm);
  const [teamFormError, setTeamFormError] = useState('');
  const [memberSelections, setMemberSelections] = useState<Record<string, string>>({});

  const selectableScopeOptions = useMemo(
    () => (canManageTeams ? SCOPE_OPTIONS : SCOPE_OPTIONS.filter((item) => item.value === 'individual')),
    [canManageTeams]
  );

  const selectablePeriodOptions = useMemo(
    () => (editingTarget?.period === 'quarterly' ? PERIOD_OPTIONS : TARGET_SET_PERIOD_OPTIONS),
    [editingTarget?.period]
  );

  const targetGroups = useMemo(() => {
    const yearlyTargetKeys = new Set(
      targets
        .filter((target) => !target.category && target.period === 'yearly')
        .map(getTargetFamilyKey)
    );

    return targets
      .filter((target) => isTargetSet(target, yearlyTargetKeys))
      .map((target) => ({
        target,
        details: targets
          .filter((detail) => isTargetDetail(target, detail))
          .sort(sortTargetDetails),
      }));
  }, [targets]);

  const fetchLookups = useCallback(async () => {
    const [teamsRes, usersRes, targetsRes] = await Promise.all([
      get<SalesTeam[]>('/targets/teams'),
      get<LookupUser[]>('/users/lookup'),
      get<SalesTarget[]>(`/targets?year=${year}`),
    ]);

    if (teamsRes.success && teamsRes.data) setTeams(teamsRes.data);
    if (usersRes.success && usersRes.data) setUsers(usersRes.data);
    if (targetsRes.success && targetsRes.data) setTargets(targetsRes.data);
  }, [year]);

  const fetchTargets = useCallback(async () => {
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
  }, [period, scope, selectedTeamId, selectedUserId, year]);

  const refreshTargetWorkspace = useCallback(async () => {
    await Promise.all([fetchLookups(), fetchTargets()]);
  }, [fetchLookups, fetchTargets]);

  useEffect(() => {
    fetchLookups().catch((err) => {
      setError('Unable to load target setup data');
      console.error(err);
    });
  }, [fetchLookups]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const openTargetModal = (target?: SalesTarget) => {
    const nextScope = canManageTeams ? scope : 'individual';
    setEditingTarget(target ?? null);
    setTargetForm(target ? buildTargetForm(target) : emptyTargetForm(year, nextScope));
    setTargetFormError('');
    setIsTargetModalOpen(true);
  };

  const closeTargetModal = () => {
    setIsTargetModalOpen(false);
    setEditingTarget(null);
    setTargetForm(emptyTargetForm(year, canManageTeams ? scope : 'individual'));
    setTargetFormError('');
  };

  const openTeamModal = (team?: SalesTeam) => {
    setEditingTeam(team ?? null);
    setTeamForm(team ? { name: team.name, managerId: team.managerId } : emptyTeamForm);
    setTeamFormError('');
    setIsTeamModalOpen(true);
  };

  const closeTeamModal = () => {
    setIsTeamModalOpen(false);
    setEditingTeam(null);
    setTeamForm(emptyTeamForm);
    setTeamFormError('');
  };

  const handleTargetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTargetFormError('');
    setMessage(null);

    if (!targetForm.name.trim()) {
      setTargetFormError('Target name is required.');
      return;
    }

    if (!targetForm.targetValue.trim()) {
      setTargetFormError('Revenue target is required.');
      return;
    }

    if (targetForm.scope === 'team' && !targetForm.teamId) {
      setTargetFormError('Select a team for team targets.');
      return;
    }

    if (targetForm.scope === 'individual' && !targetForm.userId) {
      setTargetFormError('Select a user for individual targets.');
      return;
    }

    if (targetForm.period === 'quarterly' && !targetForm.quarter) {
      setTargetFormError('Select a quarter for quarterly targets.');
      return;
    }

    if (targetForm.period === 'monthly' && !targetForm.month) {
      setTargetFormError('Select a month for monthly targets.');
      return;
    }

    const quarter =
      targetForm.period === 'monthly'
        ? quarterForMonth(targetForm.month)
        : optionalNumber(targetForm.quarter);

    const payload = {
      name: targetForm.name.trim(),
      scope: targetForm.scope,
      period: targetForm.period,
      year: toNumber(targetForm.year),
      targetValue: toNumber(targetForm.targetValue),
      quarter,
      month: optionalNumber(targetForm.month),
      targetLeads: optionalNumber(targetForm.targetLeads),
      targetDeals: optionalNumber(targetForm.targetDeals),
      category: targetForm.category.trim() || undefined,
      shareOfParent: optionalNumber(targetForm.shareOfParent),
      teamId: targetForm.scope === 'team' ? targetForm.teamId : undefined,
      userId: targetForm.scope === 'individual' ? targetForm.userId : undefined,
    };

    const response = editingTarget
      ? await put<SalesTarget>(`/targets/${editingTarget.id}`, {
          name: payload.name,
          targetValue: payload.targetValue,
          targetLeads: payload.targetLeads,
          targetDeals: payload.targetDeals,
          category: payload.category ?? null,
          shareOfParent: payload.shareOfParent,
        })
      : await post<SalesTarget>('/targets', payload);

    if (!response.success) {
      setTargetFormError(response.error || 'Unable to save target.');
      return;
    }

    setMessage(editingTarget ? 'Target updated.' : 'Target created.');
    closeTargetModal();
    await refreshTargetWorkspace();
  };

  const handleDeleteTarget = async (target: SalesTarget) => {
    const confirmed = window.confirm(`Delete target "${target.name}"?`);
    if (!confirmed) return;

    const response = await del<void>(`/targets/${target.id}`);
    if (!response.success) {
      setError(response.error || 'Unable to delete target');
      return;
    }

    setMessage('Target deleted.');
    await refreshTargetWorkspace();
  };

  const toggleTargetDetails = (targetId: string) => {
    setExpandedTargetIds((current) => {
      const next = new Set(current);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  };

  const handleTeamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamFormError('');
    setMessage(null);

    if (!teamForm.name.trim()) {
      setTeamFormError('Team name is required.');
      return;
    }

    if (!teamForm.managerId) {
      setTeamFormError('Team manager is required.');
      return;
    }

    const payload = {
      name: teamForm.name.trim(),
      managerId: teamForm.managerId,
    };
    const response = editingTeam
      ? await put<SalesTeam>(`/targets/teams/${editingTeam.id}`, payload)
      : await post<SalesTeam>('/targets/teams', payload);

    if (!response.success) {
      setTeamFormError(response.error || 'Unable to save team.');
      return;
    }

    setMessage(editingTeam ? 'Sales team updated.' : 'Sales team created.');
    closeTeamModal();
    await refreshTargetWorkspace();
  };

  const handleDeleteTeam = async (team: SalesTeam) => {
    const confirmed = window.confirm(`Delete sales team "${team.name}"?`);
    if (!confirmed) return;

    const response = await del<void>(`/targets/teams/${team.id}`);
    if (!response.success) {
      setError(response.error || 'Unable to delete team');
      return;
    }

    setMessage('Sales team deleted.');
    await refreshTargetWorkspace();
  };

  const handleAddMember = async (teamId: string) => {
    const userId = memberSelections[teamId];
    if (!userId) return;

    const response = await post<void>(`/targets/teams/${teamId}/members`, { userId });
    if (!response.success) {
      setError(response.error || 'Unable to add member');
      return;
    }

    setMemberSelections((current) => ({ ...current, [teamId]: '' }));
    setMessage('Team member added.');
    await refreshTargetWorkspace();
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    const response = await del<void>(`/targets/teams/${teamId}/members/${userId}`);
    if (!response.success) {
      setError(response.error || 'Unable to remove member');
      return;
    }

    setMessage('Team member removed.');
    await refreshTargetWorkspace();
  };

  const targetScopeLabel = (target: SalesTarget) => {
    if (target.scope === 'team') return target.team?.name ?? 'Team target';
    if (target.scope === 'individual') return target.user?.name ?? 'Individual target';
    return 'Company target';
  };

  const targetPeriodLabel = (target: SalesTarget) => {
    if (target.period === 'monthly' && target.month) {
      return `${MONTH_OPTIONS[target.month - 1]} ${target.year}`;
    }
    if (target.period === 'quarterly' && target.quarter) {
      return `Q${target.quarter} ${target.year}`;
    }
    return String(target.year);
  };

  if (loading && !data) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">Sales Targets</h1>
          <p className="mt-1 text-on-surface-variant">Track revenue, leads, and deals achievement across the company.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value as TargetScope);
              setSelectedTeamId('');
              setSelectedUserId('');
            }}
            className="cursor-pointer rounded-xl bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="company">Company Wide</option>
            <option value="team">Sales Team</option>
            <option value="individual">Individual</option>
          </select>

          {scope === 'team' && (
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              className="cursor-pointer rounded-xl bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          )}

          {scope === 'individual' && (
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="cursor-pointer rounded-xl bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          )}

          {canManageTargets && (
            <Button type="button" onClick={() => openTargetModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Set Target
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {message && (
        <div className="rounded-2xl bg-[#4ae176]/10 p-4 text-sm font-semibold text-[#4ae176]">
          {message}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container p-6">
              <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-primary/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold', getAchievementColor(data.achievementPct))}>
                    {data.achievementPct.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-sm font-bold uppercase text-on-surface-variant">Revenue Actual</h3>
                <p className="mt-1 text-2xl font-black text-on-surface">{formatCurrency(data.revenueActual)}</p>
                <p className="mt-2 text-xs text-on-surface-variant">Target: {formatCurrency(data.revenueTarget)}</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container p-6">
              <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-[#4ae176]/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl bg-[#4ae176]/10 p-3 text-[#4ae176]">
                    <Users className="h-6 w-6" />
                  </div>
                  {data.leadsTarget && (
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', getAchievementColor((data.leadsActual / data.leadsTarget) * 100))}>
                      {((data.leadsActual / data.leadsTarget) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold uppercase text-on-surface-variant">Leads Generated</h3>
                <p className="mt-1 text-2xl font-black text-on-surface">{data.leadsActual}</p>
                <p className="mt-2 text-xs text-on-surface-variant">Target: {data.leadsTarget || '-'}</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container p-6">
              <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-amber-400/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-400">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  {data.dealsTarget && (
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', getAchievementColor((data.dealsActual / data.dealsTarget) * 100))}>
                      {((data.dealsActual / data.dealsTarget) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold uppercase text-on-surface-variant">Deals Won</h3>
                <p className="mt-1 text-2xl font-black text-on-surface">{data.dealsActual}</p>
                <p className="mt-2 text-xs text-on-surface-variant">Target: {data.dealsTarget || '-'}</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container p-6">
              <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-primary/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-sm font-bold uppercase text-on-surface-variant">Remaining Target</h3>
                <p className={cn('mt-1 text-2xl font-black', data.remainingTarget <= 0 ? 'text-[#4ae176]' : 'text-on-surface')}>
                  {data.remainingTarget <= 0 ? 'Goal reached' : formatCurrency(data.remainingTarget)}
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">To reach {year} goal</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="bg-surface-container rounded-[2.5rem] p-8 lg:col-span-1">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-on-surface">Category Mix</h2>
              </div>

              {data.categories.length > 0 ? (
                <>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categories}
                          cx="50%"
                          cy="50%"
                          dataKey="actual"
                          innerRadius={60}
                          nameKey="name"
                          outerRadius={100}
                          paddingAngle={5}
                        >
                          {data.categories.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={['#bcc3ff', '#4ae176', '#fde047', '#fb923c'][index % 4]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={CHART_TOOLTIP_STYLES.contentStyle}
                          formatter={(value: number) => formatCurrency(value)}
                          itemStyle={CHART_TOOLTIP_STYLES.itemStyle}
                          labelStyle={CHART_TOOLTIP_STYLES.labelStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 space-y-3">
                    {data.categories.map((cat, index) => (
                      <div key={cat.name} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: ['#bcc3ff', '#4ae176', '#fde047', '#fb923c'][index % 4] }}
                          />
                          <span className="text-sm font-bold text-on-surface">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-on-surface">{cat.pct.toFixed(1)}%</p>
                          <p className="text-[10px] text-on-surface-variant">{formatCurrency(cat.actual)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-2xl bg-white/[0.03] text-center text-sm text-on-surface-variant">
                  Category targets appear after campaign types have target rows.
                </div>
              )}
            </div>

            <div className="bg-surface-container rounded-[2.5rem] p-8 lg:col-span-2">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-on-surface">Monthly Achievement</h2>
                </div>
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid stroke="#ffffff0a" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="month"
                      dy={10}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLES.contentStyle}
                      cursor={{ fill: '#ffffff05' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                      itemStyle={CHART_TOOLTIP_STYLES.itemStyle}
                      labelStyle={CHART_TOOLTIP_STYLES.labelStyle}
                    />
                    <Bar dataKey="target" fill="#ffffff10" name="Target" radius={[8, 8, 0, 0]} />
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

          <div className="rounded-[2.5rem] bg-surface-container p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-on-surface">Target Setup</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Manage revenue, lead, and deal goals by scope and period.</p>
              </div>
              {canManageTargets && (
                <Button type="button" onClick={() => openTargetModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Target
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Name</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Scope</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Period</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Revenue</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Leads</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Deals</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {targetGroups.map(({ target, details }) => {
                    const isExpanded = expandedTargetIds.has(target.id);

                    return (
                      <Fragment key={target.id}>
                        <tr key={target.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Button
                                aria-expanded={isExpanded}
                                className={cn('h-8 w-8 shrink-0', details.length === 0 && 'opacity-40')}
                                disabled={details.length === 0}
                                onClick={() => toggleTargetDetails(target.id)}
                                size="icon"
                                title={details.length > 0 ? 'Toggle target details' : 'No details'}
                                type="button"
                                variant="ghost"
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="sr-only">Toggle target details</span>
                              </Button>
                              <div>
                                <p className="font-bold text-on-surface">{target.name}</p>
                                {details.length > 0 && (
                                  <p className="text-xs text-on-surface-variant">{details.length} detail rows</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-on-surface">{targetScopeLabel(target)}</td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">{targetPeriodLabel(target)}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-on-surface">{formatCurrency(target.targetValue)}</td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">{target.targetLeads ?? '-'}</td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">{target.targetDeals ?? '-'}</td>
                          <td className="px-4 py-4">
                            {canManageTargets && (
                              <div className="flex justify-end gap-2">
                                <Button size="icon" type="button" variant="ghost" onClick={() => openTargetModal(target)}>
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit target</span>
                                </Button>
                                {canManageTeams && (
                                  <Button size="icon" type="button" variant="ghost" onClick={() => handleDeleteTarget(target)}>
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                    <span className="sr-only">Delete target</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                        {isExpanded && details.length > 0 && (
                          <tr key={`${target.id}-details`}>
                            <td className="bg-white/[0.02] px-4 pb-5 pt-0" colSpan={7}>
                              <div className="overflow-hidden rounded-2xl bg-surface/70">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-white/[0.03]">
                                      <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Detail</th>
                                      <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Period</th>
                                      <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Revenue</th>
                                      <th className="px-4 py-3 text-[10px] font-black uppercase text-on-surface-variant">Share</th>
                                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-on-surface-variant">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {details.map((detail) => {
                                      const quarter = getTargetQuarterIndex(detail);
                                      const quarterStyle = getQuarterStyle(detail);
                                      const isQuarterSummary = detail.period === 'quarterly' && !detail.category;

                                      return (
                                      <tr
                                        key={detail.id}
                                        className={cn(
                                          isQuarterSummary
                                            ? quarterStyle.summaryRow
                                            : quarterStyle.row,
                                          isQuarterSummary && 'font-semibold uppercase tracking-wide'
                                        )}
                                      >
                                        <td className={cn('px-4', isQuarterSummary ? 'py-4' : 'py-3')}>
                                          <div className="flex items-start gap-3">
                                            <span
                                              className={cn(
                                                'mt-1 rounded-full',
                                                quarterStyle.marker,
                                                isQuarterSummary ? 'h-12 w-2.5' : 'h-10 w-1.5'
                                              )}
                                            />
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                {quarter > 0 && (
                                                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase', quarterStyle.badge)}>
                                                    Q{quarter}
                                                  </span>
                                                )}
                                                {isQuarterSummary && (
                                                  <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-black uppercase text-on-surface">
                                                    Quarter total
                                                  </span>
                                                )}
                                              </div>
                                              <p className={cn('mt-2 text-sm font-semibold text-on-surface', isQuarterSummary && 'text-base font-black')}>
                                                {detail.name}
                                              </p>
                                              {detail.category && (
                                                <p className="text-xs text-on-surface-variant">Category: {detail.category}</p>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className={cn('px-4 text-sm', isQuarterSummary ? 'py-4 font-black text-on-surface' : 'py-3 text-on-surface-variant')}>
                                          {targetPeriodLabel(detail)}
                                        </td>
                                        <td className={cn('px-4 text-sm text-on-surface', isQuarterSummary ? 'py-4 font-black' : 'py-3 font-semibold')}>
                                          {formatCurrency(detail.targetValue)}
                                        </td>
                                        <td className={cn('px-4 text-sm', isQuarterSummary ? 'py-4 font-black text-on-surface' : 'py-3 text-on-surface-variant')}>
                                          {detail.shareOfParent ? `${detail.shareOfParent}%` : '-'}
                                        </td>
                                        <td className={cn('px-4', isQuarterSummary ? 'py-4' : 'py-3')}>
                                          {canManageTargets && (
                                            <div className="flex justify-end gap-2">
                                              <Button size="icon" type="button" variant="ghost" onClick={() => openTargetModal(detail)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit target detail</span>
                                              </Button>
                                              {canManageTeams && (
                                                <Button size="icon" type="button" variant="ghost" onClick={() => handleDeleteTarget(detail)}>
                                                  <Trash2 className="h-4 w-4 text-red-400" />
                                                  <span className="sr-only">Delete target detail</span>
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {targetGroups.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-on-surface-variant" colSpan={7}>
                        No sales targets have been created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {canManageTeams && (
            <div className="rounded-[2.5rem] bg-surface-container p-8">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-on-surface">Sales Teams</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Assign managers and members for team-level target tracking.</p>
                </div>
                <Button type="button" onClick={() => openTeamModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Team
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {teams.map((team) => {
                  const memberIds = new Set(team.members?.map((member) => member.userId) ?? []);
                  const availableUsers = users.filter((user) => !memberIds.has(user.id));

                  return (
                    <div key={team.id} className="rounded-2xl bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-on-surface">{team.name}</h3>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            Manager: {team.manager?.name ?? 'Unassigned'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" type="button" variant="ghost" onClick={() => openTeamModal(team)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit team</span>
                          </Button>
                          <Button size="icon" type="button" variant="ghost" onClick={() => handleDeleteTeam(team)}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                            <span className="sr-only">Delete team</span>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {(team.members ?? []).map((member) => (
                          <div key={member.userId} className="flex items-center justify-between rounded-xl bg-surface-container px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{member.user.name}</p>
                              <p className="text-xs text-on-surface-variant">{member.user.email}</p>
                            </div>
                            <Button
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveMember(team.id, member.userId)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {(team.members ?? []).length === 0 && (
                          <p className="rounded-xl bg-surface-container px-3 py-3 text-sm text-on-surface-variant">
                            No members assigned.
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={memberSelections[team.id] ?? ''}
                          onChange={(event) => setMemberSelections((current) => ({ ...current, [team.id]: event.target.value }))}
                          className="h-10 flex-1 rounded-lg bg-surface-container px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Select member</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleAddMember(team.id)}
                          disabled={!memberSelections[team.id]}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {teams.length === 0 && (
                  <div className="rounded-2xl bg-white/[0.03] p-8 text-center text-sm text-on-surface-variant lg:col-span-2">
                    No sales teams have been created yet.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[2.5rem] bg-surface-container">
            <div className="p-8">
              <h2 className="text-xl font-black tracking-tight text-on-surface">Performance Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-on-surface-variant">Period</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-on-surface-variant">Target</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-on-surface-variant">Actual</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-on-surface-variant">Achievement</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-on-surface-variant">Share of Q</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-on-surface-variant">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.monthlyBreakdown.map((item) => (
                    <tr key={item.month} className="hover:bg-white/[0.02]">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-on-surface">{item.month}</span>
                          <span className="text-[10px] font-bold uppercase text-primary/50">Q{item.quarter}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-on-surface">{formatCurrency(item.target)}</td>
                      <td className="px-8 py-6 text-sm font-bold text-on-surface">{formatCurrency(item.actual)}</td>
                      <td className="px-8 py-6">
                        <div className={cn('inline-flex min-w-[70px] items-center justify-center rounded-full px-3 py-1 text-xs font-black', getAchievementColor(item.pct), getAchievementBorder(item.pct))}>
                          {item.pct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-on-surface-variant">
                        {item.shareOfParent ? `${item.shareOfParent}%` : '-'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={cn('text-sm font-medium', item.remaining <= 0 ? 'text-[#4ae176]' : 'text-on-surface-variant')}>
                          {item.remaining <= 0 ? 'Done' : formatCurrency(item.remaining)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {scope !== 'individual' && data.leaderboard.length > 0 && (
            <div className="rounded-[2.5rem] bg-surface-container p-8">
              <h2 className="mb-8 text-xl font-black tracking-tight text-on-surface">Individual Performance</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.leaderboard.map((member, index) => (
                  <div key={member.userId} className="flex items-center gap-4 rounded-[2rem] bg-white/[0.03] p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-black text-on-surface">{member.userName}</h4>
                      <p className="mt-0.5 text-[10px] uppercase text-on-surface-variant">
                        {formatCurrency(member.actual)} / {formatCurrency(member.target)}
                      </p>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={cn('h-full rounded-full', member.pct >= 100 ? 'bg-[#4ae176]' : 'bg-primary')}
                          style={{ width: `${Math.min(member.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn('text-xs font-black', member.pct >= 100 ? 'text-[#4ae176]' : 'text-primary')}>
                      {member.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isTargetModalOpen} onOpenChange={(open) => (open ? setIsTargetModalOpen(true) : closeTargetModal())}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <form onSubmit={handleTargetSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTarget ? 'Edit Target' : 'Set Target'}</DialogTitle>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="target-name">Target name</Label>
                <Input
                  id="target-name"
                  value={targetForm.name}
                  onChange={(event) => setTargetForm({ ...targetForm, name: event.target.value })}
                  placeholder="Annual company revenue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-scope">Scope</Label>
                <select
                  id="target-scope"
                  value={targetForm.scope}
                  onChange={(event) => setTargetForm({ ...targetForm, scope: event.target.value as TargetScope, teamId: '', userId: '' })}
                  disabled={Boolean(editingTarget)}
                  className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                >
                  {selectableScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-period">Period</Label>
                <select
                  id="target-period"
                  value={targetForm.period}
                  onChange={(event) => setTargetForm({ ...targetForm, period: event.target.value as TargetPeriod, quarter: '', month: '' })}
                  disabled={Boolean(editingTarget)}
                  className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                >
                  {selectablePeriodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {targetForm.scope === 'team' && (
                <div className="space-y-2">
                  <Label htmlFor="target-team">Team</Label>
                  <select
                    id="target-team"
                    value={targetForm.teamId}
                    onChange={(event) => setTargetForm({ ...targetForm, teamId: event.target.value })}
                    disabled={Boolean(editingTarget)}
                    className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetForm.scope === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="target-user">User</Label>
                  <select
                    id="target-user"
                    value={targetForm.userId}
                    onChange={(event) => setTargetForm({ ...targetForm, userId: event.target.value })}
                    disabled={Boolean(editingTarget)}
                    className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="target-year">Year</Label>
                <Input
                  id="target-year"
                  value={targetForm.year}
                  onChange={(event) => setTargetForm({ ...targetForm, year: event.target.value })}
                  disabled={Boolean(editingTarget)}
                  inputMode="numeric"
                />
              </div>

              {targetForm.period === 'quarterly' && (
                <div className="space-y-2">
                  <Label htmlFor="target-quarter">Quarter</Label>
                  <select
                    id="target-quarter"
                    value={targetForm.quarter}
                    onChange={(event) => setTargetForm({ ...targetForm, quarter: event.target.value })}
                    disabled={Boolean(editingTarget)}
                    className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                  >
                    <option value="">Select quarter</option>
                    {[1, 2, 3, 4].map((quarter) => (
                      <option key={quarter} value={quarter}>Q{quarter}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetForm.period === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="target-month">Month</Label>
                  <select
                    id="target-month"
                    value={targetForm.month}
                    onChange={(event) => setTargetForm({ ...targetForm, month: event.target.value })}
                    disabled={Boolean(editingTarget)}
                    className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                  >
                    <option value="">Select month</option>
                    {MONTH_OPTIONS.map((label, index) => (
                      <option key={label} value={index + 1}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="target-value">Revenue target</Label>
                <Input
                  id="target-value"
                  value={targetForm.targetValue}
                  onChange={(event) => setTargetForm({ ...targetForm, targetValue: event.target.value })}
                  inputMode="numeric"
                  placeholder="250000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-leads">Lead target</Label>
                <Input
                  id="target-leads"
                  value={targetForm.targetLeads}
                  onChange={(event) => setTargetForm({ ...targetForm, targetLeads: event.target.value })}
                  inputMode="numeric"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-deals">Deal target</Label>
                <Input
                  id="target-deals"
                  value={targetForm.targetDeals}
                  onChange={(event) => setTargetForm({ ...targetForm, targetDeals: event.target.value })}
                  inputMode="numeric"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-category">Category</Label>
                <Input
                  id="target-category"
                  value={targetForm.category}
                  onChange={(event) => setTargetForm({ ...targetForm, category: event.target.value })}
                  placeholder="Optional campaign type"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-share">Share of parent</Label>
                <Input
                  id="target-share"
                  value={targetForm.shareOfParent}
                  onChange={(event) => setTargetForm({ ...targetForm, shareOfParent: event.target.value })}
                  inputMode="decimal"
                  placeholder="Optional percent"
                />
              </div>
            </div>

            {targetFormError && <p className="mt-4 text-sm font-medium text-red-400">{targetFormError}</p>}

            <DialogFooter className="mt-6">
              <Button type="button" variant="secondary" onClick={closeTargetModal}>Cancel</Button>
              <Button type="submit">{editingTarget ? 'Save Target' : 'Create Target'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamModalOpen} onOpenChange={(open) => (open ? setIsTeamModalOpen(true) : closeTeamModal())}>
        <DialogContent>
          <form onSubmit={handleTeamSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Edit Sales Team' : 'New Sales Team'}</DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  value={teamForm.name}
                  onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })}
                  placeholder="Enterprise Sales"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-manager">Manager</Label>
                <select
                  id="team-manager"
                  value={teamForm.managerId}
                  onChange={(event) => setTeamForm({ ...teamForm, managerId: event.target.value })}
                  className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select manager</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {teamFormError && <p className="mt-4 text-sm font-medium text-red-400">{teamFormError}</p>}

            <DialogFooter className="mt-6">
              <Button type="button" variant="secondary" onClick={closeTeamModal}>Cancel</Button>
              <Button type="submit">{editingTeam ? 'Save Team' : 'Create Team'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
