import { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/lib/api';
import type { BillingAccount } from '@/types';

interface PlanOption {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
}

interface CheckoutResult {
  token: string;
  redirectUrl: string;
  orderId: string;
  amount: number;
  plan: string;
  billingCycle: string;
}

interface MidtransConfig {
  clientKey: string;
  isProduction: boolean;
}

interface CheckoutDialogProps {
  billing: BillingAccount | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CheckoutDialog({ billing, open, onClose, onSuccess }: CheckoutDialogProps) {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [snapReady, setSnapReady] = useState(false);

  // Load Midtrans Snap.js
  useEffect(() => {
    if (!open) return;

    async function loadSnap() {
      const configRes = await get<MidtransConfig>('/checkout/config');
      if (!configRes.success || !configRes.data) return;

      const { clientKey, isProduction } = configRes.data;
      const scriptUrl = isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

      // Check if already loaded
      if (window.snap) {
        setSnapReady(true);
        return;
      }

      const existing = document.querySelector(`script[src="${scriptUrl}"]`);
      if (existing) {
        setSnapReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.onload = () => setSnapReady(true);
      script.onerror = () => setError('Failed to load payment gateway');
      document.head.appendChild(script);
    }

    loadSnap();
  }, [open]);

  // Load available plans
  useEffect(() => {
    if (!open) return;

    async function loadPlans() {
      const res = await get<PlanOption[]>('/checkout/plans');
      if (res.success && res.data) {
        setPlans(res.data);
      }
    }

    loadPlans();
  }, [open]);

  const getAmount = useCallback(() => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return 0;
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  }, [plans, selectedPlan, billingCycle]);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    const res = await post<CheckoutResult>('/checkout/create', {
      plan: selectedPlan,
      billingCycle,
    });

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to create checkout session');
      setIsLoading(false);
      return;
    }

    const { token } = res.data;

    if (!window.snap) {
      // Fallback: redirect to Midtrans hosted page
      window.location.href = res.data.redirectUrl;
      return;
    }

    window.snap.pay(token, {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onPending: () => {
        setError('Payment is pending. We will update your plan once confirmed.');
        setIsLoading(false);
      },
      onError: () => {
        setError('Payment failed. Please try again.');
        setIsLoading(false);
      },
      onClose: () => {
        setIsLoading(false);
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface/60 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl bg-surface-container p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-on-surface">Upgrade Plan</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current plan info */}
        {billing && (
          <div className="rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">
            Current: <span className="font-medium text-on-surface capitalize">{billing.plan}</span>
            {' · '}<span className="capitalize">{billing.status}</span>
          </div>
        )}

        {/* Plan selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
            Select Plan
          </label>
          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-lg p-4 text-left transition-colors ${
                  selectedPlan === plan.id
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm mt-1 opacity-80">
                  {formatRupiah(plan.monthlyPrice)}/workspace/mo
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Billing cycle */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
            Billing Cycle
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 rounded-lg p-3 text-center transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 rounded-lg p-3 text-center transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-secondary">Annual discount</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-surface-container-high p-4 space-y-2">
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>One workspace · {billingCycle === 'annual' ? 'annual upfront' : 'monthly'}</span>
            <span className="capitalize">{selectedPlan}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-on-surface">
            <span>Total</span>
            <span>{formatRupiah(getAmount())}</span>
          </div>
          {billingCycle === 'annual' && (
            <div className="text-xs text-secondary">
              Discount included compared to paying monthly for 12 months
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-error-container/20 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-surface-container-high px-4 py-3 text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={isLoading || !snapReady}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-on-primary font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : `Pay ${formatRupiah(getAmount())}`}
          </button>
        </div>
      </div>
    </div>
  );
}
