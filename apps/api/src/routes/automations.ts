import { Router } from 'express';
import type { AutomationActionType, AutomationTriggerEvent, Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireAdmin, requireCompanyMember } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { assertFeature } from '../utils/entitlements.js';
import {
  optionalEnum,
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { queueAutomationRun, toAutomationPayload } from '../utils/automation.js';

const router = Router();

const TRIGGER_EVENTS = ['manual', 'lead_created', 'deal_created', 'deal_won', 'activity_created'] as const;
const ACTION_TYPES = ['create_activity', 'update_lead_status'] as const;
const ACTIVITY_TYPES = ['note', 'call', 'follow_up'] as const;
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'] as const;

router.use(authenticate, requireAdmin(), requireCompanyMember);

function validateActionConfig(actionType: AutomationActionType, value: unknown): Prisma.InputJsonValue {
  const config = requireObjectBody(value);

  if (actionType === 'create_activity') {
    const activityType = optionalEnum(ACTIVITY_TYPES, 'Activity type')(config.activityType);
    const content = requireString(config, 'content', 'Activity content');

    if (!activityType) {
      throw new AppError(400, 'Activity type is required');
    }

    return { activityType, content };
  }

  if (actionType === 'update_lead_status') {
    const status = optionalEnum(LEAD_STATUSES, 'Lead status')(config.status);

    if (!status) {
      throw new AppError(400, 'Lead status is required');
    }

    return { status };
  }

  throw new AppError(400, 'Action type is invalid');
}

function buildManualPayload(body: Record<string, unknown>): Prisma.InputJsonValue {
  const leadId = requireString(body, 'leadId', 'Lead');
  return toAutomationPayload({ leadId, manual: true });
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'automation');

    const rules = await prisma.automationRule.findMany({
      where: { companyId: req.companyId! },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'automation');
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');
    const triggerEvent = optionalEnum(TRIGGER_EVENTS, 'Trigger event')(body.triggerEvent);
    const actionType = optionalEnum(ACTION_TYPES, 'Action type')(body.actionType);

    if (!triggerEvent) {
      throw new AppError(400, 'Trigger event is required');
    }

    if (!actionType) {
      throw new AppError(400, 'Action type is required');
    }

    const existingRule = await prisma.automationRule.findFirst({
      where: {
        companyId: req.companyId!,
        name: { equals: name, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existingRule) {
      throw new AppError(409, 'Automation rule already exists for this company', 'DUPLICATE_AUTOMATION_RULE');
    }

    const rule = await prisma.automationRule.create({
      data: {
        companyId: req.companyId!,
        name,
        triggerEvent,
        actionType,
        actionConfig: validateActionConfig(actionType, body.actionConfig),
        isActive: body.isActive === false ? false : true,
        createdById: req.userId!,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        runs: true,
      },
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'automation');
    const body = requireObjectBody(req.body);
    const existingRule = await prisma.automationRule.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { id: true, actionType: true },
    });

    if (!existingRule) {
      throw new AppError(404, 'Automation rule not found');
    }

    const data: Prisma.AutomationRuleUncheckedUpdateInput = {};
    setIfPresent(data, body, 'name', optionalNonEmptyString);
    setIfPresent(data, body, 'triggerEvent', optionalEnum(TRIGGER_EVENTS, 'Trigger event'));
    setIfPresent(data, body, 'actionType', optionalEnum(ACTION_TYPES, 'Action type'));
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      if (typeof body.isActive !== 'boolean') {
        throw new AppError(400, 'isActive must be a boolean');
      }
      data.isActive = body.isActive;
    }

    const actionType = (data.actionType ?? existingRule.actionType) as AutomationActionType;
    if (Object.prototype.hasOwnProperty.call(body, 'actionConfig') || data.actionType) {
      data.actionConfig = validateActionConfig(actionType, body.actionConfig);
    }

    requireAtLeastOneField(data as Record<string, unknown>);

    const rule = await prisma.automationRule.update({
      where: { id: existingRule.id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/run', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'automation');
    const body = requireObjectBody(req.body);
    const rule = await prisma.automationRule.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { id: true, actionType: true },
    });

    if (!rule) {
      throw new AppError(404, 'Automation rule not found');
    }

    const run = await queueAutomationRun(
      rule.id,
      req.companyId!,
      'manual' as AutomationTriggerEvent,
      rule.actionType,
      buildManualPayload(body)
    );

    res.status(202).json({ success: true, data: run });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/runs', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'automation');
    const rule = await prisma.automationRule.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { id: true },
    });

    if (!rule) {
      throw new AppError(404, 'Automation rule not found');
    }

    const runs = await prisma.automationRun.findMany({
      where: { ruleId: rule.id, companyId: req.companyId! },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    res.json({ success: true, data: runs });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'automation');
    const rule = await prisma.automationRule.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { id: true },
    });

    if (!rule) {
      throw new AppError(404, 'Automation rule not found');
    }

    await prisma.automationRule.delete({ where: { id: rule.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
