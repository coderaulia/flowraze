import { useCallback, useEffect, useState } from 'react';
import { CreditCard, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { get, put } from '@/lib/api';
import type { Company, PlanTier } from '@/types';

interface BillingSummary {
  totalMRR: number;
  planDistribution: Record<PlanTier, number>;
  companies: Array<Company & { billing: NonNullable<Company['billing']> }>;
}

const PLAN_OPTIONS: PlanTier[] = ['free', 'growth', 'pro', 'custom'];

const PLAN_COLORS: Record<PlanTier, string> = {
  free: 'bg-gray-100 text-gray-700',
  growth: 'bg-blue-50 text-blue-700',
  pro: 'bg-purple-50 text-purple-700',
  custom: 'bg-orange-50 text-orange-700',
};

export function AdminBillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingCompany, setEditingCompany] = useState<BillingSummary['companies'][number] | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('free');
  const [overrideError, setOverrideError] = useState('');

  const fetchBilling = useCallback(async () => {
    setIsLoading(true);
    const res = await get<BillingSummary>('/admin/billing');
    if (res.success && res.data) {
      setSummary(res.data);
    } else {
      setError(res.error || 'Failed to load billing data');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const openOverride = (company: BillingSummary['companies'][number]) => {
    setEditingCompany(company);
    setSelectedPlan(company.billing.plan);
    setOverrideError('');
  };

  const handleOverride = async () => {
    if (!editingCompany) return;
    const res = await put<Company>(`/admin/billing/${editingCompany.id}`, { plan: selectedPlan });
    if (res.success) {
      fetchBilling();
      setEditingCompany(null);
    } else {
      setOverrideError(res.error || 'Failed to update plan');
    }
  };

  const planDist = summary?.planDistribution;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Platform Billing</h1>
        <p className="text-on-surface-variant mt-1">Revenue overview and plan management</p>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-1 sm:col-span-2 rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-on-surface-variant">Monthly Revenue</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {isLoading ? '...' : `$${(summary?.totalMRR ?? 0).toLocaleString()}`}
          </p>
        </div>
        {PLAN_OPTIONS.map((plan) => (
          <div key={plan} className="rounded-xl bg-white border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[plan]}`}>
                {plan}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {isLoading ? '...' : (planDist?.[plan] ?? 0)}
            </p>
            <p className="text-xs text-on-surface-variant">companies</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-primary">Company Plans</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-on-surface-variant text-sm">
            Loading billing data...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary?.companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[company.billing.plan]}`}>
                      {company.billing.plan}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${company.billing.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                      {company.billing.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{company.billing.seats}</TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {company.billing.renewalDate
                      ? new Date(company.billing.renewalDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openOverride(company)} title="Override plan">
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!summary?.companies.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-on-surface-variant py-8">
                    No billing data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Plan — {editingCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {overrideError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{overrideError}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Tier</label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingCompany(null)}>Cancel</Button>
            <Button onClick={handleOverride}>Apply Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
