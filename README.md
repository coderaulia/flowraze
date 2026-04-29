# FlowRaze - CRM & Operations Analytics

A modern CRM + Operations Analytics web app for growing teams. Built with React, TypeScript, Express, and PostgreSQL.

## Features

- **Lead Management** - Track and manage your sales leads
- **Deal Pipeline** - Visual Kanban-style deal tracking
- **Campaign Tracking** - Monitor marketing campaign performance
- **Activity Logging** - Log calls, notes, and follow-ups
- **Dashboard** - Real-time sales metrics and analytics
- **Team Performance** - Track team member performance

## Tech Stack

- **Frontend**: React 18+, Vite, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT-based authentication

## Project Structure

```
flowraze/
+-- apps/
|   +-- web/              # React frontend
|   |   +-- src/
|   |   |   +-- components/   # UI components
|   |   |   +-- pages/        # Route pages
|   |   |   +-- lib/          # Utilities & API client
|   |   |   +-- hooks/        # Custom React hooks
|   +-- api/              # Express backend
|       +-- src/
|       |   +-- routes/       # API routes
|       |   +-- middleware/   # Auth & error handling
|       |   +-- prisma/       # Database client
+-- prisma/               # Database schema & seed
+-- shared/               # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd flowraze
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # apps/api/.env
   DATABASE_URL="postgresql://user:password@localhost:5432/flowraze"
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

4. Set up the database:
   ```bash
   cd apps/api
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

### Running Development

Start both frontend and backend:
```bash
npm run dev
```

Or separately:
```bash
# Frontend (http://localhost:5173)
cd apps/web && npm run dev

# Backend (http://localhost:3000)
cd apps/api && npm run dev
```

### Default Login

After seeding the database:
- **Email**: admin@flowraze.com
- **Password**: admin123

## Scripts

### Root
- `npm run dev` - Start all apps in dev mode
- `npm run build` - Build all apps
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript check

### Frontend (apps/web)
- `npm run dev` - Vite dev server
- `npm run build` - Production build
- No frontend test script exists yet

### Backend (apps/api)
- `npm run dev` - Start dev server
- `npm run build` - Compile TypeScript
- `npm run start` - Production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:seed` - Seed database

## API Endpoints

List endpoints support optional `page` and `limit` query params and return pagination metadata when those params are present.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |
| GET | /api/leads | List leads |
| POST | /api/leads | Create lead |
| PUT | /api/leads/:id | Update lead |
| DELETE | /api/leads/:id | Delete lead |
| GET | /api/deals | List deals |
| POST | /api/deals | Create deal |
| PUT | /api/deals/:id | Update deal |
| GET | /api/campaigns | List campaigns |
| POST | /api/campaigns | Create campaign |
| GET | /api/activities | List activities |
| POST | /api/activities | Create activity |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/team/performance | Team performance |

## Roadmap

- [ ] Full authentication implementation
- [ ] Email/password reset flow
- [ ] Advanced filtering and search
- [ ] Export functionality (CSV/PDF)
- [ ] Webhook integrations
- [ ] Mobile responsive improvements
- [ ] Multi-tenant billing system

## VPS Deployment Guide

This guide walks you through deploying FlowRaze on a Linux VPS (e.g., Ubuntu 22.04) using PM2 for the backend and Nginx for the frontend/reverse proxy.

### 1. VPS Prerequisites
Ensure your server has the following installed:
- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Nginx
- PM2 (`npm install -g pm2`)

### 2. Prepare the Database
Create a database and user in PostgreSQL:
```bash
sudo -u postgres psql
CREATE DATABASE flowraze;
CREATE USER flowraze_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE flowraze TO flowraze_user;
\q
```

### 3. Clone & Install
```bash
git clone <repository-url> /var/www/flowraze
cd /var/www/flowraze
npm install
```

### 4. Configure Environment Variables
Create the necessary `.env` files.

**Backend (`apps/api/.env`):**
```env
DATABASE_URL="postgresql://flowraze_user:your_secure_password@localhost:5432/flowraze"
JWT_SECRET="generate_a_secure_random_string"
PORT=3000
NODE_ENV=production
```

**Frontend (`apps/web/.env`):**
```env
# Point this to your actual domain name when accessed by users
VITE_API_URL=https://api.yourdomain.com
```

### 5. Build the Apps
```bash
# Build the frontend (outputs to apps/web/dist)
# Build the backend (outputs to apps/api/dist)
npm run build
```

### 6. Setup the Database Schema
```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate deploy
# (Optional) Seed the database if this is a fresh setup
npm run prisma:seed
```

### 7. Start the Backend with PM2
```bash
cd /var/www/flowraze/apps/api
pm2 start dist/index.js --name "flowraze-api"
pm2 save
pm2 startup
```

### 8. Configure Nginx
Create an Nginx server block to serve the frontend and proxy the API.

**`/etc/nginx/sites-available/flowraze`**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve the React frontend
    root /var/www/flowraze/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Proxy API requests to Node.js backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/flowraze /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

> **Note:** We strongly recommend using Let's Encrypt (Certbot) to secure your domains with HTTPS after this step.

## License

Private - All rights reserved
