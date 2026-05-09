import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { getQueryString } from '../utils/query.js';

const router = Router();
router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const q = getQueryString(req.query.q);
    if (!q) {
      return res.json({
        success: true,
        data: {
          leads: [],
          deals: [],
          campaigns: [],
          activities: [],
        },
      });
    }

    const [leads, deals, campaigns, activities] = await prisma.$transaction([
      prisma.lead.findMany({
        where: {
          companyId: req.companyId!,
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          owner: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
        take: 10,
      }),
      prisma.deal.findMany({
        where: {
          companyId: req.companyId!,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { lead: { fullName: { contains: q, mode: 'insensitive' } } },
            { lead: { companyName: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          lead: { select: { id: true, fullName: true, companyName: true } },
          owner: { select: { id: true, name: true } },
        },
        take: 10,
      }),
      prisma.campaign.findMany({
        where: {
          companyId: req.companyId!,
          name: { contains: q, mode: 'insensitive' },
        },
        take: 10,
      }),
      prisma.activity.findMany({
        where: {
          companyId: req.companyId!,
          OR: [
            { content: { contains: q, mode: 'insensitive' } },
            { lead: { fullName: { contains: q, mode: 'insensitive' } } },
            { creator: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          lead: { select: { id: true, fullName: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({ success: true, data: { leads, deals, campaigns, activities } });
  } catch (error) {
    next(error);
  }
});

export default router;
