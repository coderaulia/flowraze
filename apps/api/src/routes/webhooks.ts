import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  optionalEnum,
  optionalNonEmptyString,
  requireAtLeastOneField,
  requireObjectBody,
  requireString,
  setIfPresent,
} from '../utils/request.js';
import { getQueryBoolean } from '../utils/query.js';
import { createWebhookSecret } from '../utils/security.js';
import { dispatchWebhookEvent, processWebhookDelivery } from '../utils/webhooks.js';
import { assertFeature, assertWebhookLimit } from '../utils/entitlements.js';

const router = Router();
const WEBHOOK_EVENTS = ['lead_created', 'deal_created', 'deal_won', 'activity_created'] as const;

router.use(authenticate, requireAdmin());

function requireHttpUrl(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'URL is required');
  }

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol');
    }
    return url.toString();
  } catch {
    throw new AppError(400, 'URL must be a valid http(s) URL');
  }
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'webhooks');
    const isActive = getQueryBoolean(req.query.isActive, 'isActive');
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: {
        companyId: req.companyId!,
        ...(isActive === undefined ? {} : { isActive }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: webhooks });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const name = requireString(body, 'name', 'Name');
    const url = requireHttpUrl(body.url);
    const event = optionalEnum(WEBHOOK_EVENTS, 'Event')(body.event);
    await assertWebhookLimit(req);

    if (!event) {
      throw new AppError(400, 'Event is required');
    }

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        companyId: req.companyId!,
        name,
        url,
        event,
        secret: createWebhookSecret(),
        isActive: body.isActive === false ? false : true,
        createdById: req.userId!,
      },
      include: {
        deliveries: true,
      },
    });

    res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'webhooks');
    const body = requireObjectBody(req.body);
    const data: Record<string, unknown> = {};

    setIfPresent(data, body, 'name', optionalNonEmptyString);
    setIfPresent(data, body, 'url', requireHttpUrl);
    setIfPresent(data, body, 'event', optionalEnum(WEBHOOK_EVENTS, 'Event'));
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      if (typeof body.isActive !== 'boolean') {
        throw new AppError(400, 'isActive must be a boolean');
      }
      data.isActive = body.isActive;
    }
    requireAtLeastOneField(data);

    const existingWebhook = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { id: true },
    });

    if (!existingWebhook) {
      throw new AppError(404, 'Webhook not found');
    }

    const webhook = await prisma.webhookEndpoint.update({
      where: { id: existingWebhook.id },
      data,
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/test', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'webhooks');
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
    });

    if (!webhook) {
      throw new AppError(404, 'Webhook not found');
    }

    await dispatchWebhookEvent(webhook.event, {
      test: true,
      sentBy: req.userId ?? null,
      endpointId: webhook.id,
    }, req.companyId!);

    res.json({ success: true, data: { sent: true } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/deliveries/:deliveryId/replay', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'webhooks');
    const delivery = await prisma.webhookDelivery.findFirst({
      where: {
        id: req.params.deliveryId,
        endpointId: req.params.id,
        endpoint: { companyId: req.companyId! },
      },
    });

    if (!delivery) {
      throw new AppError(404, 'Webhook delivery not found');
    }

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'pending',
        retryCount: 0,
        nextRetryAt: new Date(),
        error: null,
      },
    });

    // We can run it in the background or immediately
    processWebhookDelivery(delivery.id).catch(console.error);

    res.json({ success: true, data: { replayed: true } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await assertFeature(req, 'webhooks');
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      select: { id: true },
    });

    if (!webhook) {
      throw new AppError(404, 'Webhook not found');
    }

    await prisma.webhookEndpoint.delete({ where: { id: webhook.id } });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
