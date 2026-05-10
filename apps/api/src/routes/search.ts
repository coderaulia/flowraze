import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { getQueryString } from '../utils/query.js';
import { activityScope, campaignScope, dealScope, leadScope } from '../utils/data-scope.js';

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

    const [leadWhere, dealWhere, campaignWhere, activityWhere] = await Promise.all([
      leadScope(req, {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
        ],
      }),
      dealScope(req, {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { lead: { fullName: { contains: q, mode: 'insensitive' } } },
          { lead: { companyName: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      campaignScope(req, {
        name: { contains: q, mode: 'insensitive' },
      }),
      activityScope(req, {
        OR: [
          { content: { contains: q, mode: 'insensitive' } },
          { lead: { fullName: { contains: q, mode: 'insensitive' } } },
          { creator: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    ]);

    const [leads, deals, campaigns, activities] = await prisma.$transaction([
      prisma.lead.findMany({
        where: leadWhere,
        include: {
          owner: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
        take: 10,
      }),
      prisma.deal.findMany({
        where: dealWhere,
        include: {
          lead: { select: { id: true, fullName: true, companyName: true } },
          owner: { select: { id: true, name: true } },
        },
        take: 10,
      }),
      prisma.campaign.findMany({
        where: campaignWhere,
        take: 10,
      }),
      prisma.activity.findMany({
        where: activityWhere,
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
