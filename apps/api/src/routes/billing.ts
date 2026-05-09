import { Router } from 'express';
import type { BillingAccount } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
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

router.use(authenticate);

async function getOrCreateBillingAccount(): Promise<BillingAccount> {
  const billingAccount = await prisma.billingAccount.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (billingAccount) {
    return billingAccount;
  }

  return prisma.billingAccount.create({
    data: {
      workspaceName: 'FlowRaze Workspace',
      plan: 'free',
      status: 'trialing',
      seats: 3,
    },
  });
}

router.get('/', async (_req: AuthRequest, res, next) => {
  try {
    const billingAccount = await getOrCreateBillingAccount();
    res.json({ success: true, data: billingAccount });
  } catch (error) {
    next(error);
  }
});

router.put('/', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const billingAccount = await getOrCreateBillingAccount();
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'workspaceName', optionalNonEmptyString);
    setIfPresent(data, body, 'plan', optionalEnum(PLAN_TIERS, 'Plan'));
    setIfPresent(data, body, 'status', optionalEnum(BILLING_STATUSES, 'Status'));
    setIfPresent(data, body, 'renewalDate', optionalDate);
    setIfPresent(data, body, 'externalCustomer', optionalNonEmptyString);

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
