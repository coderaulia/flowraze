import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { disconnectPrisma } from './prisma/index.js';
import { processPendingWebhooks } from './utils/webhooks.js';
import { processSubscriptionRenewals } from './utils/subscription.js';
import { processPendingAutomationRuns } from './utils/automation.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 3000;

// ─── Cron lock to prevent overlapping executions ─────────────────────────────

let webhookProcessing = false;
let automationProcessing = false;
let renewalProcessing = false;

async function runWebhookProcessor() {
  if (webhookProcessing) return;
  webhookProcessing = true;
  try {
    await processPendingWebhooks();
  } catch (error) {
    console.error('Webhook retry processor error:', error);
  } finally {
    webhookProcessing = false;
  }
}

async function runAutomationProcessor() {
  if (automationProcessing) return;
  automationProcessing = true;
  try {
    await processPendingAutomationRuns();
  } catch (error) {
    console.error('Automation retry processor error:', error);
  } finally {
    automationProcessing = false;
  }
}

async function runRenewalProcessor() {
  if (renewalProcessing) return;
  renewalProcessing = true;
  try {
    await processSubscriptionRenewals();
  } catch (error) {
    console.error('Subscription renewal processor error:', error);
  } finally {
    renewalProcessing = false;
  }
}

// ─── Server startup ──────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Webhook retry processor — every 60 seconds
const webhookInterval = setInterval(runWebhookProcessor, 60 * 1000);

// Automation retry processor — every 60 seconds
const automationInterval = setInterval(runAutomationProcessor, 60 * 1000);

// Subscription renewal processor — every hour
const renewalInterval = setInterval(runRenewalProcessor, 60 * 60 * 1000);

// Run once on startup (after a short delay to let DB connections settle)
const startupTimeout = setTimeout(() => {
  runRenewalProcessor();
}, 10_000);

// ─── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  clearInterval(webhookInterval);
  clearInterval(automationInterval);
  clearInterval(renewalInterval);
  clearTimeout(startupTimeout);

  server.close(async () => {
    console.log('HTTP server closed.');
    await disconnectPrisma();
    console.log('Database connections closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
