import { Router } from 'express';
import type { BillingAccount } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import {
  optionalDate,
  optionalEnum,
  optionalNonEmptyString,
  optionalNumber,
  requireAtLeastOneField,
  requireObjectBody,
  setIfPresent,
} from '../utils/request.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const PLAN_TIERS = ['free', 'growth', 'pro', 'custom'] as const;
const BILLING_STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const;
const BILLING_CYCLES = ['monthly', 'annual'] as const;

router.use(authenticate, requireAdmin());

async function getBillingAccount(companyId: string): Promise<BillingAccount> {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { companyId },
  });

  if (!billingAccount) {
    throw new Error('Billing account not found for this company');
  }

  return billingAccount;
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const billingAccount = await getBillingAccount(req.companyId!);
    res.json({ success: true, data: billingAccount });
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req: AuthRequest, res, next) => {
  try {
    const billingAccount = await getBillingAccount(req.companyId!);
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'workspaceName', optionalNonEmptyString);
    setIfPresent(data, body, 'plan', optionalEnum(PLAN_TIERS, 'Plan'));
    setIfPresent(data, body, 'status', optionalEnum(BILLING_STATUSES, 'Status'));
    setIfPresent(data, body, 'renewalDate', optionalDate);
    setIfPresent(data, body, 'trialStartedAt', optionalDate);
    setIfPresent(data, body, 'trialEndsAt', optionalDate);
    setIfPresent(data, body, 'subscriptionStartedAt', optionalDate);
    setIfPresent(data, body, 'subscriptionEndsAt', optionalDate);
    setIfPresent(data, body, 'canceledAt', optionalDate);
    setIfPresent(data, body, 'externalCustomer', optionalNonEmptyString);
    setIfPresent(data, body, 'billingCycle', optionalEnum(BILLING_CYCLES, 'Billing cycle'));

    if (Object.prototype.hasOwnProperty.call(body, 'seats')) {
      const seats = optionalNumber(body.seats);
      if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 1) {
        throw new AppError(400, 'Seats must be a positive whole number');
      }
      data.seats = seats;
    }

    requireAtLeastOneField(data);

    const updated = await prisma.billingAccount.update({
      where: { id: billingAccount.id },
      data,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
