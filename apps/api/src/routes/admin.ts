import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireSuperadmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalEnum,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
} from '../utils/request.js';
import { getQueryString } from '../utils/query.js';
import { createOpaqueToken, hashSecret } from '../utils/security.js';

const router = Router();

const PLAN_TIERS = ['free', 'growth', 'pro', 'custom'] as const;
const BILLING_STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const;
const USER_ROLES = ['superadmin', 'admin', 'manager', 'employee'] as const;

router.use(authenticate);
router.use(requireSuperadmin());

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
          createdAt: true,
          company: { select: { id: true, name: true, slug: true } },
        },
        ...getPaginationArgs(pagination),
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(users, pagination, total));
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
        include: { company: { select: { id: true, name: true, slug: true, isActive: true } } },
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
      include: { company: { select: { id: true, name: true, slug: true } } },
    });

    res.json({ success: true, data: updated });
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
