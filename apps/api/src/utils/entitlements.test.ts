import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_ENTITLEMENTS } from './entitlements.js';

test('free plan has correct feature restrictions', () => {
  const free = PLAN_ENTITLEMENTS.free;

  assert.equal(free.seats, 3);
  assert.equal(free.analytics, false);
  assert.equal(free.apiKeys, 0);
  assert.equal(free.automation, false);
  assert.equal(free.campaigns, false);
  assert.equal(free.exports, false);
  assert.equal(free.pipelines, 1);
  assert.equal(free.targets, false);
  assert.equal(free.teamPerformance, false);
  assert.equal(free.webhooks, 0);
});

test('growth plan enables campaigns and team performance', () => {
  const growth = PLAN_ENTITLEMENTS.growth;

  assert.equal(growth.seats, null);
  assert.equal(growth.analytics, true);
  assert.equal(growth.campaigns, true);
  assert.equal(growth.teamPerformance, true);
  assert.equal(growth.webhooks, 3);
  assert.equal(growth.apiKeys, 0);
  assert.equal(growth.exports, false);
  assert.equal(growth.targets, false);
});

test('pro plan enables all features with higher limits', () => {
  const pro = PLAN_ENTITLEMENTS.pro;

  assert.equal(pro.seats, null);
  assert.equal(pro.analytics, true);
  assert.equal(pro.apiKeys, 5);
  assert.equal(pro.automation, true);
  assert.equal(pro.campaigns, true);
  assert.equal(pro.exports, true);
  assert.equal(pro.targets, true);
  assert.equal(pro.teamPerformance, true);
  assert.equal(pro.pipelines, Number.POSITIVE_INFINITY);
  assert.equal(pro.webhooks, Number.POSITIVE_INFINITY);
});

test('custom plan has unlimited everything', () => {
  const custom = PLAN_ENTITLEMENTS.custom;

  assert.equal(custom.seats, null);
  assert.equal(custom.apiKeys, Number.POSITIVE_INFINITY);
  assert.equal(custom.pipelines, Number.POSITIVE_INFINITY);
  assert.equal(custom.webhooks, Number.POSITIVE_INFINITY);
  assert.equal(custom.analytics, true);
  assert.equal(custom.automation, true);
  assert.equal(custom.campaigns, true);
  assert.equal(custom.exports, true);
  assert.equal(custom.targets, true);
  assert.equal(custom.teamPerformance, true);
});

test('plan tiers are progressively more permissive', () => {
  const tiers = ['free', 'growth', 'pro', 'custom'] as const;
  const featureCount = tiers.map((tier) => {
    const config = PLAN_ENTITLEMENTS[tier];
    return [
      config.analytics,
      config.apiKeys > 0,
      config.automation,
      config.campaigns,
      config.exports,
      config.targets,
      config.teamPerformance,
      config.webhooks > 0,
    ].filter(Boolean).length;
  });

  for (let i = 1; i < featureCount.length; i++) {
    assert.ok(
      featureCount[i]! >= featureCount[i - 1]!,
      `${tiers[i]} should have >= features than ${tiers[i - 1]}`
    );
  }
});
