import { createHash, createHmac, randomBytes } from 'node:crypto';

export function createOpaqueToken(byteLength = 32) {
  return randomBytes(byteLength).toString('hex');
}

export function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

export function createApiKey() {
  return `frk_${createOpaqueToken(24)}`;
}

export function getKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 12);
}

export function createWebhookSecret() {
  return `whsec_${createOpaqueToken(24)}`;
}

export function signWebhookPayload(secret: string, body: string) {
  return createHmac('sha256', secret).update(body).digest('hex');
}
