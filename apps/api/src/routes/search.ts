import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.json({ success: true, data: { leads: [], deals: [], campaigns: [] } });
    }

    const [leads, deals, campaigns] = await prisma.$transaction([
      prisma.lead.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      prisma.deal.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
        },
        take: 10,
      }),
      prisma.campaign.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        take: 10,
      }),
    ]);

    res.json({ success: true, data: { leads, deals, campaigns } });
  } catch (error) {
    next(error);
  }
});

export default router;
