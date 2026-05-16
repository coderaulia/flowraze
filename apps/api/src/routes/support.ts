import { Router } from 'express';
import type { Prisma, SupportTicketStatus } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireCompanyMember } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireCompanyId } from '../utils/data-scope.js';
import {
  optionalEnum,
  optionalNonEmptyString,
  optionalUrl,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { getQueryString } from '../utils/query.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';

const router = Router();

const TICKET_TYPES = ['bug', 'question', 'onboarding', 'billing', 'feature_request'] as const;
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TICKET_STATUSES = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] as const;
const ADMIN_ROLES = ['admin', 'superadmin'] as const;

router.use(authenticate, requireCompanyMember);

function isSupportAdmin(req: AuthRequest) {
  return ADMIN_ROLES.includes(req.userRole as (typeof ADMIN_ROLES)[number]);
}

function optionalTrimmedString(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new AppError(400, 'Value must be a string');
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

async function getSlaDueAt(companyId: string, priority: (typeof TICKET_PRIORITIES)[number]) {
  const billing = await prisma.billingAccount.findUnique({
    where: { companyId },
    select: { plan: true, status: true },
  });
  const plan = billing?.status === 'active' || billing?.status === 'trialing' ? billing.plan : 'free';
  const planHours = {
    free: 72,
    growth: 48,
    pro: 24,
    custom: 8,
  } as const;
  const priorityMultiplier = {
    low: 1.5,
    medium: 1,
    high: 0.5,
    urgent: 0.25,
  } as const;
  const hours = Math.max(2, planHours[plan] * priorityMultiplier[priority]);

  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function assertAssignableUserInCompany(companyId: string, userId: string | undefined) {
  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
      role: { in: ['admin', 'manager'] },
      isActive: true,
    },
    select: { id: true },
  });
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const status = getQueryString(req.query.status);
    const type = getQueryString(req.query.type);
    const pagination = getPagination(req.query);
    const where: Prisma.SupportTicketWhereInput = { companyId };

    if (!isSupportAdmin(req)) {
      where.requesterId = req.userId!;
    }

    if (status && TICKET_STATUSES.includes(status as (typeof TICKET_STATUSES)[number])) {
      where.status = status as Prisma.EnumSupportTicketStatusFilter['equals'];
    }

    if (type && TICKET_TYPES.includes(type as (typeof TICKET_TYPES)[number])) {
      where.type = type as Prisma.EnumSupportTicketTypeFilter['equals'];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json(paginatedResponse(tickets, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const body = requireObjectBody(req.body);
    const type = optionalEnum(TICKET_TYPES, 'Ticket type')(body.type);
    const priority = optionalEnum(TICKET_PRIORITIES, 'Priority')(body.priority) ?? 'medium';
    const subject = requireString(body, 'subject', 'Subject');
    const description = requireString(body, 'description', 'Description');

    if (!type) {
      throw new AppError(400, 'Ticket type is required');
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        companyId,
        requesterId: req.userId!,
        type,
        priority,
        subject,
        description,
        pageUrl: optionalUrl(body.pageUrl, 'Page URL'),
        browserInfo: optionalTrimmedString(body.browserInfo),
        slaDueAt: await getSlaDueAt(companyId, priority),
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    if (!isSupportAdmin(req)) {
      throw new AppError(403, 'Only company admins can update support tickets');
    }

    const body = requireObjectBody(req.body);
    const data: Prisma.SupportTicketUncheckedUpdateInput = {};

    setIfPresent(data, body, 'status', optionalEnum(TICKET_STATUSES, 'Status'));
    setIfPresent(data, body, 'priority', optionalEnum(TICKET_PRIORITIES, 'Priority'));
    setIfPresent(data, body, 'assignedToId', optionalNonEmptyString);
    requireAtLeastOneField(data as Record<string, unknown>);

    if (typeof data.assignedToId === 'string') {
      const assignee = await assertAssignableUserInCompany(companyId, data.assignedToId);
      if (!assignee) {
        throw new AppError(400, 'Assignee must be an active admin or manager in this company');
      }
    }

    const existingTicket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, companyId },
      select: { id: true, status: true },
    });

    if (!existingTicket) {
      throw new AppError(404, 'Support ticket not found');
    }

    const status = data.status as SupportTicketStatus | undefined;
    if (status && ['resolved', 'closed'].includes(status) && !['resolved', 'closed'].includes(existingTicket.status)) {
      data.resolvedAt = new Date();
    }

    if (status && !['resolved', 'closed'].includes(status)) {
      data.resolvedAt = null;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: existingTicket.id },
      data,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

export default router;
