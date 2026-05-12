import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { processPendingWebhooks } from './utils/webhooks.js';
import { processSubscriptionRenewals } from './utils/subscription.js';
import { processPendingAutomationRuns } from './utils/automation.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Webhook retry processor — every 60 seconds
  setInterval(() => {
    processPendingWebhooks().catch((error) => {
      console.error('Webhook retry processor error:', error);
    });
  }, 60 * 1000);

  // Automation retry processor — every 60 seconds
  setInterval(() => {
    processPendingAutomationRuns().catch((error) => {
      console.error('Automation retry processor error:', error);
    });
  }, 60 * 1000);

  // Subscription renewal processor — every hour
  setInterval(() => {
    processSubscriptionRenewals().catch((error) => {
      console.error('Subscription renewal processor error:', error);
    });
  }, 60 * 60 * 1000);

  // Run once on startup (after a short delay to let DB connections settle)
  setTimeout(() => {
    processSubscriptionRenewals().catch((error) => {
      console.error('Subscription renewal startup check error:', error);
    });
  }, 10_000);
});
