import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireObjectBody, requireString } from '../utils/request.js';
import {
  createCheckoutSession,
  getClientConfig,
  getTransactionStatus,
  PLAN_PRICES,
  calculateAmount,
  processNotification,
  verifySignature,
  type MidtransNotification,
} from '../utils/payment-provider.js';

const router = Router();

// ─── GET /checkout/config ────────────────────────────────────────────────────
// Returns Midtrans client key for frontend Snap.js initialization.
// Public for authenticated users (no admin required).
router.get('/config', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const config = getClientConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// ─── GET /checkout/plans ─────────────────────────────────────────────────────
// Returns available plan pricing for the checkout UI.
router.get('/plans', authenticate, async (_req: AuthRequest, res) => {
  const plans = Object.entries(PLAN_PRICES).map(([key, value]) => ({
    id: key,
    name: value.label,
    monthlyPrice: value.monthly,
    annualPrice: value.annual,
    annualSavings: Math.round((1 - value.annual / value.monthly) * 100),
  }));

  res.json({ success: true, data: plans });
});

// ─── POST /checkout/create ───────────────────────────────────────────────────
// Creates a Midtrans Snap checkout session for plan upgrade/subscription.
// Requires admin role (only company admins can manage billing).
router.post('/create', authenticate, requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const plan = requireString(body, 'plan', 'Plan');
    const billingCycle = requireString(body, 'billingCycle', 'Billing cycle') as 'monthly' | 'annual';

    if (!['monthly', 'annual'].includes(billingCycle)) {
      throw new AppError(400, 'Billing cycle must be "monthly" or "annual"');
    }

    if (!PLAN_PRICES[plan]) {
      throw new AppError(400, `Invalid plan: ${plan}. Available: ${Object.keys(PLAN_PRICES).join(', ')}`);
    }

    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const [company, billingAccount, user] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.billingAccount.findUnique({ where: { companyId } }),
      prisma.user.findUnique({ where: { id: req.userId } }),
    ]);

    if (!company || !billingAccount || !user) {
      throw new AppError(404, 'Company or billing account not found');
    }

    // Use a transaction to atomically check for pending payment and create session
    const seats = billingAccount.seats;
    const result = await prisma.$transaction(async (tx) => {
      const pendingPayment = await tx.billingPayment.findFirst({
        where: {
          billingAccountId: billingAccount.id,
          status: 'pending',
          method: 'midtrans',
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
      });

      if (pendingPayment) {
        throw new AppError(409, 'A checkout session is already pending. Please complete or wait for it to expire.', 'CHECKOUT_PENDING');
      }

      return createCheckoutSession({
        companyId,
        companyName: company.name,
        plan,
        seats,
        billingCycle,
        customerEmail: user.email,
        customerName: user.name,
      });
    });

    res.json({
      success: true,
      data: {
        ...result,
        amount: calculateAmount(plan, seats, billingCycle),
        plan,
        seats,
        billingCycle,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /checkout/webhook ──────────────────────────────────────────────────
// Midtrans payment notification webhook. No auth required (verified by signature).
router.post('/webhook', async (req, res, next) => {
  try {
    const notification = req.body as MidtransNotification;

    if (!notification.order_id || !notification.signature_key) {
      return res.status(400).json({ success: false, error: 'Invalid notification payload' });
    }

    if (!verifySignature(notification)) {
      console.warn('[Midtrans Webhook] Invalid signature for order:', notification.order_id);
      return res.status(403).json({ success: false, error: 'Invalid signature' });
    }

    const result = await processNotification(notification);
    console.log('[Midtrans Webhook] Processed:', result);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ─── GET /checkout/status/:orderId ───────────────────────────────────────────
// Check the status of a specific payment order.
router.get('/status/:orderId', authenticate, requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      throw new AppError(400, 'Order ID is required');
    }

    // Verify the order belongs to this company
    const payment = await prisma.billingPayment.findFirst({
      where: {
        reference: orderId,
        companyId: req.companyId!,
      },
    });

    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    try {
      const status = await getTransactionStatus(orderId);
      res.json({ success: true, data: { payment, providerStatus: status } });
    } catch {
      // If Midtrans API fails, return local payment record
      res.json({ success: true, data: { payment, providerStatus: null } });
    }
  } catch (error) {
    next(error);
  }
});

// ─── GET /checkout/history ───────────────────────────────────────────────────
// Returns payment history for the current company.
router.get('/history', authenticate, requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError(403, 'No company context');
    }

    const payments = await prisma.billingPayment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

export default router;
