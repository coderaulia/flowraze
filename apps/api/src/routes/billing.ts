import { Router } from 'express';
import type { BillingAccount } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import {
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireObjectBody,
  setIfPresent,
} from '../utils/request.js';

const router = Router();

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
