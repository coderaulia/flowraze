import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { processPendingWebhooks } from './utils/webhooks.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  setInterval(() => {
    processPendingWebhooks().catch((error) => {
      console.error('Webhook retry processor error:', error);
    });
  }, 60 * 1000);
});
