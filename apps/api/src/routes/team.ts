import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { parseDateRange, getStartDate } from '../utils/date.js';
import type { Prisma } from '@prisma/client';
import { requireCompanyId, userScope } from '../utils/data-scope.js';
import { getQueryString } from '../utils/query.js';

const router = Router();

router.use(authenticate, companyDataScope);

router.get('/performance', async (req: AuthRequest, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const range = parseDateRange(req.query.range);
    const role = getQueryString(req.query.role);
    const startDate = getStartDate(range);
    const companyId = requireCompanyId(req);

    const dateFilter: Prisma.DateTimeFilter | undefined = startDate
      ? { gte: startDate }
      : undefined;

    const where = await userScope(req, role ? { role: role as Prisma.EnumRoleFilter['equals'] } : {});

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          leads: {
            where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
            select: { id: true }
          },
          deals: {
            where: {
              companyId,
              stage: 'won',
              ...(dateFilter ? { closedAt: dateFilter } : {}),
            },
            select: { id: true, value: true },
          },
          activities: {
            where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
            select: { id: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.user.count({ where }),
    ]);

    const performance = users.map((user) => ({
      userId: user.id,
      userName: user.name,
      leadsAssigned: user.leads.length,
      dealsWon: user.deals.length,
      revenueClosed: user.deals.reduce((sum, d) => sum + d.value, 0),
      activitiesLogged: user.activities.length,
    }));

    res.json(paginatedResponse(performance, pagination, total));
  } catch (error) {
    next(error);
  }
});

export default router;
