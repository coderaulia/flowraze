/**
 * Midtrans Payment Provider Integration
 *
 * Handles checkout session creation, subscription management,
 * and webhook notification verification for Midtrans Snap.
 *
 * Midtrans is used because FlowRaze targets the Indonesian market (IDR pricing).
 * This module wraps the Midtrans Core API and Snap API.
 */

import crypto from 'node:crypto';
import prisma from '../prisma/index.js';

// ─── Configuration ───────────────────────────────────────────────────────────

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  merchantId: string;
}

function getConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const merchantId = process.env.MIDTRANS_MERCHANT_ID ?? '';
  const isProduction = process.env.MIDTRANS_PRODUCTION === 'true';

  if (!serverKey || !clientKey) {
    throw new Error('MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY must be set');
  }

  return { serverKey, clientKey, isProduction, merchantId };
}

function getBaseUrl(isProduction: boolean) {
  return isProduction
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';
}

function getApiUrl(isProduction: boolean) {
  return isProduction
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com';
}

function authHeader(serverKey: string) {
  const encoded = Buffer.from(`${serverKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

// ─── Plan Pricing ────────────────────────────────────────────────────────────

export const PLAN_PRICES: Record<string, { monthly: number; annual: number; label: string }> = {
  growth: { monthly: 149_000, annual: 119_200, label: 'Growth' },
  pro: { monthly: 299_000, annual: 239_200, label: 'Performance' },
};

export function calculateAmount(plan: string, seats: number, billingCycle: 'monthly' | 'annual') {
  const pricing = PLAN_PRICES[plan];
  if (!pricing) return 0;

  const pricePerSeat = billingCycle === 'annual' ? pricing.annual : pricing.monthly;
  const months = billingCycle === 'annual' ? 12 : 1;
  return pricePerSeat * seats * months;
}

// ─── Snap Token (Checkout) ───────────────────────────────────────────────────

export interface CreateCheckoutParams {
  companyId: string;
  companyName: string;
  plan: string;
  seats: number;
  billingCycle: 'monthly' | 'annual';
  customerEmail: string;
  customerName: string;
}

export interface CheckoutResult {
  token: string;
  redirectUrl: string;
  orderId: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const config = getConfig();
  const { companyId, companyName, plan, seats, billingCycle, customerEmail, customerName } = params;

  const amount = calculateAmount(plan, seats, billingCycle);
  if (amount <= 0) {
    throw new Error(`Invalid plan or amount: ${plan}`);
  }

  const orderId = `FR-${companyId.slice(0, 8)}-${Date.now()}`;
  const pricing = PLAN_PRICES[plan]!;
  const cycleLabel = billingCycle === 'annual' ? 'Annual' : 'Monthly';

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: [
      {
        id: `${plan}-${billingCycle}`,
        price: billingCycle === 'annual' ? pricing.annual * 12 : pricing.monthly,
        quantity: seats,
        name: `FlowRaze ${pricing.label} (${cycleLabel}) per seat`,
      },
    ],
    customer_details: {
      email: customerEmail,
      first_name: customerName,
    },
    metadata: {
      company_id: companyId,
      company_name: companyName,
      plan,
      seats: String(seats),
      billing_cycle: billingCycle,
    },
    callbacks: {
      finish: `${process.env.APP_URL || 'http://localhost:5173'}/company/settings?billing=success`,
      error: `${process.env.APP_URL || 'http://localhost:5173'}/company/settings?billing=error`,
      pending: `${process.env.APP_URL || 'http://localhost:5173'}/company/settings?billing=pending`,
    },
  };

  const snapUrl = `${getBaseUrl(config.isProduction)}/snap/v1/transactions`;

  const response = await fetch(snapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader(config.serverKey),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans Snap error: ${response.status} ${errorBody}`);
  }

  const result = await response.json() as { token: string; redirect_url: string };

  // Store the pending order reference
  await prisma.billingPayment.create({
    data: {
      companyId,
      billingAccountId: (await prisma.billingAccount.findUniqueOrThrow({ where: { companyId } })).id,
      amount,
      status: 'pending',
      method: 'midtrans',
      reference: orderId,
      notes: JSON.stringify({ plan, seats, billingCycle }),
    },
  });

  return {
    token: result.token,
    redirectUrl: result.redirect_url,
    orderId,
  };
}

// ─── Webhook Signature Verification ─────────────────────────────────────────

export interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  signature_key: string;
  status_code: string;
  fraud_status?: string;
  metadata?: {
    company_id?: string;
    plan?: string;
    seats?: string;
    billing_cycle?: string;
  };
}

export function verifySignature(notification: MidtransNotification): boolean {
  const config = getConfig();
  const { order_id, status_code, gross_amount, signature_key } = notification;

  const payload = `${order_id}${status_code}${gross_amount}${config.serverKey}`;
  const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');

  return expectedSignature === signature_key;
}

// ─── Process Notification ────────────────────────────────────────────────────

export type PaymentOutcome = 'success' | 'pending' | 'failed' | 'expired';

export function resolveOutcome(notification: MidtransNotification): PaymentOutcome {
  const { transaction_status, fraud_status } = notification;

  if (transaction_status === 'capture') {
    return fraud_status === 'accept' ? 'success' : 'pending';
  }

  if (transaction_status === 'settlement') return 'success';
  if (transaction_status === 'pending') return 'pending';
  if (['deny', 'cancel'].includes(transaction_status)) return 'failed';
  if (transaction_status === 'expire') return 'expired';

  return 'pending';
}

export async function processNotification(notification: MidtransNotification) {
  const outcome = resolveOutcome(notification);
  const orderId = notification.order_id;

  // Find the payment record by reference (order_id)
  const payment = await prisma.billingPayment.findFirst({
    where: { reference: orderId },
    include: { billingAccount: true },
  });

  if (!payment) {
    console.warn(`[Midtrans] No payment found for order: ${orderId}`);
    return { processed: false, reason: 'payment_not_found' };
  }

  const now = new Date();

  if (outcome === 'success') {
    // Parse metadata from payment notes
    let plan = 'growth';
    let seats = payment.billingAccount.seats;
    let billingCycle: 'monthly' | 'annual' = 'monthly';

    try {
      const meta = JSON.parse(payment.notes ?? '{}');
      if (meta.plan) plan = meta.plan;
      if (meta.seats) seats = Number(meta.seats);
      if (meta.billing_cycle) billingCycle = meta.billing_cycle;
    } catch {
      // Use defaults
    }

    const subscriptionDays = billingCycle === 'annual' ? 365 : 30;

    await prisma.$transaction([
      prisma.billingPayment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          paidAt: now,
          checkedAt: now,
        },
      }),
      prisma.billingAccount.update({
        where: { id: payment.billingAccountId },
        data: {
          plan: plan as 'growth' | 'pro' | 'custom',
          status: 'active',
          seats,
          subscriptionStartedAt: payment.billingAccount.subscriptionStartedAt ?? now,
          subscriptionEndsAt: new Date(now.getTime() + subscriptionDays * 24 * 60 * 60 * 1000),
          renewalDate: new Date(now.getTime() + subscriptionDays * 24 * 60 * 60 * 1000),
          canceledAt: null,
          externalCustomer: orderId,
        },
      }),
    ]);

    // Also mark any open invoice as paid
    const openInvoice = await prisma.billingInvoice.findFirst({
      where: { billingAccountId: payment.billingAccountId, status: 'open' },
    });
    if (openInvoice) {
      await prisma.billingInvoice.update({
        where: { id: openInvoice.id },
        data: { status: 'paid', paidAt: now },
      });
    }

    return { processed: true, outcome: 'success', orderId };
  }

  if (outcome === 'failed' || outcome === 'expired') {
    await prisma.billingPayment.update({
      where: { id: payment.id },
      data: {
        status: outcome === 'expired' ? 'expired' : 'rejected',
        checkedAt: now,
      },
    });

    return { processed: true, outcome, orderId };
  }

  // Still pending — update checkedAt
  await prisma.billingPayment.update({
    where: { id: payment.id },
    data: { checkedAt: now },
  });

  return { processed: true, outcome: 'pending', orderId };
}

// ─── Check Transaction Status ────────────────────────────────────────────────

export async function getTransactionStatus(orderId: string) {
  const config = getConfig();
  const url = `${getApiUrl(config.isProduction)}/v2/${orderId}/status`;

  const response = await fetch(url, {
    headers: { Authorization: authHeader(config.serverKey) },
  });

  if (!response.ok) {
    throw new Error(`Midtrans status check failed: ${response.status}`);
  }

  return response.json() as Promise<MidtransNotification>;
}

// ─── Get Client Key (for frontend Snap.js) ──────────────────────────────────

export function getClientConfig() {
  const config = getConfig();
  return {
    clientKey: config.clientKey,
    isProduction: config.isProduction,
  };
}
