import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import dealsRoutes from './routes/deals.js';
import campaignsRoutes from './routes/campaigns.js';
import activitiesRoutes from './routes/activities.js';
import dashboardRoutes from './routes/dashboard.js';
import teamRoutes from './routes/team.js';
import usersRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
