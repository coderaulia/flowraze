import { useCallback, useEffect, useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { get, post } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { BillingAccount, BillingInvoice, BillingPayment, SubscriptionDetails } from '@/types';

type Message = { type: 'success' | 'error' | 'info'; text: string };

function AlertMessage({ message }: { message: Message }) {
  const classes = {
    error: 'bg-error/10 text-error',
    success: 'bg-secondary/10 text-secondary',
    info: 'bg-surface-container text-on-surface-variant',
  };

  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-medium ${classes[message.type]}`}>
      {message.text}
    </div>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'secondary' | 'warning' | 'error' | 'default'> = {
    active: 'secondary',
    trialing: 'default',
    past_due: 'warning',
    canceled: 'error',
  };

  return (
    <Badge variant={variants[status] ?? 'default'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'secondary' | 'warning' | 'error' | 'default'> = {
    paid: 'secondary',
    pending: 'warning',
    rejected: 'error',
    expired: 'error',
  };

  return (
    <Badge variant={variants[status] ?? 'default'}>
      {status}
    </Badge>
  );
}

export function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [subRes, billingRes, invoiceRes, paymentRes] = await Promise.all([
      get<SubscriptionDetails>('/subscription'),
      get<BillingAccount>('/billing'),
      get<BillingInvoice[]>('/subscription/invoices'),
      get<BillingPayment[]>('/subscription/payments'),
    ]);

    if (subRes.success && subRes.data) {
      setSubscription(subRes.data);
    }
    if (billingRes.success && billingRes.data) {
      setBilling(billingRes.data);
    }
    if (invoiceRes.success && invoiceRes.data) {
      setInvoices(invoiceRes.data);
    }
    if (paymentRes.success && paymentRes.data) {
      setPayments(paymentRes.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (immediate: boolean) => {
    setIsCanceling(true);
    setMessage(null);

    const res = await post<{ canceled: boolean; endsAt?: string }>('/subscription/cancel', {
      immediate,
      reason: 'customer_request',
    });

    if (res.success) {
      setMessage({
        type: 'info',
        text: immediate
          ? 'Your subscription has been canceled immediately.'
          : `Your subscription will be canceled at the end of the current billing period.`,
      });
      setShowCancelConfirm(false);
      fetchData();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to cancel subscription.' });
    }

    setIsCanceling(false);
  };

  const handleReactivate = async () => {
    setMessage(null);

    const res = await post<{ reactivated: boolean }>('/subscription/reactivate', {});

    if (res.success) {
      setMessage({ type: 'success', text: 'Your subscription has been reactivated.' });
      fetchData();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to reactivate subscription.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-on-surface-variant">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Subscription</h1>
        <p className="mt-1 text-on-surface-variant">Manage your plan, billing cycle, and payment history</p>
      </div>

      {message && <AlertMessage message={message} />}

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            Current Plan
          </CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-surface-container p-4">
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">Plan</p>
                  <p className="mt-1 text-lg font-semibold text-on-surface capitalize">
                    {subscription.planLabel}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-container p-4">
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={subscription.status} />
                  </div>
                </div>
                <div className="rounded-lg bg-surface-container p-4">
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">Billing Cycle</p>
                  <p className="mt-1 text-lg font-semibold text-on-surface capitalize">
                    {subscription.billingCycle}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-container p-4">
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">Seats</p>
                  <p className="mt-1 text-lg font-semibold text-on-surface">
                    {subscription.seats}
                  </p>
                </div>
              </div>

              {/* Renewal info */}
              {subscription.status === 'active' && subscription.subscriptionEndsAt && (
                <div className="rounded-lg bg-surface-container-high p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-on-surface">Next Renewal</p>
                      <p className="text-sm text-on-surface-variant">
                        {formatDate(subscription.subscriptionEndsAt)}
                        {' · '}
                        {formatRupiah(subscription.nextRenewalAmount)}
                      </p>
                    </div>
                    {!subscription.isCanceling && (
                      <Button
                        variant="secondary"
                        onClick={() => setCheckoutOpen(true)}
                      >
                        Change Plan
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Trial info */}
              {subscription.status === 'trialing' && subscription.trialEndsAt && (
                <div className="flex items-start gap-3 rounded-lg bg-primary-container/20 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-on-surface">Trial Period</p>
                    <p className="text-sm text-on-surface-variant">
                      Your trial ends on {formatDate(subscription.trialEndsAt)}.
                      Upgrade before then to keep your features.
                    </p>
                    <Button
                      className="mt-2"
                      size="sm"
                      onClick={() => setCheckoutOpen(true)}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Past due warning */}
              {subscription.status === 'past_due' && (
                <div className="flex items-start gap-3 rounded-lg bg-error/10 p-4">
                  <XCircle className="mt-0.5 h-5 w-5 text-error" />
                  <div>
                    <p className="font-medium text-error">Payment Overdue</p>
                    <p className="text-sm text-on-surface-variant">
                      Your subscription payment is overdue. Please update your payment method
                      to avoid losing access to paid features.
                    </p>
                    <Button
                      className="mt-2"
                      size="sm"
                      onClick={() => setCheckoutOpen(true)}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancellation scheduled */}
              {subscription.isCanceling && !subscription.isDowngrading && (
                <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium text-on-surface">Cancellation Scheduled</p>
                    <p className="text-sm text-on-surface-variant">
                      Your subscription will be canceled on{' '}
                      {subscription.subscriptionEndsAt
                        ? formatDate(subscription.subscriptionEndsAt)
                        : 'the end of your billing period'}
                      . You'll retain access until then.
                    </p>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="secondary"
                      onClick={handleReactivate}
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      Keep Subscription
                    </Button>
                  </div>
                </div>
              )}

              {/* Downgrade scheduled */}
              {subscription.isDowngrading && (
                <div className="flex items-start gap-3 rounded-lg bg-surface-container p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-on-surface-variant" />
                  <div>
                    <p className="font-medium text-on-surface">Downgrade Scheduled</p>
                    <p className="text-sm text-on-surface-variant">
                      Your plan will be downgraded to{' '}
                      <span className="capitalize font-medium">{subscription.downgradeTarget}</span>
                      {' '}on{' '}
                      {subscription.subscriptionEndsAt
                        ? formatDate(subscription.subscriptionEndsAt)
                        : 'the end of your billing period'}
                      .
                    </p>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="secondary"
                      onClick={handleReactivate}
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      Keep Current Plan
                    </Button>
                  </div>
                </div>
              )}

              {/* Canceled state */}
              {subscription.status === 'canceled' && (
                <div className="flex items-start gap-3 rounded-lg bg-surface-container p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-on-surface-variant" />
                  <div>
                    <p className="font-medium text-on-surface">Subscription Canceled</p>
                    <p className="text-sm text-on-surface-variant">
                      Your subscription was canceled
                      {subscription.canceledAt ? ` on ${formatDate(subscription.canceledAt)}` : ''}.
                      You're on the Free plan. Upgrade anytime to restore paid features.
                    </p>
                    <Button
                      className="mt-2"
                      size="sm"
                      onClick={() => setCheckoutOpen(true)}
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      {subscription &&
        subscription.status === 'active' &&
        !subscription.isCanceling &&
        subscription.plan !== 'free' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-error">Cancel Subscription</CardTitle>
              <CardDescription>
                Cancel your subscription. You'll retain access until the end of your current billing period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showCancelConfirm ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Subscription
                </Button>
              ) : (
                <div className="space-y-4 rounded-lg bg-error/5 p-4">
                  <p className="text-sm text-on-surface-variant">
                    Are you sure you want to cancel? You'll keep access to paid features until{' '}
                    <strong>
                      {subscription.subscriptionEndsAt
                        ? formatDate(subscription.subscriptionEndsAt)
                        : 'the end of your billing period'}
                    </strong>
                    .
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => handleCancel(false)}
                      disabled={isCanceling}
                    >
                      {isCanceling ? 'Canceling...' : 'Cancel at Period End'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-error"
                      onClick={() => handleCancel(true)}
                      disabled={isCanceling}
                    >
                      Cancel Immediately
                    </Button>
                    <Button
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Keep Subscription
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recent payments for your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-2 rounded-lg bg-surface-container p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-on-surface">
                      {formatRupiah(payment.amount)}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {formatDate(payment.createdAt)}
                      {payment.method !== 'manual' && ` · ${payment.method}`}
                      {payment.reference && ` · ${payment.reference}`}
                    </p>
                  </div>
                  <PaymentStatusBadge status={payment.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Billing invoices for your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-2 rounded-lg bg-surface-container p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-on-surface">
                      {invoice.invoiceNumber} — {formatRupiah(invoice.amount)}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      Due: {formatDate(invoice.dueDate)}
                      {invoice.paidAt && ` · Paid: ${formatDate(invoice.paidAt)}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      invoice.status === 'paid'
                        ? 'secondary'
                        : invoice.status === 'overdue'
                          ? 'error'
                          : 'default'
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CheckoutDialog
        billing={billing}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
