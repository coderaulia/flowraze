import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalEnum,
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { createOpaqueToken, hashSecret } from '../utils/security.js';
import { sendInviteEmail } from '../utils/email.js';

const router = Router();
const USER_ROLES = ['superadmin', 'admin', 'manager', 'employee'] as const;
const ADMIN_ASSIGNABLE_ROLES = ['admin', 'manager', 'employee'] as const;

router.use(authenticate);

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  companyId: true,
  emailVerifiedAt: true,
  inviteToken: true,
  inviteExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

function toUserDto(user: { inviteToken: string | null; inviteExpiresAt: Date | null; [key: string]: unknown }) {
  const { inviteToken, inviteExpiresAt, ...rest } = user;
  return {
    ...rest,
    invitePending: inviteToken !== null && (inviteExpiresAt === null || inviteExpiresAt > new Date()),
  };
}

function isSuperadmin(req: AuthRequest) {
  return req.userRole === 'superadmin';
}

function requireAdminCompanyId(req: AuthRequest) {
  if (!req.companyId) {
    throw new AppError(403, 'No company context');
  }
  return req.companyId;
}

async function ensureNotRemovingLastSuperadmin(userId: string, nextRole?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'superadmin' || nextRole === 'superadmin') {
    return;
  }

  const superadminCount = await prisma.user.count({ where: { role: 'superadmin' } });
  if (superadminCount <= 1) {
    throw new AppError(400, 'At least one superadmin is required');
  }
}

async function guardAdminTarget(req: AuthRequest, targetId: string) {
  if (isSuperadmin(req)) return;
  const companyId = requireAdminCompanyId(req);
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true, companyId: true },
  });
  if (!target) {
    throw new AppError(404, 'User not found');
  }
  if (target?.role === 'superadmin' || target?.companyId !== companyId) {
    throw new AppError(403, 'Admins can only manage users in their own company');
  }
}

async function ensureSeatAvailable(companyId: string) {
  const [billingAccount, activeUsers] = await prisma.$transaction([
    prisma.billingAccount.findUnique({
      where: { companyId },
      select: { seats: true },
    }),
    prisma.user.count({
      where: {
        companyId,
        isActive: true,
        role: { not: 'superadmin' },
      },
    }),
  ]);
  const seatLimit = billingAccount?.seats ?? 3;

  if (activeUsers >= seatLimit) {
    throw new AppError(
      403,
      `Seat limit reached. This workspace allows ${seatLimit} active users.`,
      'SEAT_LIMIT_REACHED'
    );
  }
}

router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

router.put('/me', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const updateData: Record<string, unknown> = {};

    setIfPresent(updateData, body, 'name', optionalNonEmptyString);
    if (Object.prototype.hasOwnProperty.call(body, 'password')) {
      const password = body.password;
      if (typeof password !== 'string') {
        throw new AppError(400, 'Password must be a string');
      }
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, 'No valid fields provided for update');
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData as Prisma.UserUpdateInput,
      select: userSelect,
    });

    res.json({ success: true, data: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/lookup', async (req: AuthRequest, res, next) => {
  try {
    const where = isSuperadmin(req) ? {} : { companyId: requireAdminCompanyId(req) };
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const where: Prisma.UserWhereInput = isSuperadmin(req)
      ? {}
      : { companyId: requireAdminCompanyId(req), role: { not: 'superadmin' } };
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: userSelect,
        where,
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(users.map(toUserDto), pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!isSuperadmin(req) && (user.role === 'superadmin' || user.companyId !== requireAdminCompanyId(req))) {
      throw new AppError(403, 'Admins can only view users in their own company');
    }

    res.json({ success: true, data: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const password = requireString(body, 'password', 'Password');
    const name = requireString(body, 'name', 'Name');

    const roleValidator = isSuperadmin(req)
      ? optionalEnum(USER_ROLES, 'Role')
      : optionalEnum(ADMIN_ASSIGNABLE_ROLES, 'Role');
    const role = roleValidator(body.role) || 'employee';

    if (!isSuperadmin(req) && role === 'superadmin') {
      throw new AppError(403, 'Admins cannot assign superadmin role');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, 'Email already in use');
    }

    const companyId = isSuperadmin(req) ? null : requireAdminCompanyId(req);
    if (companyId) {
      await ensureSeatAvailable(companyId);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        companyId,
      },
      select: userSelect,
    });

    res.status(201).json({ success: true, data: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, 'User id is required');
    }

    await guardAdminTarget(req, userId);

    const body = requireObjectBody(req.body);
    const updateData: Record<string, unknown> = {};

    setIfPresent(updateData, body, 'email', optionalNonEmptyString);
    setIfPresent(updateData, body, 'name', optionalNonEmptyString);

    const roleValidator = isSuperadmin(req)
      ? optionalEnum(USER_ROLES, 'Role')
      : optionalEnum(ADMIN_ASSIGNABLE_ROLES, 'Role');
    setIfPresent(updateData, body, 'role', roleValidator);

    if (!isSuperadmin(req) && updateData.role === 'superadmin') {
      throw new AppError(403, 'Admins cannot assign superadmin role');
    }

    if (Object.prototype.hasOwnProperty.call(body, 'password')) {
      const password = body.password;
      if (typeof password !== 'string') {
        throw new AppError(400, 'Password must be a string');
      }
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
    }
    requireAtLeastOneField(updateData);
    await ensureNotRemovingLastSuperadmin(userId, updateData.role as string | undefined);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData as Prisma.UserUpdateInput,
      select: userSelect,
    });

    res.json({ success: true, data: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, 'User id is required');
    }

    if (userId === req.userId) {
      throw new AppError(400, 'Cannot delete your own account');
    }

    await guardAdminTarget(req, userId);
    await ensureNotRemovingLastSuperadmin(userId);

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

const INVITE_TTL_DAYS = 7;

router.post('/invite', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const name = requireString(body, 'name', 'Name');

    const roleValidator = isSuperadmin(req)
      ? optionalEnum(USER_ROLES, 'Role')
      : optionalEnum(ADMIN_ASSIGNABLE_ROLES, 'Role');
    const role = roleValidator(body.role) || 'employee';

    if (!isSuperadmin(req) && role === 'superadmin') {
      throw new AppError(403, 'Admins cannot invite as superadmin');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, 'Email already in use');
    }

    const companyId = isSuperadmin(req) ? null : requireAdminCompanyId(req);
    if (companyId) {
      await ensureSeatAvailable(companyId);
    }

    const inviter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true },
    });

    const tempPassword = await bcrypt.hash(createOpaqueToken(), 10);
    const inviteToken = createOpaqueToken();
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: tempPassword,
        companyId,
        inviteToken: hashSecret(inviteToken),
        inviteExpiresAt,
      },
      select: userSelect,
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const inviteUrl = `${baseUrl}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
    await sendInviteEmail(email, name, inviter?.name ?? 'Your admin', inviteToken, inviteUrl);

    res.status(201).json({ success: true, data: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/resend-invite', requireRole('superadmin', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, companyId: true, inviteToken: true, inviteExpiresAt: true },
    });

    if (!target) {
      throw new AppError(404, 'User not found');
    }
    if (!isSuperadmin(req) && (target.role === 'superadmin' || target.companyId !== requireAdminCompanyId(req))) {
      throw new AppError(403, 'Admins can only manage users in their own company');
    }
    if (!target.inviteToken) {
      throw new AppError(400, 'User has already accepted their invitation');
    }

    const inviter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true },
    });

    const inviteToken = createOpaqueToken();
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { inviteToken: hashSecret(inviteToken), inviteExpiresAt },
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const inviteUrl = `${baseUrl}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
    await sendInviteEmail(target.email, target.name, inviter?.name ?? 'Your admin', inviteToken, inviteUrl);

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
