import type { Prisma } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../prisma/index.js';

export function requireCompanyId(req: AuthRequest) {
  if (!req.companyId) {
    throw new AppError(403, 'No company context');
  }

  return req.companyId;
}

export function hasCompanyWideAccess(req: AuthRequest) {
  return req.userRole === 'admin';
}

function emptyStringFilter() {
  return { in: [] as string[] };
}

function restrictStringField(value: unknown, allowedIds: string[]) {
  if (allowedIds.length === 0) {
    return emptyStringFilter();
  }

  if (typeof value === 'string') {
    return allowedIds.includes(value) ? value : emptyStringFilter();
  }

  if (value && typeof value === 'object' && 'equals' in value) {
    const equals = (value as { equals?: unknown }).equals;
    if (typeof equals === 'string') {
      return allowedIds.includes(equals) ? value : emptyStringFilter();
    }
  }

  return { in: allowedIds };
}

export async function getVisibleOwnerIds(req: AuthRequest) {
  if (hasCompanyWideAccess(req)) {
    return undefined;
  }

  if (!req.userId) {
    throw new AppError(401, 'No authenticated user');
  }

  if (req.userRole !== 'manager') {
    return [req.userId];
  }

  const teams = await prisma.salesTeam.findMany({
    where: { companyId: requireCompanyId(req), managerId: req.userId },
    include: { members: { select: { userId: true } } },
  });

  return Array.from(new Set([
    req.userId,
    ...teams.flatMap((team) => team.members.map((member) => member.userId)),
  ]));
}

export async function leadScope(
  req: AuthRequest,
  where: Prisma.LeadWhereInput = {}
): Promise<Prisma.LeadWhereInput> {
  const companyId = requireCompanyId(req);
  const ownerIds = await getVisibleOwnerIds(req);
  const scopedWhere: Prisma.LeadWhereInput = { ...where, companyId };

  if (ownerIds) {
    scopedWhere.ownerId = restrictStringField(scopedWhere.ownerId, ownerIds) as Prisma.StringFilter<'Lead'> | string;
  }

  return scopedWhere;
}

export async function dealScope(
  req: AuthRequest,
  where: Prisma.DealWhereInput = {}
): Promise<Prisma.DealWhereInput> {
  const companyId = requireCompanyId(req);
  const ownerIds = await getVisibleOwnerIds(req);
  const scopedWhere: Prisma.DealWhereInput = { ...where, companyId };

  if (ownerIds) {
    scopedWhere.ownerId = restrictStringField(scopedWhere.ownerId, ownerIds) as Prisma.StringFilter<'Deal'> | string;
  }

  return scopedWhere;
}

export async function campaignScope(
  req: AuthRequest,
  where: Prisma.CampaignWhereInput = {}
): Promise<Prisma.CampaignWhereInput> {
  const companyId = requireCompanyId(req);
  const ownerIds = await getVisibleOwnerIds(req);
  const baseWhere: Prisma.CampaignWhereInput = { ...where, companyId };

  if (!ownerIds) {
    return baseWhere;
  }

  return {
    AND: [
      baseWhere,
      {
        OR: [
          { ownerId: { in: ownerIds } },
          { salesOwnerId: { in: ownerIds } },
          { leads: { some: { ownerId: { in: ownerIds } } } },
        ],
      },
    ],
  };
}

export async function activityScope(
  req: AuthRequest,
  where: Prisma.ActivityWhereInput = {}
): Promise<Prisma.ActivityWhereInput> {
  const companyId = requireCompanyId(req);
  const ownerIds = await getVisibleOwnerIds(req);
  const baseWhere: Prisma.ActivityWhereInput = { ...where, companyId };

  if (!ownerIds) {
    return baseWhere;
  }

  return {
    AND: [
      baseWhere,
      {
        OR: [
          { createdBy: { in: ownerIds } },
          { lead: { ownerId: { in: ownerIds } } },
        ],
      },
    ],
  };
}

export async function userScope(
  req: AuthRequest,
  where: Prisma.UserWhereInput = {}
): Promise<Prisma.UserWhereInput> {
  const companyId = requireCompanyId(req);
  const ownerIds = await getVisibleOwnerIds(req);
  const scopedWhere: Prisma.UserWhereInput = { ...where, companyId };

  if (ownerIds) {
    scopedWhere.id = restrictStringField(scopedWhere.id, ownerIds) as Prisma.StringFilter<'User'> | string;
  }

  return scopedWhere;
}

export async function assertLeadVisible(req: AuthRequest, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: await leadScope(req, { id: leadId }),
    select: { id: true, companyId: true, ownerId: true },
  });

  if (!lead) {
    throw new AppError(404, 'Lead not found');
  }

  return lead;
}

export async function assertCampaignInCompany(req: AuthRequest, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, companyId: requireCompanyId(req) },
    select: { id: true },
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  return campaign;
}

export async function assertUserInCompany(req: AuthRequest, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: requireCompanyId(req), role: { not: 'superadmin' } },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}
