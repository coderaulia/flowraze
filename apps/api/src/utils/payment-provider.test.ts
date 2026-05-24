import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAmount, PLAN_PRICES } from './payment-provider.js';

test('workspace plan prices use flat monthly and annual amounts', () => {
  assert.deepEqual(PLAN_PRICES.starter, {
    monthly: 300_000,
    annual: 3_000_000,
    label: 'Starter',
  });
  assert.deepEqual(PLAN_PRICES.growth, {
    monthly: 800_000,
    annual: 8_000_000,
    label: 'Growth',
  });

  assert.equal(calculateAmount('starter', 'monthly'), 300_000);
  assert.equal(calculateAmount('starter', 'annual'), 3_000_000);
  assert.equal(calculateAmount('growth', 'monthly'), 800_000);
  assert.equal(calculateAmount('growth', 'annual'), 8_000_000);
});

test('custom plans do not expose a self-service checkout amount', () => {
  assert.equal(calculateAmount('custom', 'monthly'), 0);
});
