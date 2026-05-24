import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_ENTITLEMENTS } from './entitlements.js';

test('starter plan exposes the paid core CRM package', () => {
  const starter = PLAN_ENTITLEMENTS.starter;

  assert.equal(starter.seats, 5);
  assert.equal(starter.analytics, false);
  assert.equal(starter.apiKeys, 0);
  assert.equal(starter.automation, false);
  assert.equal(starter.campaigns, false);
  assert.equal(starter.exports, true);
  assert.equal(starter.pipelines, 1);
  assert.equal(starter.targets, false);
  assert.equal(starter.teamPerformance, false);
  assert.equal(starter.webhooks, 0);
});

test('growth plan enables campaigns and team performance', () => {
  const growth = PLAN_ENTITLEMENTS.growth;

  assert.equal(growth.seats, null);
  assert.equal(growth.analytics, true);
  assert.equal(growth.campaigns, true);
  assert.equal(growth.teamPerformance, true);
  assert.equal(growth.webhooks, 3);
  assert.equal(growth.apiKeys, 0);
  assert.equal(growth.exports, true);
  assert.equal(growth.targets, true);
  assert.equal(growth.automation, false);
  assert.equal(growth.pipelines, 3);
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
  const tiers = ['starter', 'growth', 'custom'] as const;
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
