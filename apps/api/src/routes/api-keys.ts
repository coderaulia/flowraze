import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { createApiKey, getKeyPrefix, hashSecret } from '../utils/security.js';
import { requireObjectBody, requireString } from '../utils/request.js';

const router = Router();

router.use(authenticate, requireRole('superadmin'));

router.get('/', async (_req: AuthRequest, res, next) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: apiKeys });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');
    const key = createApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash: hashSecret(key),
        keyPrefix: getKeyPrefix(key),
        createdById: req.userId!,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...apiKey,
        key,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const apiKey = await prisma.apiKey.findUnique({ where: { id: req.params.id } });

    if (!apiKey) {
      throw new AppError(404, 'API key not found');
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
