import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import { parseDateRange, getStartDate } from '../utils/date.js';
import type { Prisma } from '@prisma/client';
import { requireCompanyId, userScope } from '../utils/data-scope.js';
import { getQueryString } from '../utils/query.js';
import { assertFeature } from '../utils/entitlements.js';

const router = Router();

router.use(authenticate, companyDataScope);

router.get('/performance', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'teamPerformance');
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
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              leads: { where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) } },
              activities: { where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) } },
            },
          },
          deals: {
            where: {
              companyId,
              isWon: true,
              ...(dateFilter ? { closedAt: dateFilter } : {}),
            },
            select: { value: true },
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
      leadsAssigned: user._count.leads,
      dealsWon: user.deals.length,
      revenueClosed: user.deals.reduce((sum, d) => sum + d.value, 0),
      activitiesLogged: user._count.activities,
    }));

    res.json(paginatedResponse(performance, pagination, total));
  } catch (error) {
    next(error);
  }
});

export default router;
