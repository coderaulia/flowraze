import type { Prisma, WebhookEvent } from '@prisma/client';
import prisma from '../prisma/index.js';
import { signWebhookPayload } from './security.js';

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

  await Promise.all(
    endpoints.map(async (endpoint) => {
      const body = JSON.stringify({ event, payload, createdAt: new Date().toISOString() });
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-FlowRaze-Event': event,
            'X-FlowRaze-Signature': signWebhookPayload(endpoint.secret, body),
          },
          body,
        });

        await prisma.$transaction([
          prisma.webhookDelivery.create({
            data: {
              endpointId: endpoint.id,
              event,
              payload,
              status: response.ok ? 'success' : 'failed',
              responseStatus: response.status,
              error: response.ok ? null : `HTTP ${response.status}`,
            },
          }),
          prisma.webhookEndpoint.update({
            where: { id: endpoint.id },
            data: { lastTriggeredAt: new Date() },
          }),
        ]);
      } catch (error) {
        await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            event,
            payload,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Webhook request failed',
          },
        });
      }
    })
  );
}

export function toWebhookPayload(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
