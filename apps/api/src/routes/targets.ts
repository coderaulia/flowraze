import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, requireAdminOrManager, AuthRequest, companyDataScope } from '../middleware/auth.js';
import {
  requireString,
  requireNumber,
  requireEnum,
  optionalNumber,
} from '../utils/request.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate, companyDataScope);

const VALID_SCOPES = ['company', 'team', 'individual'] as const;
const VALID_PERIODS = ['monthly', 'quarterly', 'yearly'] as const;

// ─── SalesTeam CRUD ──────────────────────────────────────────────────────────

router.get('/teams', async (req: AuthRequest, res, next) => {
  try {
    const teams = await prisma.salesTeam.findMany({
      where: { companyId: req.companyId! },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        _count: { select: { targets: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
});

router.post('/teams', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const name = requireString(body, 'name');
    const managerId = requireString(body, 'managerId');
    const existingTeam = await prisma.salesTeam.findFirst({
      where: { companyId: req.companyId!, name },
      select: { id: true },
    });

    if (existingTeam) {
      throw new AppError(409, 'Sales team already exists', 'DUPLICATE_SALES_TEAM');
    }

    const team = await prisma.salesTeam.create({
      data: { companyId: req.companyId!, name, managerId },
      include: { manager: { select: { id: true, name: true } } },
    });
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

router.put('/teams/:id', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const existing = await prisma.salesTeam.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
    });
    if (!existing) throw new AppError(404, 'Team not found');
    if (req.userRole === 'manager' && existing.managerId !== req.userId!) {
      throw new AppError(403, 'Managers can only update their own team');
    }
    const updates: { name?: string; managerId?: string } = {};
    if (body.name !== undefined) updates.name = requireString(body, 'name');
    if (body.managerId !== undefined) updates.managerId = requireString(body, 'managerId');
    if (Object.keys(updates).length === 0) throw new AppError(400, 'No fields to update');
    const team = await prisma.salesTeam.update({ where: { id: req.params.id }, data: updates });
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

router.delete('/teams/:id', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.salesTeam.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
    });
    if (!existing) throw new AppError(404, 'Team not found');
    if (req.userRole === 'manager' && existing.managerId !== req.userId!) {
      throw new AppError(403, 'Managers can only delete their own team');
    }
    await prisma.salesTeam.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/teams/:id/members', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const userId = requireString(body, 'userId');
    const existing = await prisma.salesTeam.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
    });
    if (!existing) throw new AppError(404, 'Team not found');
    if (req.userRole === 'manager' && existing.managerId !== req.userId!) {
      throw new AppError(403, 'Managers can only add members to their own team');
    }
    await prisma.salesTeamMember.create({ data: { teamId: req.params.id!, userId } });
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/teams/:id/members/:userId', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.salesTeam.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
    });
    if (!existing) throw new AppError(404, 'Team not found');
    if (req.userRole === 'manager' && existing.managerId !== req.userId!) {
      throw new AppError(403, 'Managers can only remove members from their own team');
    }
    await prisma.salesTeamMember.delete({
      where: { teamId_userId: { teamId: req.params.id!, userId: req.params.userId! } },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── SalesTarget CRUD ────────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const q = req.query as Record<string, string>;
    const where: Prisma.SalesTargetWhereInput = { companyId: req.companyId! };
    if (q.scope) where.scope = q.scope as typeof VALID_SCOPES[number];
    if (q.period) where.period = q.period as typeof VALID_PERIODS[number];
    if (q.year) where.year = parseInt(q.year, 10);
    if (q.quarter) where.quarter = parseInt(q.quarter, 10);
    if (q.month) where.month = parseInt(q.month, 10);
    if (q.teamId) where.teamId = q.teamId;
    if (q.userId) where.userId = q.userId;

    const targets = await prisma.salesTarget.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }, { month: 'desc' }],
    });
    res.json({ success: true, data: targets });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const role = req.userRole;
    const body = req.body as Record<string, unknown>;
    const scope = requireEnum(body, 'scope', VALID_SCOPES);
    const period = requireEnum(body, 'period', VALID_PERIODS);
    const name = requireString(body, 'name');
    const year = requireNumber(body, 'year');
    const targetValue = requireNumber(body, 'targetValue');

    // manager can only set team or individual targets (not company-wide)
    if (role === 'manager' && scope === 'company') {
      throw new AppError(403, 'Managers cannot set company-wide targets');
    }

    const userId = typeof body.userId === 'string' && body.userId ? body.userId : null;
    const teamId = typeof body.teamId === 'string' && body.teamId ? body.teamId : null;

    const data: Prisma.SalesTargetUncheckedCreateInput = {
      companyId: req.companyId!,
      name,
      scope,
      period,
      year,
      targetValue,
    };
    if (body.quarter !== undefined) data.quarter = optionalNumber(body.quarter) as number | undefined;
    if (body.month !== undefined) data.month = optionalNumber(body.month) as number | undefined;
    if (body.targetLeads !== undefined) data.targetLeads = optionalNumber(body.targetLeads) as number | undefined;
    if (body.targetDeals !== undefined) data.targetDeals = optionalNumber(body.targetDeals) as number | undefined;
    if (body.shareOfParent !== undefined) data.shareOfParent = optionalNumber(body.shareOfParent) as number | undefined;
    if (body.category !== undefined) data.category = (body.category as string) || null;
    if (scope === 'individual' && userId) data.userId = userId;
    if (scope === 'team' && teamId) data.teamId = teamId;

    const existingTarget = await prisma.salesTarget.findFirst({
      where: {
        companyId: req.companyId!,
        scope,
        period,
        year,
        quarter: (data.quarter as number | undefined) ?? null,
        month: (data.month as number | undefined) ?? null,
        category: (data.category as string | null | undefined) ?? null,
        userId: scope === 'individual' ? userId : null,
        teamId: scope === 'team' ? teamId : null,
      },
      select: { id: true },
    });

    if (existingTarget) {
      throw new AppError(409, 'Sales target already exists for this scope and period', 'DUPLICATE_SALES_TARGET');
    }

    const target = await prisma.salesTarget.create({
      data,
      include: {
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ success: true, data: target });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const updates: Prisma.SalesTargetUpdateInput = {};
    if (body.name !== undefined) updates.name = requireString(body, 'name');
    if (body.targetValue !== undefined) updates.targetValue = requireNumber(body, 'targetValue');
    if (body.targetLeads !== undefined) updates.targetLeads = optionalNumber(body.targetLeads) as number | null;
    if (body.targetDeals !== undefined) updates.targetDeals = optionalNumber(body.targetDeals) as number | null;
    if (body.shareOfParent !== undefined) updates.shareOfParent = optionalNumber(body.shareOfParent) as number | null;
    if (body.category !== undefined) updates.category = (body.category as string) || null;

    if (Object.keys(updates).length === 0) throw new AppError(400, 'No fields to update');

    const existing = await prisma.salesTarget.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { scope: true },
    });
    if (!existing) throw new AppError(404, 'Target not found');
    if (req.userRole === 'manager' && existing.scope === 'company') {
      throw new AppError(403, 'Managers cannot update company-wide targets');
    }

    const target = await prisma.salesTarget.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: target });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdminOrManager(), async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.salesTarget.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
    });
    if (!existing) throw new AppError(404, 'Target not found');
    if (req.userRole === 'manager' && existing.scope === 'company') {
      throw new AppError(403, 'Managers cannot delete company-wide targets');
    }
    await prisma.salesTarget.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
