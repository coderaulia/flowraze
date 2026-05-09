# FlowRaze Deployment Guide

This guide covers deploying FlowRaze on a Linux VPS (Ubuntu 22.04) using PM2 for the backend and Nginx as the reverse proxy and frontend host.

## Prerequisites

Install the following on your server:

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Nginx
- PM2 — `npm install -g pm2`

## 1. Database Setup

```bash
sudo -u postgres psql
CREATE DATABASE flowraze;
CREATE USER flowraze_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE flowraze TO flowraze_user;
\q
```

## 2. Clone & Install

```bash
git clone <repository-url> /var/www/flowraze
cd /var/www/flowraze
npm install
```

## 3. Environment Variables

**Backend — `apps/api/.env`:**

```env
DATABASE_URL="postgresql://flowraze_user:your_secure_password@localhost:5432/flowraze"
JWT_SECRET="generate_a_secure_random_string"
PORT=3000
NODE_ENV=production
```

**Frontend — `apps/web/.env`:**

```env
VITE_API_URL=https://api.yourdomain.com
```

## 4. Build

```bash
npm run build
```

Output: `apps/web/dist` (frontend), `apps/api/dist` (backend).

## 5. Database Migration

```bash
cd apps/api
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed   # optional, fresh installs only
```

## 6. Start the Backend

```bash
cd /var/www/flowraze/apps/api
pm2 start dist/index.js --name "flowraze-api"
pm2 save
pm2 startup
```

## 7. Configure Nginx

Create `/etc/nginx/sites-available/flowraze`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/flowraze/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

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

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/flowraze /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8. HTTPS (Recommended)

Use Certbot to issue Let's Encrypt certificates for both domains:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```
