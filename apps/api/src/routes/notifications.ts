import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireCompanyMember } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireCompanyId } from '../utils/data-scope.js';

const router = Router();
router.use(authenticate, requireCompanyMember);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const unreadOnly = req.query.unread === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        companyId,
        userId: req.userId!,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { companyId, userId: req.userId!, isRead: false },
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);

    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, companyId, userId: req.userId! },
      select: { id: true },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);

    await prisma.notification.updateMany({
      where: { companyId, userId: req.userId!, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);

    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, companyId, userId: req.userId! },
      select: { id: true },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    await prisma.notification.delete({ where: { id: notification.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
