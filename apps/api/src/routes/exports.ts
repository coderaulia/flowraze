import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { exportFilename, toCsv, toPdf } from '../utils/export.js';
import { getQueryDate, getQueryNumber, getQueryString } from '../utils/query.js';
import { parseDateRange, getStartDate } from '../utils/date.js';
import { activityScope, campaignScope, dealScope, leadScope, requireCompanyId, userScope } from '../utils/data-scope.js';
import { assertFeature } from '../utils/entitlements.js';

const router = Router();
const EXPORT_ENTITIES = ['leads', 'deals', 'campaigns', 'activities', 'team-performance'] as const;
type ExportEntity = (typeof EXPORT_ENTITIES)[number];
type ExportFormat = 'csv' | 'pdf';
type ExportRow = Record<string, string | number | boolean | null | undefined>;

router.use(authenticate, companyDataScope);

function requireExportEntity(value: string): ExportEntity {
  if (!EXPORT_ENTITIES.includes(value as ExportEntity)) {
    throw new AppError(400, 'Unsupported export entity');
  }

  return value as ExportEntity;
}

function requireExportFormat(value: unknown): ExportFormat {
  const format = String(value || 'csv').toLowerCase();
  if (format !== 'csv' && format !== 'pdf') {
    throw new AppError(400, 'Export format must be csv or pdf');
  }

  return format;
}

function applyDateRange(
  where: { createdAt?: unknown },
  from: Date | undefined,
  to: Date | undefined
) {
  if (!from && !to) {
    return;
  }

  where.createdAt = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

async function getLeadRows(req: AuthRequest) {
  const where: Prisma.LeadWhereInput = {};
  const search = getQueryString(req.query.search);
  const status = getQueryString(req.query.status);
  const source = getQueryString(req.query.source);
  const ownerId = getQueryString(req.query.ownerId);
  const campaignId = getQueryString(req.query.campaignId);

  if (status) where.status = status as Prisma.EnumLeadStatusFilter['equals'];
  if (source) where.source = { contains: source, mode: 'insensitive' };
  if (ownerId) where.ownerId = ownerId;
  if (campaignId) where.campaignId = campaignId;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }
  applyDateRange(where, getQueryDate(req.query.createdFrom, 'createdFrom'), getQueryDate(req.query.createdTo, 'createdTo'));

  const leads = await prisma.lead.findMany({
    where: await leadScope(req, where),
    include: {
      owner: { select: { name: true, email: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  return {
    title: 'Leads Export',
    headers: ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Owner', 'Campaign', 'Created At'],
    rows: leads.map((lead): ExportRow => ({
      Name: lead.fullName,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.companyName,
      Source: lead.source,
      Status: lead.status,
      Owner: lead.owner.name,
      Campaign: lead.campaign?.name,
      'Created At': lead.createdAt.toISOString(),
    })),
  };
}

async function getDealRows(req: AuthRequest) {
  const where: Prisma.DealWhereInput = {};
  const search = getQueryString(req.query.search);
  const stage = getQueryString(req.query.stage);
  const status = getQueryString(req.query.status);
  const ownerId = getQueryString(req.query.ownerId);
  const leadId = getQueryString(req.query.leadId);
  const minValue = getQueryNumber(req.query.minValue, 'minValue');
  const maxValue = getQueryNumber(req.query.maxValue, 'maxValue');

  if (stage) where.pipelineStageId = stage;
  if (status) where.status = status as Prisma.EnumDealStatusFilter['equals'];
  if (ownerId) where.ownerId = ownerId;
  if (leadId) where.leadId = leadId;
  if (minValue !== undefined || maxValue !== undefined) {
    where.value = {
      ...(minValue !== undefined ? { gte: minValue } : {}),
      ...(maxValue !== undefined ? { lte: maxValue } : {}),
    };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { lead: { fullName: { contains: search, mode: 'insensitive' } } },
      { lead: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  applyDateRange(where, getQueryDate(req.query.createdFrom, 'createdFrom'), getQueryDate(req.query.createdTo, 'createdTo'));

  const deals = await prisma.deal.findMany({
    where: await dealScope(req, where),
    include: {
      owner: { select: { name: true, email: true } },
      lead: { select: { fullName: true, companyName: true } },
      pipelineStage: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  return {
    title: 'Deals Export',
    headers: ['Title', 'Lead', 'Company', 'Value', 'Stage', 'Status', 'Owner', 'Expected Close', 'Created At'],
    rows: deals.map((deal): ExportRow => ({
      Title: deal.title,
      Lead: deal.lead.fullName,
      Company: deal.lead.companyName,
      Value: deal.value,
      Stage: deal.pipelineStage.name,
      Status: deal.status,
      Owner: deal.owner.name,
      'Expected Close': deal.expectedCloseDate?.toISOString(),
      'Created At': deal.createdAt.toISOString(),
    })),
  };
}

async function getCampaignRows(req: AuthRequest) {
  const where: Prisma.CampaignWhereInput = {};
  const search = getQueryString(req.query.search);
  const channel = getQueryString(req.query.channel);
  const minCost = getQueryNumber(req.query.minCost, 'minCost');
  const maxCost = getQueryNumber(req.query.maxCost, 'maxCost');

  if (channel) where.channel = { contains: channel, mode: 'insensitive' };
  if (minCost !== undefined || maxCost !== undefined) {
    where.cost = {
      ...(minCost !== undefined ? { gte: minCost } : {}),
      ...(maxCost !== undefined ? { lte: maxCost } : {}),
    };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { channel: { contains: search, mode: 'insensitive' } },
    ];
  }
  applyDateRange(where, getQueryDate(req.query.createdFrom, 'createdFrom'), getQueryDate(req.query.createdTo, 'createdTo'));

  const campaigns = await prisma.campaign.findMany({
    where: await campaignScope(req, where),
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  return {
    title: 'Campaigns Export',
    headers: ['Name', 'Channel', 'Cost', 'Start Date', 'End Date', 'Created At'],
    rows: campaigns.map((campaign): ExportRow => ({
      Name: campaign.name,
      Channel: campaign.channel,
      Cost: campaign.cost,
      'Start Date': campaign.startDate.toISOString(),
      'End Date': campaign.endDate?.toISOString(),
      'Created At': campaign.createdAt.toISOString(),
    })),
  };
}

async function getActivityRows(req: AuthRequest) {
  const where: Prisma.ActivityWhereInput = {};
  const search = getQueryString(req.query.search);
  const type = getQueryString(req.query.type);
  const leadId = getQueryString(req.query.leadId);
  const createdBy = getQueryString(req.query.createdBy);

  if (type) where.type = type as Prisma.EnumActivityTypeFilter['equals'];
  if (leadId) where.leadId = leadId;
  if (createdBy) where.createdBy = createdBy;
  if (search) where.content = { contains: search, mode: 'insensitive' };
  applyDateRange(where, getQueryDate(req.query.createdFrom, 'createdFrom'), getQueryDate(req.query.createdTo, 'createdTo'));

  const activities = await prisma.activity.findMany({
    where: await activityScope(req, where),
    include: {
      lead: { select: { fullName: true } },
      creator: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  return {
    title: 'Activities Export',
    headers: ['Type', 'Content', 'Lead', 'Creator', 'Created At'],
    rows: activities.map((activity): ExportRow => ({
      Type: activity.type,
      Content: activity.content,
      Lead: activity.lead.fullName,
      Creator: activity.creator.name,
      'Created At': activity.createdAt.toISOString(),
    })),
  };
}

async function getTeamRows(req: AuthRequest) {
  const role = getQueryString(req.query.role);
  const companyId = requireCompanyId(req);
  const where = await userScope(req, role ? { role: role as Prisma.EnumRoleFilter['equals'] } : {});
  const range = parseDateRange(req.query.range);
  const startDate = getStartDate(range);

  const dateFilter: Prisma.DateTimeFilter | undefined = startDate
    ? { gte: startDate }
    : undefined;

  const users = await prisma.user.findMany({
    where,
    include: {
      leads: {
        where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true }
      },
      deals: {
        where: {
          companyId,
          isWon: true,
          ...(dateFilter ? { closedAt: dateFilter } : {}),
        },
        select: { id: true, value: true },
      },
      activities: {
        where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true }
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  return {
    title: 'Team Performance Export',
    headers: ['Name', 'Email', 'Role', 'Leads', 'Deals Won', 'Revenue Closed', 'Activities'],
    rows: users.map((user): ExportRow => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Leads: user.leads.length,
      'Deals Won': user.deals.length,
      'Revenue Closed': user.deals.reduce((sum, deal) => sum + deal.value, 0),
      Activities: user.activities.length,
    })),
  };
}

async function buildExport(entity: ExportEntity, req: AuthRequest) {
  if (entity === 'leads') return getLeadRows(req);
  if (entity === 'deals') return getDealRows(req);
  if (entity === 'campaigns') return getCampaignRows(req);
  if (entity === 'activities') return getActivityRows(req);
  return getTeamRows(req);
}

async function handleExport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const entity = requireExportEntity(req.params.entity ?? '');
    const format = requireExportFormat(req.params.format ?? req.query.format);
    await assertFeature(req, 'exports');
    const exported = await buildExport(entity, req);
    const filename = exportFilename(entity, format);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(toPdf(exported.title, exported.rows, exported.headers));
      return;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(toCsv(exported.rows, exported.headers));
  } catch (error) {
    next(error);
  }
}

router.get('/:entity.:format', handleExport);
router.get('/:entity', handleExport);

export default router;
