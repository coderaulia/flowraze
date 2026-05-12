/**
 * Subscription Lifecycle Management
 *
 * Handles renewal processing, cancellation, downgrade logic,
 * and subscription status transitions.
 */

import prisma from '../prisma/index.js';
import { sendEmail } from './email.js';
import { PLAN_PRICES } from './payment-provider.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const GRACE_PERIOD_DAYS = 3;
const RENEWAL_REMINDER_DAYS = 7;

// ─── Renewal Processing ──────────────────────────────────────────────────────

/**
 * Processes subscription renewals. Called periodically by the cron interval.
 *
 * Logic:
 * 1. Find active subscriptions where subscriptionEndsAt is within the grace period
 * 2. Transition expired subscriptions to past_due
 * 3. Send renewal reminder emails for subscriptions expiring within RENEWAL_REMINDER_DAYS
 * 4. Cancel subscriptions that have been past_due beyond the grace period
 */
export async function processSubscriptionRenewals(): Promise<{
  reminders: number;
  pastDue: number;
  canceled: number;
}> {
  const now = new Date();
  let reminders = 0;
  let pastDue = 0;
  let canceled = 0;

  // 1. Find active subscriptions expiring within reminder window (send reminder)
  const reminderThreshold = new Date(now.getTime() + RENEWAL_REMINDER_DAYS * 24 * 60 * 60 * 1000);
  const reminderAccounts = await prisma.billingAccount.findMany({
    where: {
      status: 'active',
      subscriptionEndsAt: {
        gt: now,
        lte: reminderThreshold,
      },
    },
    include: {
      company: {
        include: {
          users: {
            where: { role: 'admin', isActive: true },
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  for (const account of reminderAccounts) {
    const daysLeft = Math.ceil(
      ((account.subscriptionEndsAt?.getTime() ?? 0) - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Only send reminder once (check if we already sent one recently via a simple heuristic)
    // We'll use the updatedAt field — if it was updated within the last day, skip
    const lastUpdate = account.updatedAt.getTime();
    if (now.getTime() - lastUpdate < 24 * 60 * 60 * 1000) {
      continue;
    }

    for (const admin of account.company.users) {
      await sendRenewalReminderEmail(admin.email, admin.name, account.plan, daysLeft);
    }

    // Touch updatedAt to prevent duplicate reminders
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { updatedAt: now },
    });

    reminders++;
  }

  // 2. Transition expired active subscriptions to past_due
  const expiredActive = await prisma.billingAccount.findMany({
    where: {
      status: 'active',
      subscriptionEndsAt: { lte: now },
    },
  });

  for (const account of expiredActive) {
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { status: 'past_due' },
    });
    pastDue++;
  }

  // 3. Cancel subscriptions that have been past_due beyond the grace period
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const overdueAccounts = await prisma.billingAccount.findMany({
    where: {
      status: 'past_due',
      subscriptionEndsAt: { lte: graceCutoff },
    },
    include: {
      company: {
        include: {
          users: {
            where: { role: 'admin', isActive: true },
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  for (const account of overdueAccounts) {
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        status: 'canceled',
        canceledAt: now,
        cancelReason: 'payment_failed',
      },
    });

    for (const admin of account.company.users) {
      await sendSubscriptionCanceledEmail(admin.email, admin.name, account.plan);
    }

    canceled++;
  }

  return { reminders, pastDue, canceled };
}

// ─── Cancellation ────────────────────────────────────────────────────────────

export interface CancelSubscriptionParams {
  companyId: string;
  reason?: string;
  immediate?: boolean;
}

/**
 * Cancels a subscription. By default, cancellation takes effect at the end of
 * the current billing period (subscriptionEndsAt). If immediate=true, it
 * cancels right away and downgrades to free.
 */
export async function cancelSubscription(params: CancelSubscriptionParams) {
  const { companyId, reason, immediate } = params;
  const now = new Date();

  const account = await prisma.billingAccount.findUnique({
    where: { companyId },
  });

  if (!account) {
    throw new Error('Billing account not found');
  }

  if (account.status === 'canceled') {
    throw new Error('Subscription is already canceled');
  }

  if (account.plan === 'free') {
    throw new Error('Cannot cancel a free plan');
  }

  if (immediate) {
    // Immediate cancellation: downgrade to free right now
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        status: 'canceled',
        canceledAt: now,
        cancelReason: reason || 'customer_request',
        plan: 'free',
        seats: 3,
      },
    });
  } else {
    // End-of-period cancellation: mark as canceled but keep access until subscriptionEndsAt
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        canceledAt: now,
        cancelReason: reason || 'customer_request',
      },
    });
  }

  return { canceled: true, immediate: !!immediate, endsAt: immediate ? now : account.subscriptionEndsAt };
}

// ─── Reactivation ────────────────────────────────────────────────────────────

/**
 * Reactivates a canceled subscription if it hasn't expired yet.
 * This undoes a scheduled (non-immediate) cancellation.
 */
export async function reactivateSubscription(companyId: string) {
  const account = await prisma.billingAccount.findUnique({
    where: { companyId },
  });

  if (!account) {
    throw new Error('Billing account not found');
  }

  // Can only reactivate if canceledAt is set but subscription hasn't expired
  if (!account.canceledAt) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  if (account.status === 'canceled' && account.plan === 'free') {
    throw new Error('Subscription has already been fully canceled. Please upgrade again.');
  }

  // Undo the scheduled cancellation
  await prisma.billingAccount.update({
    where: { id: account.id },
    data: {
      canceledAt: null,
      cancelReason: null,
      status: 'active',
    },
  });

  return { reactivated: true };
}

// ─── Downgrade ───────────────────────────────────────────────────────────────

export interface DowngradeParams {
  companyId: string;
  targetPlan: 'free' | 'growth';
}

/**
 * Downgrades a subscription to a lower plan. Takes effect at the end of the
 * current billing period.
 */
export async function scheduleDowngrade(params: DowngradeParams) {
  const { companyId, targetPlan } = params;

  const account = await prisma.billingAccount.findUnique({
    where: { companyId },
  });

  if (!account) {
    throw new Error('Billing account not found');
  }

  const planOrder = ['free', 'growth', 'pro', 'custom'];
  const currentIndex = planOrder.indexOf(account.plan);
  const targetIndex = planOrder.indexOf(targetPlan);

  if (targetIndex >= currentIndex) {
    throw new Error('Target plan must be lower than current plan');
  }

  // For downgrade to free, treat as cancellation
  if (targetPlan === 'free') {
    return cancelSubscription({ companyId, reason: 'downgrade_to_free' });
  }

  // For downgrade to growth (from pro), schedule the change at period end
  // We store the intent in cancelReason field as a simple approach
  await prisma.billingAccount.update({
    where: { id: account.id },
    data: {
      cancelReason: `downgrade_to_${targetPlan}`,
    },
  });

  return { scheduled: true, targetPlan, effectiveAt: account.subscriptionEndsAt };
}

// ─── Email Templates ─────────────────────────────────────────────────────────

async function sendRenewalReminderEmail(email: string, name: string, plan: string, daysLeft: number) {
  const pricing = PLAN_PRICES[plan];
  const planLabel = pricing?.label ?? plan;

  const html = `
    <h2>Subscription Renewal Reminder</h2>
    <p>Hi ${name},</p>
    <p>Your FlowRaze <strong>${planLabel}</strong> subscription will renew in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
    <p>If you'd like to make changes to your plan or cancel, please visit your billing settings before the renewal date.</p>
    <p>No action is needed if you'd like to continue with your current plan.</p>
    <br/>
    <p>— The FlowRaze Team</p>
  `;

  await sendEmail({ to: email, subject: `Your FlowRaze subscription renews in ${daysLeft} days`, html });
}

async function sendSubscriptionCanceledEmail(email: string, name: string, plan: string) {
  const pricing = PLAN_PRICES[plan];
  const planLabel = pricing?.label ?? plan;

  const html = `
    <h2>Subscription Canceled</h2>
    <p>Hi ${name},</p>
    <p>Your FlowRaze <strong>${planLabel}</strong> subscription has been canceled due to a failed payment renewal.</p>
    <p>Your workspace has been downgraded to the Free plan. You can upgrade again at any time from your billing settings.</p>
    <p>If this was a mistake, please update your payment method and resubscribe.</p>
    <br/>
    <p>— The FlowRaze Team</p>
  `;

  await sendEmail({ to: email, subject: 'Your FlowRaze subscription has been canceled', html });
}
