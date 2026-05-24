/**
 * Subscription Management Routes
 *
 * Customer self-service portal for managing active subscriptions:
 * - View subscription details and upcoming renewal
 * - Cancel subscription (end-of-period or immediate)
 * - Reactivate a scheduled cancellation
 * - View invoices and payment history
 * - Downgrade plan
 */

import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireObjectBody, optionalNonEmptyString } from '../utils/request.js';
import {
  cancelSubscription,
  reactivateSubscription,
  scheduleDowngrade,
} from '../utils/subscription.js';
import { PLAN_PRICES, calculateAmount } from '../utils/payment-provider.js';

const router = Router();

router.use(authenticate, requireAdmin());

// ─── GET /subscription ───────────────────────────────────────────────────────
// Returns full subscription details for the current company.
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const account = await prisma.billingAccount.findUnique({
      where: { companyId },
    });

    if (!account) {
      throw new AppError(404, 'Billing account not found');
    }

    // Calculate next renewal amount
    const pricing = PLAN_PRICES[account.plan];
    const nextAmount = pricing
      ? calculateAmount(account.plan, account.billingCycle)
      : 0;

    const isCanceling = !!account.canceledAt && account.status !== 'canceled';
    const isDowngrading = account.cancelReason?.startsWith('downgrade_to_') ?? false;
    const downgradeTarget = isDowngrading
      ? account.cancelReason!.replace('downgrade_to_', '')
      : null;

    res.json({
      success: true,
      data: {
        id: account.id,
        plan: account.plan,
        status: account.status,
        billingCycle: account.billingCycle,
        seats: account.seats,
        subscriptionStartedAt: account.subscriptionStartedAt,
        subscriptionEndsAt: account.subscriptionEndsAt,
        renewalDate: account.renewalDate,
        trialEndsAt: account.trialEndsAt,
        canceledAt: account.canceledAt,
        cancelReason: account.cancelReason,
        isCanceling,
        isDowngrading,
        downgradeTarget,
        nextRenewalAmount: nextAmount,
        planLabel: pricing?.label ?? account.plan,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /subscription/cancel ───────────────────────────────────────────────
// Cancel the current subscription. Defaults to end-of-period cancellation.
router.post('/cancel', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const body = requireObjectBody(req.body);
    const reason = optionalNonEmptyString(body.reason) ?? undefined;
    const immediate = body.immediate === true;

    const result = await cancelSubscription({ companyId, reason, immediate });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      next(new AppError(400, error.message));
    } else {
      next(error);
    }
  }
});

// ─── POST /subscription/reactivate ──────────────────────────────────────────
// Undo a scheduled cancellation (before the period ends).
router.post('/reactivate', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const result = await reactivateSubscription(companyId);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      next(new AppError(400, error.message));
    } else {
      next(error);
    }
  }
});

// ─── POST /subscription/downgrade ────────────────────────────────────────────
// Schedule a plan downgrade at the end of the current billing period.
router.post('/downgrade', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const body = requireObjectBody(req.body);
    const targetPlan = body.targetPlan as string;

    if (!targetPlan || !['starter', 'growth'].includes(targetPlan)) {
      throw new AppError(400, 'Target plan must be "starter" or "growth"');
    }

    const result = await scheduleDowngrade({
      companyId,
      targetPlan: targetPlan as 'starter' | 'growth',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      next(new AppError(400, error.message));
    } else {
      next(error);
    }
  }
});

// ─── GET /subscription/invoices ──────────────────────────────────────────────
// Returns invoice history for the current company.
router.get('/invoices', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const invoices = await prisma.billingInvoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

// ─── GET /subscription/payments ──────────────────────────────────────────────
// Returns payment history for the current company.
router.get('/payments', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const payments = await prisma.billingPayment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /subscription/seats ─────────────────────────────────────────────────
// Update seat count for the current subscription.
router.put('/seats', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const body = requireObjectBody(req.body);
    const seats = body.seats;

    if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 1) {
      throw new AppError(400, 'Seats must be a positive integer');
    }

    // Check current active user count
    const activeUsers = await prisma.user.count({
      where: { companyId, isActive: true },
    });

    if (seats < activeUsers) {
      throw new AppError(
        400,
        `Cannot reduce seats below active user count (${activeUsers} active users)`
      );
    }

    const account = await prisma.billingAccount.findUnique({
      where: { companyId },
    });

    if (!account) {
      throw new AppError(404, 'Billing account not found');
    }

    if (account.plan === 'starter' && seats > 5) {
      throw new AppError(400, 'Starter plan is limited to 5 users. Upgrade to add more.');
    }

    const updated = await prisma.billingAccount.update({
      where: { id: account.id },
      data: { seats },
    });

    res.json({ success: true, data: { seats: updated.seats } });
  } catch (error) {
    next(error);
  }
});

export default router;
