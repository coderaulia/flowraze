import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/admin.js';
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
import onboardingRoutes from './routes/onboarding.js';
import analyticsRoutes from './routes/analytics.js';
import checkoutRoutes from './routes/checkout.js';
import subscriptionRoutes from './routes/subscription.js';
import automationsRoutes from './routes/automations.js';
import supportRoutes from './routes/support.js';
import pipelinesRoutes from './routes/pipelines.js';
import notificationsRoutes from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
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

  app.use('/api/admin', adminRoutes);
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
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/automations', automationsRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/pipelines', pipelinesRoutes);
  app.use('/api/notifications', notificationsRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  return app;
}
