import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { requireAtLeastOneField, requireObjectBody, setIfPresent } from '../utils/request.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
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
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      throw new AppError(400, 'Email, password, and name are required');
    }

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
        role: role || 'staff',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const updateData: Record<string, unknown> = {};

    setIfPresent(updateData, body, 'email');
    setIfPresent(updateData, body, 'name');
    setIfPresent(updateData, body, 'role');
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

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData as Prisma.UserUpdateInput,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('superadmin'), async (req: AuthRequest, res, next) => {
  try {
    if (req.params.id === req.userId) {
      throw new AppError(400, 'Cannot delete your own account');
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
