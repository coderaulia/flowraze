import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  optionalNonEmptyString,
  requireNumber,
  requireObjectBody,
  requireString,
} from '../utils/request.js';
import { requireCompanyId } from '../utils/data-scope.js';
import { getCompanyEntitlements } from '../utils/entitlements.js';

const router = Router();
router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const pipelines = await prisma.pipeline.findMany({
      where: { companyId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: pipelines });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');

    const entitlements = await getCompanyEntitlements(companyId);
    const limit = entitlements.limits.pipelines;
    if (Number.isFinite(limit)) {
      const count = await prisma.pipeline.count({ where: { companyId } });
      if (count >= (limit as number)) {
        throw new AppError(
          403,
          `Pipeline limit reached for the ${entitlements.plan} plan.`,
          'ENTITLEMENT_LIMIT_REACHED'
        );
      }
    }

    const existing = await prisma.pipeline.findFirst({
      where: { companyId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new AppError(409, 'A pipeline with this name already exists.', 'DUPLICATE_PIPELINE');
    }

    const pipeline = await prisma.pipeline.create({
      data: { companyId, name, isDefault: false },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json({ success: true, data: pipeline });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const body = requireObjectBody(req.body);
    const name = optionalNonEmptyString(body.name);

    const pipeline = await prisma.pipeline.findFirst({ where: { id: req.params.id, companyId } });
    if (!pipeline) throw new AppError(404, 'Pipeline not found');

    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: name ? { name } : {},
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const pipeline = await prisma.pipeline.findFirst({ where: { id: req.params.id, companyId } });
    if (!pipeline) throw new AppError(404, 'Pipeline not found');
    if (pipeline.isDefault) {
      throw new AppError(400, 'Cannot delete the default pipeline.', 'DEFAULT_PIPELINE');
    }

    const dealCount = await prisma.deal.count({ where: { pipelineId: pipeline.id } });
    if (dealCount > 0) {
      throw new AppError(
        400,
        'Cannot delete a pipeline with active deals. Move or delete the deals first.',
        'PIPELINE_HAS_DEALS'
      );
    }

    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stages', requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');
    const color = typeof body.color === 'string' ? body.color : '#bcc3ff';
    const isWon = Boolean(body.isWon);
    const isLost = Boolean(body.isLost);

    const pipeline = await prisma.pipeline.findFirst({ where: { id: req.params.id, companyId } });
    if (!pipeline) throw new AppError(404, 'Pipeline not found');

    const maxStage = await prisma.pipelineStage.findFirst({
      where: { pipelineId: pipeline.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (maxStage?.order ?? 0) + 1;

    const stage = await prisma.pipelineStage.create({
      data: { pipelineId: pipeline.id, name, order, color, isWon, isLost },
    });
    res.status(201).json({ success: true, data: stage });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/stages/:stageId', requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const body = requireObjectBody(req.body);

    const pipeline = await prisma.pipeline.findFirst({ where: { id: req.params.id, companyId } });
    if (!pipeline) throw new AppError(404, 'Pipeline not found');

    const stage = await prisma.pipelineStage.findFirst({
      where: { id: req.params.stageId, pipelineId: pipeline.id },
    });
    if (!stage) throw new AppError(404, 'Stage not found');

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = requireString(body, 'name', 'Name');
    if (body.color !== undefined) data.color = body.color;
    if (body.isWon !== undefined) data.isWon = Boolean(body.isWon);
    if (body.isLost !== undefined) data.isLost = Boolean(body.isLost);
    if (body.order !== undefined) data.order = requireNumber(body, 'order', 'Order');

    const updated = await prisma.pipelineStage.update({ where: { id: stage.id }, data });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/stages/:stageId', requireAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const pipeline = await prisma.pipeline.findFirst({ where: { id: req.params.id, companyId } });
    if (!pipeline) throw new AppError(404, 'Pipeline not found');

    const stage = await prisma.pipelineStage.findFirst({
      where: { id: req.params.stageId, pipelineId: pipeline.id },
    });
    if (!stage) throw new AppError(404, 'Stage not found');

    const stageCount = await prisma.pipelineStage.count({ where: { pipelineId: pipeline.id } });
    if (stageCount <= 1) {
      throw new AppError(400, 'Cannot delete the last stage in a pipeline.', 'LAST_STAGE');
    }

    const dealCount = await prisma.deal.count({ where: { pipelineStageId: stage.id } });
    if (dealCount > 0) {
      throw new AppError(
        400,
        'Cannot delete a stage with active deals. Move the deals first.',
        'STAGE_HAS_DEALS'
      );
    }

    await prisma.pipelineStage.delete({ where: { id: stage.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
