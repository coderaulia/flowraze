import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, companyDataScope } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPagination, getPaginationArgs, paginatedResponse } from '../utils/pagination.js';
import {
  optionalDate,
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireNumber,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { getQueryDate, getQueryNumber, getQueryString } from '../utils/query.js';
import { dispatchWebhookEvent, toWebhookPayload } from '../utils/webhooks.js';
import { dispatchAutomationEvent, toAutomationPayload } from '../utils/automation.js';
import { assertLeadVisible, dealScope } from '../utils/data-scope.js';

const router = Router();
const DEAL_STATUSES = ['active', 'closed'] as const;

router.use(authenticate, companyDataScope);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const pipelineId = getQueryString(req.query.pipelineId);
    const pipelineStageId = getQueryString(req.query.pipelineStageId);
    const status = getQueryString(req.query.status);
    const search = getQueryString(req.query.search);
    const ownerId = getQueryString(req.query.ownerId);
    const leadId = getQueryString(req.query.leadId);
    const minValue = getQueryNumber(req.query.minValue, 'minValue');
    const maxValue = getQueryNumber(req.query.maxValue, 'maxValue');
    const createdFrom = getQueryDate(req.query.createdFrom, 'createdFrom');
    const createdTo = getQueryDate(req.query.createdTo, 'createdTo');
    const expectedCloseFrom = getQueryDate(req.query.expectedCloseFrom, 'expectedCloseFrom');
    const expectedCloseTo = getQueryDate(req.query.expectedCloseTo, 'expectedCloseTo');
    const where: Prisma.DealWhereInput = {};

    if (pipelineId) where.pipelineId = pipelineId;
    if (pipelineStageId) where.pipelineStageId = pipelineStageId;
    if (status) where.status = status as Prisma.EnumDealStatusFilter['equals'];
    if (ownerId) where.ownerId = ownerId;
    if (leadId) where.leadId = leadId;

    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {
        ...(minValue !== undefined ? { gte: minValue } : {}),
        ...(maxValue !== undefined ? { lte: maxValue } : {}),
      };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    if (expectedCloseFrom || expectedCloseTo) {
      where.expectedCloseDate = {
        ...(expectedCloseFrom ? { gte: expectedCloseFrom } : {}),
        ...(expectedCloseTo ? { lte: expectedCloseTo } : {}),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { lead: { fullName: { contains: search, mode: 'insensitive' } } },
        { lead: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const pagination = getPagination(req.query);
    const scopedWhere = await dealScope(req, where);
    const [deals, total] = await prisma.$transaction([
      prisma.deal.findMany({
        where: scopedWhere,
        include: {
          lead: { select: { id: true, fullName: true, companyName: true } },
          owner: { select: { id: true, name: true } },
          pipelineStage: { select: { id: true, name: true, color: true, isWon: true, isLost: true, order: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs(pagination),
      }),
      prisma.deal.count({ where: scopedWhere }),
    ]);

    res.json(paginatedResponse(deals, pagination, total));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const deal = await prisma.deal.findFirst({
      where: await dealScope(req, { id: req.params.id }),
      include: {
        lead: true,
        owner: { select: { id: true, name: true } },
        pipelineStage: { select: { id: true, name: true, color: true, isWon: true, isLost: true, order: true } },
      },
    });

    if (!deal) {
      throw new AppError(404, 'Deal not found');
    }

    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const leadId = requireString(body, 'leadId', 'Lead');
    const title = requireString(body, 'title', 'Title');
    const value = requireNumber(body, 'value', 'Value');
    const expectedCloseDate = optionalDate(body.expectedCloseDate) ?? undefined;
    await assertLeadVisible(req, leadId);

    // Resolve pipeline stage
    let pipelineStageId: string;
    let pipelineId: string;

    if (body.pipelineStageId) {
      const stageId = String(body.pipelineStageId);
      const stage = await prisma.pipelineStage.findFirst({
        where: { id: stageId, pipeline: { companyId: req.companyId! } },
        include: { pipeline: { select: { id: true } } },
      });
      if (!stage) throw new AppError(400, 'Invalid pipeline stage');
      pipelineStageId = stage.id;
      pipelineId = stage.pipeline.id;
    } else {
      // Default to first stage of default pipeline
      const pipeline = await prisma.pipeline.findFirst({
        where: { companyId: req.companyId!, isDefault: true },
        include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
      });
      if (!pipeline || pipeline.stages.length === 0) {
        throw new AppError(500, 'No pipeline configured for this company');
      }
      pipelineId = pipeline.id;
      pipelineStageId = pipeline.stages[0]!.id;
    }

    const stageRecord = await prisma.pipelineStage.findUniqueOrThrow({ where: { id: pipelineStageId } });

    const existingDeal = await prisma.deal.findFirst({
      where: {
        companyId: req.companyId!,
        leadId,
        ownerId: req.userId!,
        title: { equals: title, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existingDeal) {
      throw new AppError(409, 'Deal already exists for this lead and owner', 'DUPLICATE_DEAL');
    }

    const deal = await prisma.deal.create({
      data: {
        companyId: req.companyId!,
        leadId,
        title,
        value,
        pipelineId,
        pipelineStageId,
        isWon: stageRecord.isWon,
        isLost: stageRecord.isLost,
        expectedCloseDate,
        closedAt: stageRecord.isWon || stageRecord.isLost ? new Date() : undefined,
        ownerId: req.userId!,
      },
      include: {
        lead: { select: { id: true, fullName: true, companyName: true, serviceType: true, source: true } },
        owner: { select: { id: true, name: true } },
        pipelineStage: { select: { id: true, name: true, color: true, isWon: true, isLost: true, order: true } },
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        companyId: req.companyId!,
        name: `[Project] ${deal.title}`,
        type: deal.lead.serviceType || 'Project',
        channel: deal.lead.source || 'organic',
        startDate: new Date(),
        salesOwnerId: deal.ownerId,
        cost: 0,
      },
    });

    await prisma.lead.update({
      where: { id: deal.leadId },
      data: { campaignId: campaign.id },
    });

    void dispatchWebhookEvent('deal_created', toWebhookPayload({ deal }), req.companyId!).catch((error) => {
      console.error('Deal webhook dispatch failed:', error);
    });
    void dispatchAutomationEvent(req.companyId!, 'deal_created', toAutomationPayload({ deal })).catch((error) => {
      console.error('Deal automation dispatch failed:', error);
    });
    if (deal.isWon) {
      void dispatchWebhookEvent('deal_won', toWebhookPayload({ deal }), req.companyId!).catch((error) => {
        console.error('Deal won webhook dispatch failed:', error);
      });
      void dispatchAutomationEvent(req.companyId!, 'deal_won', toAutomationPayload({ deal })).catch((error) => {
        console.error('Deal won automation dispatch failed:', error);
      });
    }

    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'title', optionalNonEmptyString);
    setIfPresent(data, body, 'value', (value) => requireNumber({ value }, 'value', 'Value'));
    setIfPresent(data, body, 'expectedCloseDate', optionalDate);
    setIfPresent(data, body, 'status', (v) => (DEAL_STATUSES.includes(v as typeof DEAL_STATUSES[number]) ? v : undefined));
    requireAtLeastOneField({ ...data, pipelineStageId: body.pipelineStageId });

    const existingDeal = await prisma.deal.findFirst({
      where: await dealScope(req, { id: req.params.id }),
      select: { isWon: true, isLost: true, ownerId: true, pipelineStageId: true },
    });

    if (!existingDeal) {
      throw new AppError(404, 'Deal not found');
    }

    // Handle pipeline stage change
    if (body.pipelineStageId !== undefined) {
      const stageId = String(body.pipelineStageId);
      const newStage = await prisma.pipelineStage.findFirst({
        where: { id: stageId, pipeline: { companyId: req.companyId! } },
        include: { pipeline: { select: { id: true } } },
      });
      if (!newStage) throw new AppError(400, 'Invalid pipeline stage');

      data.pipelineStageId = newStage.id;
      data.pipelineId = newStage.pipeline.id;
      data.isWon = newStage.isWon;
      data.isLost = newStage.isLost;

      const wasWon = existingDeal.isWon;
      const nowWon = newStage.isWon;
      const nowClosed = newStage.isWon || newStage.isLost;

      if (nowClosed && !wasWon) {
        data.closedAt = new Date();
      } else if (!nowClosed && wasWon) {
        data.closedAt = null;
      }
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: data as Prisma.DealUncheckedUpdateInput,
      include: {
        lead: { select: { id: true, fullName: true, companyName: true } },
        owner: { select: { id: true, name: true } },
        pipelineStage: { select: { id: true, name: true, color: true, isWon: true, isLost: true, order: true } },
      },
    });

    if (!existingDeal.isWon && deal.isWon) {
      void dispatchWebhookEvent('deal_won', toWebhookPayload({ deal }), req.companyId!).catch((error) => {
        console.error('Deal won webhook dispatch failed:', error);
      });
      void dispatchAutomationEvent(req.companyId!, 'deal_won', toAutomationPayload({ deal })).catch((error) => {
        console.error('Deal won automation dispatch failed:', error);
      });
    }

    if (!existingDeal.isLost && deal.isLost) {
      void dispatchAutomationEvent(req.companyId!, 'deal_lost', toAutomationPayload({ deal })).catch((error) => {
        console.error('Deal lost automation dispatch failed:', error);
      });
    }

    if (body.pipelineStageId !== undefined && existingDeal.pipelineStageId !== deal.pipelineStageId) {
      void dispatchAutomationEvent(req.companyId!, 'deal_stage_changed', toAutomationPayload({
        deal,
        previousStageId: existingDeal.pipelineStageId,
      })).catch((error) => {
        console.error('Deal stage changed automation dispatch failed:', error);
      });
    }

    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existingDeal = await prisma.deal.findFirst({
      where: await dealScope(req, { id: req.params.id }),
      select: { id: true },
    });

    if (!existingDeal) {
      throw new AppError(404, 'Deal not found');
    }

    await prisma.deal.delete({ where: { id: existingDeal.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
