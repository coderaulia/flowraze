import type { Prisma, WebhookEvent } from '@prisma/client';
import prisma from '../prisma/index.js';
import { signWebhookPayload } from './security.js';

const MAX_RETRIES = 5;

function getNextRetryAt(retryCount: number): Date {
  const baseDelayMs = 60 * 1000; // 1 minute
  const delayMs = baseDelayMs * Math.pow(5, retryCount);
  return new Date(Date.now() + delayMs);
}

export async function processWebhookDelivery(deliveryId: string) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });

  if (!delivery || delivery.status === 'success') return;

  const endpoint = delivery.endpoint;
  const body = JSON.stringify({
    event: delivery.event,
    payload: delivery.payload,
    createdAt: delivery.createdAt.toISOString(),
  });

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FlowRaze-Event': delivery.event,
        'X-FlowRaze-Signature': signWebhookPayload(endpoint.secret, body),
      },
      body,
    });

    if (response.ok) {
      await prisma.$transaction([
        prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'success',
            responseStatus: response.status,
            error: null,
            nextRetryAt: null,
          },
        }),
        prisma.webhookEndpoint.update({
          where: { id: endpoint.id },
          data: { lastTriggeredAt: new Date() },
        }),
      ]);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    const nextRetryCount = delivery.retryCount + 1;
    const shouldRetry = nextRetryCount < MAX_RETRIES;
    
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        error: error instanceof Error ? error.message : 'Webhook request failed',
        retryCount: nextRetryCount,
        nextRetryAt: shouldRetry ? getNextRetryAt(nextRetryCount) : null,
      },
    });
  }
}

export async function processPendingWebhooks() {
  const pendingDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: 'pending',
      nextRetryAt: {
        lte: new Date(),
      },
    },
    take: 20, // Process in batches
  });

  for (const delivery of pendingDeliveries) {
    // Process them asynchronously but serially or fire-and-forget
    await processWebhookDelivery(delivery.id);
  }
}

export async function dispatchWebhookEvent(event: WebhookEvent, payload: Prisma.InputJsonValue) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      event,
      isActive: true,
    },
  });

  if (endpoints.length === 0) {
    return;
  }

  // Create pending deliveries
  const deliveries = await Promise.all(
    endpoints.map((endpoint) =>
      prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload,
          status: 'pending',
          nextRetryAt: new Date(), // Immediate first try
        },
      })
    )
  );

  // Trigger processing asynchronously in the background
  for (const delivery of deliveries) {
    processWebhookDelivery(delivery.id).catch((err) => {
      console.error(`Failed to process webhook delivery ${delivery.id}`, err);
    });
  }
}

export function toWebhookPayload(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
