import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import dealsRoutes from './routes/deals.js';
import campaignsRoutes from './routes/campaigns.js';
import activitiesRoutes from './routes/activities.js';
import dashboardRoutes from './routes/dashboard.js';
import teamRoutes from './routes/team.js';
import usersRoutes from './routes/users.js';
import searchRoutes from './routes/search.js';
import apiKeysRoutes from './routes/api-keys.js';
import billingRoutes from './routes/billing.js';
import exportsRoutes from './routes/exports.js';
import webhooksRoutes from './routes/webhooks.js';
import targetsRoutes from './routes/targets.js';
import { errorHandler } from './middleware/errorHandler.js';
import { processPendingWebhooks } from './utils/webhooks.js';


if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/targets', targetsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Start webhook retry processor
  setInterval(() => {
    processPendingWebhooks().catch(err => {
      console.error('Webhook retry processor error:', err);
    });
  }, 60 * 1000); // Check every minute
});
