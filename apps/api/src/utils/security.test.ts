import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createApiKey,
  createOpaqueToken,
  createWebhookSecret,
  getKeyPrefix,
  hashSecret,
  signWebhookPayload,
} from './security.js';

test('security tokens use stable prefixes where expected', () => {
  const apiKey = createApiKey();
  const webhookSecret = createWebhookSecret();

  assert.equal(apiKey.startsWith('frk_'), true);
  assert.equal(webhookSecret.startsWith('whsec_'), true);
  assert.equal(getKeyPrefix(apiKey), apiKey.slice(0, 12));
});

test('hashSecret is deterministic and opaque', () => {
  const token = createOpaqueToken();

  assert.equal(hashSecret(token), hashSecret(token));
  assert.notEqual(hashSecret(token), token);
});

test('webhook signatures change with payload content', () => {
  const secret = createWebhookSecret();

  assert.notEqual(
    signWebhookPayload(secret, '{"event":"lead_created"}'),
    signWebhookPayload(secret, '{"event":"deal_won"}')
  );
});
