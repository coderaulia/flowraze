import type { BillingStatus, PlanTier } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../prisma/index.js';
import { requireCompanyId } from './data-scope.js';

export type EntitlementFeature =
  | 'apiKeys'
  | 'campaigns'
  | 'exports'
  | 'targets'
  | 'teamPerformance'
  | 'webhooks';

type EntitlementConfig = {
  seats: number | null;
  apiKeys: number;
  campaigns: boolean;
  exports: boolean;
  targets: boolean;
  teamPerformance: boolean;
  webhooks: number;
};

const ACTIVE_STATUSES: BillingStatus[] = ['active', 'trialing'];

export const PLAN_ENTITLEMENTS: Record<PlanTier, EntitlementConfig> = {
  free: {
    seats: 3,
    apiKeys: 0,
    campaigns: false,
    exports: false,
    targets: false,
    teamPerformance: false,
    webhooks: 0,
  },
  growth: {
    seats: null,
    apiKeys: 0,
    campaigns: true,
    exports: false,
    targets: false,
    teamPerformance: true,
    webhooks: 3,
  },
  pro: {
    seats: null,
    apiKeys: 5,
    campaigns: true,
    exports: true,
    targets: true,
    teamPerformance: true,
    webhooks: Number.POSITIVE_INFINITY,
  },
  custom: {
    seats: null,
    apiKeys: Number.POSITIVE_INFINITY,
    campaigns: true,
    exports: true,
    targets: true,
    teamPerformance: true,
    webhooks: Number.POSITIVE_INFINITY,
  },
};

export async function getCompanyEntitlements(companyId: string) {
  let billingAccount = await prisma.billingAccount.findUnique({
    where: { companyId },
    select: { id: true, plan: true, status: true, seats: true, trialEndsAt: true },
  });

  if (billingAccount?.status === 'trialing' && billingAccount.trialEndsAt && billingAccount.trialEndsAt < new Date()) {
    billingAccount = await prisma.billingAccount.update({
      where: { id: billingAccount.id },
      data: { status: 'canceled', canceledAt: new Date() },
      select: { id: true, plan: true, status: true, seats: true, trialEndsAt: true },
    });
  }

  const plan = billingAccount?.plan ?? 'free';
  const config = PLAN_ENTITLEMENTS[plan];
  const isActive = billingAccount ? ACTIVE_STATUSES.includes(billingAccount.status) : true;

  return {
    plan,
    status: billingAccount?.status ?? 'trialing',
    isActive,
    seats: config.seats ?? billingAccount?.seats ?? Number.POSITIVE_INFINITY,
    features: {
      apiKeys: isActive && config.apiKeys > 0,
      campaigns: isActive && config.campaigns,
      exports: isActive && config.exports,
      targets: isActive && config.targets,
      teamPerformance: isActive && config.teamPerformance,
      webhooks: isActive && config.webhooks > 0,
    },
    limits: {
      apiKeys: config.apiKeys,
      webhooks: config.webhooks,
    },
  };
}

export async function assertFeature(req: AuthRequest, feature: EntitlementFeature) {
  if (req.userRole === 'superadmin') {
    return {
      plan: 'custom',
      status: 'active',
      isActive: true,
      seats: Number.POSITIVE_INFINITY,
      features: {
        apiKeys: true,
        campaigns: true,
        exports: true,
        targets: true,
        teamPerformance: true,
        webhooks: true,
      },
      limits: {
        apiKeys: Number.POSITIVE_INFINITY,
        webhooks: Number.POSITIVE_INFINITY,
      },
    };
  }

  const entitlements = await getCompanyEntitlements(requireCompanyId(req));

  if (!entitlements.features[feature]) {
    throw new AppError(
      403,
      `Your ${entitlements.plan} plan does not include this feature.`,
      'FEATURE_NOT_AVAILABLE'
    );
  }

  return entitlements;
}

export async function assertApiKeyLimit(req: AuthRequest) {
  const entitlements = await assertFeature(req, 'apiKeys');
  const limit = entitlements.limits.apiKeys;

  if (!Number.isFinite(limit)) return;

  const activeKeys = await prisma.apiKey.count({
    where: { companyId: requireCompanyId(req), revokedAt: null },
  });

  if (activeKeys >= limit) {
    throw new AppError(403, `API key limit reached for the ${entitlements.plan} plan.`, 'ENTITLEMENT_LIMIT_REACHED');
  }
}

export async function assertWebhookLimit(req: AuthRequest) {
  const entitlements = await assertFeature(req, 'webhooks');
  const limit = entitlements.limits.webhooks;

  if (!Number.isFinite(limit)) return;

  const activeWebhooks = await prisma.webhookEndpoint.count({
    where: { companyId: requireCompanyId(req), isActive: true },
  });

  if (activeWebhooks >= limit) {
    throw new AppError(403, `Webhook limit reached for the ${entitlements.plan} plan.`, 'ENTITLEMENT_LIMIT_REACHED');
  }
}
