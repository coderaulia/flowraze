import { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCw, TrendingUp } from 'lucide-react';
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
import { get, post, put } from '@/lib/api';
import type { BillingAccount, BillingInvoice, BillingPayment, BillingStatus, Company, PlanTier } from '@/types';

type CountByPlan = { plan: PlanTier; _count: { _all: number } };
type CountByStatus = { status: BillingStatus; _count: { _all: number } };

type AdminBillingAccount = BillingAccount & {
  company: Pick<Company, 'id' | 'name' | 'slug' | 'isActive'>;
  invoices?: BillingInvoice[];
  payments?: BillingPayment[];
};

interface AdminBillingResponse {
  accounts: AdminBillingAccount[];
  summary: {
    byPlan: CountByPlan[];
    byStatus: CountByStatus[];
    total: number;
  };
}

const PLAN_OPTIONS: PlanTier[] = ['starter', 'growth', 'custom'];

const PLAN_MONTHLY_PRICE: Record<PlanTier, number> = {
  starter: 300_000,
  growth: 800_000,
  custom: 0,
};

const PLAN_COLORS: Record<PlanTier, string> = {
  starter: 'bg-gray-100 text-gray-700',
  growth: 'bg-blue-50 text-blue-700',
  custom: 'bg-orange-50 text-orange-700',
};

function getPlanDistribution(accounts: AdminBillingAccount[]) {
  return accounts.reduce<Record<PlanTier, number>>(
    (acc, account) => {
      acc[account.plan] += 1;
      return acc;
    },
    { starter: 0, growth: 0, custom: 0 }
  );
}

function getEstimatedMRR(accounts: AdminBillingAccount[]) {
  return accounts.reduce((total, account) => {
    return account.status === 'active' ? total + PLAN_MONTHLY_PRICE[account.plan] : total;
  }, 0);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminBillingPage() {
  const [billing, setBilling] = useState<AdminBillingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingAccount, setEditingAccount] = useState<AdminBillingAccount | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('starter');
  const [overrideError, setOverrideError] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchBilling = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const res = await get<AdminBillingResponse>('/admin/billing');
    if (res.success && res.data) {
      setBilling(res.data);
    } else {
      setError(res.error || 'Failed to load billing data');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const openOverride = (account: AdminBillingAccount) => {
    setEditingAccount(account);
    setSelectedPlan(account.plan);
    setOverrideError('');
  };

  const handleOverride = async () => {
    if (!editingAccount) return;
    const res = await put<BillingAccount>(`/admin/billing/${editingAccount.companyId}`, { plan: selectedPlan });
    if (res.success) {
      fetchBilling();
      setEditingAccount(null);
    } else {
      setOverrideError(res.error || 'Failed to update plan');
    }
  };

  const accounts = billing?.accounts ?? [];
  const planDist = getPlanDistribution(accounts);
  const estimatedMRR = getEstimatedMRR(accounts);

  const handleCheckPayment = async (account: AdminBillingAccount) => {
    setActionError('');
    const res = await post<AdminBillingAccount>(`/admin/billing/${account.companyId}/check-payment`, {});
    if (res.success) {
      fetchBilling();
    } else {
      setActionError(res.error || 'Failed to check payment');
    }
  };

  const handleMarkPaid = async (account: AdminBillingAccount) => {
    setActionError('');
    const res = await post<AdminBillingAccount>(`/admin/billing/${account.companyId}/mark-paid`, {});
    if (res.success) {
      fetchBilling();
    } else {
      setActionError(res.error || 'Failed to mark payment as paid');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Platform Billing</h1>
        <p className="text-on-surface-variant mt-1">Revenue overview and plan management</p>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}
      {actionError && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{actionError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-1 sm:col-span-2 rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-on-surface-variant">Monthly Revenue</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {isLoading ? '...' : formatRupiah(estimatedMRR)}
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
              {isLoading ? '...' : planDist[plan]}
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
                <TableHead>Invoice</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.company.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[account.plan]}`}>
                      {account.plan}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${account.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                      {account.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{account.seats}</TableCell>
                  <TableCell className="text-sm">
                    {account.invoices?.[0] ? (
                      <div>
                        <p className="font-medium text-primary">{formatRupiah(account.invoices[0].amount)}</p>
                        <p className="text-xs text-on-surface-variant">{account.invoices[0].status}</p>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant">No invoice</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {account.payments?.[0] ? (
                      <div>
                        <p className="font-medium text-primary">{account.payments[0].status}</p>
                        <p className="text-xs text-on-surface-variant">
                          {account.payments[0].checkedAt
                            ? `Checked ${new Date(account.payments[0].checkedAt).toLocaleDateString()}`
                            : 'Not checked'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant">No check</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {account.renewalDate
                      ? new Date(account.renewalDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCheckPayment(account)} title="Check payment">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(account)} title="Mark paid">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openOverride(account)} title="Override plan">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-on-surface-variant py-8">
                    No billing data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Plan — {editingAccount?.company.name}</DialogTitle>
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
            <Button variant="secondary" onClick={() => setEditingAccount(null)}>Cancel</Button>
            <Button onClick={handleOverride}>Apply Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
