import type { AutomationActionType, AutomationTriggerEvent, Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';

const MAX_RETRIES = 3;
const ACTIVITY_TYPES = ['note', 'call', 'follow_up'] as const;
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'] as const;

type JsonRecord = Record<string, unknown>;

function getNextRetryAt(retryCount: number) {
  return new Date(Date.now() + 60_000 * Math.pow(3, retryCount));
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function findLeadId(value: unknown): string | null {
  const payload = asRecord(value);
  const directLeadId = payload.leadId;
  if (typeof directLeadId === 'string' && directLeadId.trim()) return directLeadId;

  const lead = asRecord(payload.lead);
  if (typeof lead.id === 'string' && lead.id.trim()) return lead.id;

  const deal = asRecord(payload.deal);
  const dealLeadId = deal.leadId;
  if (typeof dealLeadId === 'string' && dealLeadId.trim()) return dealLeadId;

  const nestedLead = asRecord(deal.lead);
  if (typeof nestedLead.id === 'string' && nestedLead.id.trim()) return nestedLead.id;

  return null;
}

function requireActionString(config: JsonRecord, key: string, label: string) {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

async function runCreateActivity(companyId: string, payload: unknown, config: JsonRecord) {
  const leadId = findLeadId(payload);
  if (!leadId) {
    throw new Error('Automation payload does not include a lead');
  }

  const activityType = requireActionString(config, 'activityType', 'Activity type');
  if (!ACTIVITY_TYPES.includes(activityType as (typeof ACTIVITY_TYPES)[number])) {
    throw new Error('Activity type is invalid');
  }

  const content = requireActionString(config, 'content', 'Activity content');
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, companyId },
    select: { id: true, ownerId: true },
  });

  if (!lead) {
    throw new Error('Lead was not found for this company');
  }

  const activity = await prisma.activity.create({
    data: {
      companyId,
      leadId: lead.id,
      type: activityType as (typeof ACTIVITY_TYPES)[number],
      content,
      createdBy: lead.ownerId,
    },
    select: { id: true, leadId: true, type: true },
  });

  return { activity };
}

async function runUpdateLeadStatus(companyId: string, payload: unknown, config: JsonRecord) {
  const leadId = findLeadId(payload);
  if (!leadId) {
    throw new Error('Automation payload does not include a lead');
  }

  const status = requireActionString(config, 'status', 'Lead status');
  if (!LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) {
    throw new Error('Lead status is invalid');
  }

  const existingLead = await prisma.lead.findFirst({
    where: { id: leadId, companyId },
    select: { id: true },
  });

  if (!existingLead) {
    throw new Error('Lead was not found for this company');
  }

  const lead = await prisma.lead.update({
    where: { id: existingLead.id },
    data: { status: status as (typeof LEAD_STATUSES)[number] },
    select: { id: true, status: true },
  });

  return { lead };
}

async function runAssignOwner(companyId: string, payload: unknown, config: JsonRecord) {
  const leadId = findLeadId(payload);
  if (!leadId) {
    throw new Error('Automation payload does not include a lead');
  }

  const userId = requireActionString(config, 'userId', 'Owner user');

  const [lead, user] = await Promise.all([
    prisma.lead.findFirst({ where: { id: leadId, companyId }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: userId, companyId }, select: { id: true } }),
  ]);

  if (!lead) throw new Error('Lead was not found for this company');
  if (!user) throw new Error('Target user was not found for this company');

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { ownerId: user.id },
    select: { id: true, ownerId: true },
  });

  return { lead: updated };
}

async function runSendNotification(companyId: string, _payload: unknown, config: JsonRecord) {
  const title = requireActionString(config, 'title', 'Notification title');
  const body = requireActionString(config, 'body', 'Notification body');

  const recipientRole = typeof config.recipientRole === 'string' ? config.recipientRole : null;
  const whereRole = recipientRole && ['admin', 'manager'].includes(recipientRole)
    ? { role: recipientRole as 'admin' | 'manager' }
    : {};

  const users = await prisma.user.findMany({
    where: { companyId, isActive: true, ...whereRole },
    select: { id: true },
  });

  if (users.length === 0) return { notified: 0 };

  await prisma.notification.createMany({
    data: users.map((u) => ({ companyId, userId: u.id, title, body })),
  });

  return { notified: users.length };
}

async function runFireWebhook(_companyId: string, payload: unknown, config: JsonRecord) {
  const url = requireActionString(config, 'url', 'Webhook URL');
  const method = typeof config.method === 'string' && ['GET', 'POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase())
    ? config.method.toUpperCase()
    : 'POST';

  const body = method === 'GET' ? undefined : JSON.stringify(payload);
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'FlowRaze-Automation/1.0' };

  if (typeof config.secret === 'string' && config.secret.trim()) {
    headers['X-FlowRaze-Secret'] = config.secret.trim();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { method, headers, body, signal: controller.signal });
    return { status: response.status, ok: response.ok };
  } finally {
    clearTimeout(timeout);
  }
}

async function runAction(companyId: string, actionType: AutomationActionType, payload: unknown, actionConfig: unknown) {
  const config = asRecord(actionConfig);

  if (actionType === 'create_activity') {
    return runCreateActivity(companyId, payload, config);
  }

  if (actionType === 'update_lead_status') {
    return runUpdateLeadStatus(companyId, payload, config);
  }

  if (actionType === 'assign_owner') {
    return runAssignOwner(companyId, payload, config);
  }

  if (actionType === 'send_notification') {
    return runSendNotification(companyId, payload, config);
  }

  if (actionType === 'fire_webhook') {
    return runFireWebhook(companyId, payload, config);
  }

  throw new Error('Automation action is not supported');
}

export async function processAutomationRun(runId: string) {
  // Use a transaction to atomically claim the run (prevents concurrent processing)
  const run = await prisma.$transaction(async (tx) => {
    const found = await tx.automationRun.findUnique({
      where: { id: runId },
      include: { rule: true },
    });

    if (!found || found.status === 'success' || found.status === 'running') return null;

    await tx.automationRun.update({
      where: { id: found.id },
      data: { status: 'running', error: null },
    });

    return found;
  });

  if (!run) return;

  try {
    const result = await runAction(run.companyId, run.actionType, run.payload, run.rule.actionConfig);

    await prisma.$transaction([
      prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'success',
          result: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
          error: null,
          nextRetryAt: null,
        },
      }),
      prisma.automationRule.update({
        where: { id: run.ruleId },
        data: { lastTriggeredAt: new Date() },
      }),
    ]);
  } catch (error) {
    // Use atomic increment for retryCount to prevent lost updates
    const updated = await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        retryCount: { increment: 1 },
        error: error instanceof Error ? error.message : 'Automation run failed',
      },
      select: { retryCount: true },
    });

    const shouldRetry = updated.retryCount < MAX_RETRIES;
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        nextRetryAt: shouldRetry ? getNextRetryAt(updated.retryCount) : null,
      },
    });
  }
}

export async function processPendingAutomationRuns() {
  const runs = await prisma.automationRun.findMany({
    where: {
      status: 'pending',
      nextRetryAt: { lte: new Date() },
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  for (const run of runs) {
    await processAutomationRun(run.id);
  }
}

export async function queueAutomationRun(
  ruleId: string,
  companyId: string,
  triggerEvent: AutomationTriggerEvent,
  actionType: AutomationActionType,
  payload: Prisma.InputJsonValue
) {
  const run = await prisma.automationRun.create({
    data: {
      ruleId,
      companyId,
      triggerEvent,
      actionType,
      payload,
      status: 'pending',
      nextRetryAt: new Date(),
    },
  });

  processAutomationRun(run.id).catch((error) => {
    console.error(`Automation run ${run.id} failed to process`, error);
  });

  return run;
}

export async function dispatchAutomationEvent(
  companyId: string,
  triggerEvent: Exclude<AutomationTriggerEvent, 'manual'>,
  payload: Prisma.InputJsonValue
) {
  const rules = await prisma.automationRule.findMany({
    where: { companyId, triggerEvent, isActive: true },
    select: { id: true, actionType: true },
  });

  await Promise.all(
    rules.map((rule) => queueAutomationRun(rule.id, companyId, triggerEvent, rule.actionType, payload))
  );
}

export function toAutomationPayload(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
