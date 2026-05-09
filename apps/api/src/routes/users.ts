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

const router = Router();
const USER_ROLES = ['superadmin', 'admin', 'staff'] as const;

router.use(authenticate);

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

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

router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: user });
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

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get('/lookup', async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.user.count(),
    ]);

    res.json(paginatedResponse(users, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const password = requireString(body, 'password', 'Password');
    const name = requireString(body, 'name', 'Name');

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new AppError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: optionalEnum(USER_ROLES, 'Role')(body.role) || 'staff',
      },
      select: userSelect,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, 'User id is required');
    }

    const body = requireObjectBody(req.body);
    const updateData: Record<string, unknown> = {};

    setIfPresent(updateData, body, 'email', optionalNonEmptyString);
    setIfPresent(updateData, body, 'name', optionalNonEmptyString);
    setIfPresent(updateData, body, 'role', optionalEnum(USER_ROLES, 'Role'));
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

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, 'User id is required');
    }

    if (userId === req.userId) {
      throw new AppError(400, 'Cannot delete your own account');
    }

    await ensureNotRemovingLastSuperadmin(userId);

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
