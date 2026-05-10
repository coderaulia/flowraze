import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireSuperadmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalEnum,
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireNumber,
  requireObjectBody,
  requireString,
} from '../utils/request.js';
import { getQueryString } from '../utils/query.js';
import { createOpaqueToken, hashSecret } from '../utils/security.js';

const router = Router();

const PLAN_TIERS = ['free', 'growth', 'pro', 'custom'] as const;
const BILLING_STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const;
const USER_ROLES = ['superadmin', 'admin', 'manager', 'employee'] as const;
const COMPANY_USER_ROLES = ['admin', 'manager', 'employee'] as const;
const PLAN_MONTHLY_PRICE = {
  free: 0,
  growth: 149_000,
  pro: 299_000,
  custom: 0,
} as const;

router.use(authenticate);
router.use(requireSuperadmin());

function getMonthlyAmount(plan: keyof typeof PLAN_MONTHLY_PRICE, seats: number) {
  return PLAN_MONTHLY_PRICE[plan] * seats;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getInvitePending(user: { inviteToken?: string | null; inviteExpiresAt?: Date | null }) {
  return Boolean(user.inviteToken && user.inviteExpiresAt && user.inviteExpiresAt > new Date());
}

function serializeUser<T extends { inviteToken?: string | null; inviteExpiresAt?: Date | null }>(user: T) {
  const { inviteToken: _inviteToken, ...safeUser } = user;
  return {
    ...safeUser,
    invitePending: getInvitePending(user),
  };
}

function requireRouteParam(value: string | undefined, label: string) {
  if (!value) {
    throw new AppError(400, `${label} is required`);
  }

  return value;
}

async function ensureOpenInvoice(account: {
  id: string;
  companyId: string;
  plan: keyof typeof PLAN_MONTHLY_PRICE;
  seats: number;
}) {
  const existing = await prisma.billingInvoice.findFirst({
    where: { billingAccountId: account.id, status: 'open' },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) return existing;

  return prisma.billingInvoice.create({
    data: {
      companyId: account.companyId,
      billingAccountId: account.id,
      invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`,
      amount: getMonthlyAmount(account.plan, account.seats),
      dueDate: addDays(new Date(), 7),
    },
  });
}

async function getBillingDetails(companyId: string) {
  const account = await prisma.billingAccount.findUnique({
    where: { companyId },
    include: {
      company: { select: { id: true, name: true, slug: true, isActive: true } },
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
      payments: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!account) throw new AppError(404, 'Billing account not found');
  return account;
}

// ─── Overview ────────────────────────────────────────────────────────────────

router.get('/overview', async (_req: AuthRequest, res, next) => {
  try {
    const [totalCompanies, activeCompanies, totalUsers, activeUsers, accounts, recentCompanies] =
      await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.billingAccount.findMany(),
        prisma.company.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            billing: { select: { plan: true, status: true, seats: true } },
            _count: { select: { users: true } },
          },
        }),
      ]);

    const planDistribution = accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.plan] = (acc[account.plan] ?? 0) + 1;
      return acc;
    }, {});
    const billingStatusDistribution = accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.status] = (acc[account.status] ?? 0) + 1;
      return acc;
    }, {});
    const activeSeats = accounts.reduce((total, account) => total + account.seats, 0);
    const estimatedMRR = accounts.reduce(
      (total, account) => total + getMonthlyAmount(account.plan, account.seats),
      0
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalCompanies,
          activeCompanies,
          totalUsers,
          activeUsers,
          activeSeats,
          estimatedMRR,
          planDistribution,
          billingStatusDistribution,
        },
        recentCompanies,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Companies ───────────────────────────────────────────────────────────────

router.get('/companies', async (req: AuthRequest, res, next) => {
  try {
    const search = getQueryString(req.query.search);
    const pagination = getPagination(req.query);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          billing: { select: { plan: true, status: true, seats: true } },
          _count: { select: { users: true } },
        },
        ...getPaginationArgs(pagination),
      }),
      prisma.company.count({ where }),
    ]);

    res.json(paginatedResponse(companies, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/companies/:id', async (req: AuthRequest, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        billing: true,
        _count: { select: { users: true, leads: true, deals: true } },
      },
    });

    if (!company) throw new AppError(404, 'Company not found');

    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.get('/companies/:id/users', async (req: AuthRequest, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) throw new AppError(404, 'Company not found');

    const users = await prisma.user.findMany({
      where: { companyId: req.params.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        emailVerifiedAt: true,
        inviteToken: true,
        inviteExpiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ success: true, data: users.map(serializeUser) });
  } catch (error) {
    next(error);
  }
});

router.post('/companies', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Company name');
    const slug = requireString(body, 'slug', 'Slug');
    const adminEmail = requireString(body, 'adminEmail', 'Admin email');
    const adminName = requireString(body, 'adminName', 'Admin name');
    const adminPassword = requireString(body, 'adminPassword', 'Admin password');

    if (adminPassword.length < 8) {
      throw new AppError(400, 'Admin password must be at least 8 characters');
    }

    const [existingSlug, existingUser] = await Promise.all([
      prisma.company.findUnique({ where: { slug } }),
      prisma.user.findUnique({ where: { email: adminEmail } }),
    ]);
    if (existingSlug) throw new AppError(409, 'Slug already taken');
    if (existingUser) throw new AppError(409, 'Email already in use');

    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({ data: { name, slug } });

      await tx.billingAccount.create({ data: { companyId: newCompany.id } });

      await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: await bcrypt.hash(adminPassword, 10),
          role: 'admin',
          companyId: newCompany.id,
          emailVerifiedAt: new Date(),
        },
      });

      return tx.company.findUnique({
        where: { id: newCompany.id },
        include: { billing: true, _count: { select: { users: true } } },
      });
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.put('/companies/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    requireAtLeastOneField(body);

    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Company not found');

    const newSlug = typeof body.slug === 'string' ? body.slug.trim() : undefined;
    if (newSlug && newSlug !== existing.slug) {
      const taken = await prisma.company.findUnique({ where: { slug: newSlug } });
      if (taken) throw new AppError(409, 'Slug already taken');
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (newSlug) data.slug = newSlug;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data,
      include: { billing: true, _count: { select: { users: true } } },
    });

    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.delete('/companies/:id', async (req: AuthRequest, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) throw new AppError(404, 'Company not found');

    await prisma.company.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, data: { deactivated: true } });
  } catch (error) {
    next(error);
  }
});

// ─── Users (cross-company) ───────────────────────────────────────────────────

router.get('/users', async (req: AuthRequest, res, next) => {
  try {
    const search = getQueryString(req.query.search);
    const companyId = getQueryString(req.query.companyId);
    const role = optionalEnum(USER_ROLES, 'Role')(getQueryString(req.query.role));
    const pagination = getPagination(req.query);

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          emailVerifiedAt: true,
          inviteToken: true,
          inviteExpiresAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true, slug: true } },
        },
        ...getPaginationArgs(pagination),
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(users.map(serializeUser), pagination, total));
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email').toLowerCase();
    const name = requireString(body, 'name', 'Name');
    const companyId = requireString(body, 'companyId', 'Company');
    const role = optionalEnum(COMPANY_USER_ROLES, 'Role')(body.role) ?? 'employee';

    const [company, existingUser] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.user.findUnique({ where: { email } }),
    ]);

    if (!company) throw new AppError(404, 'Company not found');
    if (existingUser) throw new AppError(409, 'Email already in use');

    const rawToken = createOpaqueToken();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: '',
        role,
        companyId,
        inviteToken: hashSecret(rawToken),
        inviteExpiresAt: addDays(new Date(), 7),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        emailVerifiedAt: true,
        inviteToken: true,
        inviteExpiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    res.status(201).json({ success: true, data: { user: serializeUser(user), inviteToken: rawToken } });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    requireAtLeastOneField(body);

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'User not found');

    if (existing.role === 'superadmin') {
      throw new AppError(400, 'Use the superadmin invite flow for superadmin accounts');
    }

    const nextEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    if (nextEmail && nextEmail !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: nextEmail } });
      if (taken) throw new AppError(409, 'Email already in use');
    }

    const nextCompanyId = typeof body.companyId === 'string' ? body.companyId.trim() : undefined;
    if (nextCompanyId) {
      const company = await prisma.company.findUnique({ where: { id: nextCompanyId } });
      if (!company) throw new AppError(404, 'Company not found');
    }

    const role = optionalEnum(COMPANY_USER_ROLES, 'Role')(body.role);
    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (nextEmail) data.email = nextEmail;
    if (role) data.role = role;
    if (nextCompanyId) data.companyId = nextCompanyId;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        emailVerifiedAt: true,
        inviteToken: true,
        inviteExpiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ success: true, data: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:id/resend-invite', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'User not found');
    if (existing.role === 'superadmin') throw new AppError(400, 'Use the superadmin invite flow');

    const rawToken = createOpaqueToken();
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        inviteToken: hashSecret(rawToken),
        inviteExpiresAt: addDays(new Date(), 7),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        emailVerifiedAt: true,
        inviteToken: true,
        inviteExpiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ success: true, data: { user: serializeUser(user), inviteToken: rawToken } });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:id/reset-password-token', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'User not found');
    if (!existing.isActive) throw new AppError(400, 'Cannot reset password for inactive user');

    const rawToken = createOpaqueToken();
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        passwordResetToken: hashSecret(rawToken),
        passwordResetRequestedAt: new Date(),
        passwordResetExpiresAt: addDays(new Date(), 1),
      },
    });

    res.json({ success: true, data: { resetToken: rawToken } });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    if (req.params.id === req.userId) {
      throw new AppError(400, 'You cannot deactivate your own account');
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'User not found');

    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    res.json({ success: true, data: { deactivated: true } });
  } catch (error) {
    next(error);
  }
});

// ─── Billing (platform overview) ─────────────────────────────────────────────

router.get('/billing', async (_req: AuthRequest, res, next) => {
  try {
    const [accounts, planCounts, statusCounts] = await Promise.all([
      prisma.billingAccount.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true, slug: true, isActive: true } },
          invoices: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.billingAccount.groupBy({ by: ['plan'], _count: { _all: true } }),
      prisma.billingAccount.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    res.json({
      success: true,
      data: {
        accounts,
        summary: { byPlan: planCounts, byStatus: statusCounts, total: accounts.length },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/billing/:companyId', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireRouteParam(req.params.companyId, 'Company id');
    const account = await getBillingDetails(companyId);
    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

router.put('/billing/:companyId', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    requireAtLeastOneField(body);

    const billing = await prisma.billingAccount.findUnique({
      where: { companyId: req.params.companyId },
    });
    if (!billing) throw new AppError(404, 'Billing account not found');

    const plan = optionalEnum(PLAN_TIERS, 'Plan')(body.plan);
    const status = optionalEnum(BILLING_STATUSES, 'Status')(body.status);

    const data: Record<string, unknown> = {};
    if (plan) data.plan = plan;
    if (status) data.status = status;
    if (typeof body.seats === 'number' && body.seats > 0) data.seats = body.seats;

    const updated = await prisma.billingAccount.update({
      where: { companyId: req.params.companyId },
      data,
      include: {
        company: { select: { id: true, name: true, slug: true, isActive: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/billing/:companyId/check-payment', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireRouteParam(req.params.companyId, 'Company id');
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : {};
    const account = await prisma.billingAccount.findUnique({
      where: { companyId },
    });
    if (!account) throw new AppError(404, 'Billing account not found');

    const invoice = await ensureOpenInvoice(account);
    const amount = Object.prototype.hasOwnProperty.call(body, 'amount')
      ? requireNumber(body, 'amount', 'Amount')
      : invoice.amount;
    const reference = Object.prototype.hasOwnProperty.call(body, 'reference')
      ? optionalNonEmptyString(body.reference)
      : undefined;
    const notes = Object.prototype.hasOwnProperty.call(body, 'notes')
      ? optionalNonEmptyString(body.notes)
      : undefined;

    const pendingPayment = await prisma.billingPayment.findFirst({
      where: { billingAccountId: account.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingPayment) {
      await prisma.billingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          amount,
          reference,
          notes,
          checkedAt: new Date(),
          invoiceId: invoice.id,
        },
      });
    } else {
      await prisma.billingPayment.create({
        data: {
          companyId: account.companyId,
          billingAccountId: account.id,
          invoiceId: invoice.id,
          amount,
          reference,
          notes,
          checkedAt: new Date(),
        },
      });
    }

    res.json({ success: true, data: await getBillingDetails(companyId) });
  } catch (error) {
    next(error);
  }
});

router.post('/billing/:companyId/mark-paid', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireRouteParam(req.params.companyId, 'Company id');
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : {};
    const account = await prisma.billingAccount.findUnique({
      where: { companyId },
    });
    if (!account) throw new AppError(404, 'Billing account not found');

    const invoice = await ensureOpenInvoice(account);
    const amount = Object.prototype.hasOwnProperty.call(body, 'amount')
      ? requireNumber(body, 'amount', 'Amount')
      : invoice.amount;
    const reference = Object.prototype.hasOwnProperty.call(body, 'reference')
      ? optionalNonEmptyString(body.reference)
      : undefined;
    const notes = Object.prototype.hasOwnProperty.call(body, 'notes')
      ? optionalNonEmptyString(body.notes)
      : undefined;
    const now = new Date();

    const pendingPayment = await prisma.billingPayment.findFirst({
      where: { billingAccountId: account.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    await prisma.$transaction([
      pendingPayment
        ? prisma.billingPayment.update({
            where: { id: pendingPayment.id },
            data: {
              amount,
              reference,
              notes,
              status: 'paid',
              checkedAt: pendingPayment.checkedAt ?? now,
              paidAt: now,
              invoiceId: invoice.id,
            },
          })
        : prisma.billingPayment.create({
            data: {
              companyId: account.companyId,
              billingAccountId: account.id,
              invoiceId: invoice.id,
              amount,
              reference,
              notes,
              status: 'paid',
              checkedAt: now,
              paidAt: now,
            },
          }),
      prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: { status: 'paid', paidAt: now },
      }),
      prisma.billingAccount.update({
        where: { id: account.id },
        data: { status: 'active', renewalDate: addDays(now, 30) },
      }),
    ]);

    res.json({ success: true, data: await getBillingDetails(companyId) });
  } catch (error) {
    next(error);
  }
});

// ─── Invite superadmin ───────────────────────────────────────────────────────

router.post('/users/invite-superadmin', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const name = requireString(body, 'name', 'Name');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'Email already in use');

    const rawToken = createOpaqueToken();
    const tokenHash = hashSecret(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        name,
        password: '',
        role: 'superadmin',
        companyId: null,
        inviteToken: tokenHash,
        inviteExpiresAt: expiresAt,
      },
    });

    res.status(201).json({ success: true, data: { inviteToken: rawToken } });
  } catch (error) {
    next(error);
  }
});

export default router;
