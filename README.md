# FlowRaze

FlowRaze is a Multi-Tenant CRM and operations analytics platform for growing sales teams. It provides data-isolated workspaces for companies to manage leads, deals, campaigns, and team performance.

## Features

- **Lead Management** — Track leads through their full lifecycle with status, source, and assignment.
- **Deal Pipeline** — Visual Kanban board for moving deals through stages from prospect to close.
- **Campaign Tracking** — Monitor marketing campaigns and the leads they generate.
- **Activity Logging** — Log calls, notes, and follow-ups against leads with a full audit trail.
- **Dashboard & Analytics** — Real-time metrics for revenue, conversion rates, and pipeline health.
- **Team Performance** — Per-member reporting on leads assigned, deals won, and revenue closed.
- **Global Search** — Search across leads, deals, campaigns, and activities from anywhere.
- **Data Export** — Download filtered datasets as CSV or PDF reports.
- **API & Webhooks** — API key authentication and outbound webhook delivery for external integrations.
- **Settings & Security** — Email verification, password reset, billing management, and role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 14+ |
| Auth | JWT + API key |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
npm install

# Configure the backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your DATABASE_URL and JWT_SECRET

# Run database migrations and seed
cd apps/api
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
cd ../..

# Start development servers
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3000`.

### Default Logins (Development Seed)

**Superadmin (Platform)**
```
Email:    superadmin@flowraze.com
Password: admin123
```

**Admin (Company)**
```
Email:    admin@flowraze.com
Password: admin123
```

**Employee (Staff)**
```
Email:    staff@flowraze.com
Password: admin123
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend and backend in dev mode |
| `npm run build` | Build all apps for production |
| `npm run typecheck` | TypeScript check across all workspaces |
| `npm run lint` | ESLint across all workspaces |
| `npm test` | Run tests across all workspaces |

## Documentation

| Document | Description |
|----------|-------------|
| [docs/api.md](docs/api.md) | Full API endpoint reference |
| [docs/deployment.md](docs/deployment.md) | VPS deployment guide |
| [docs/manual.md](docs/manual.md) | User manual (Employee, Manager, Admin, Superadmin) |

## License

Copyright © 2026 FlowRaze. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, in whole or in part, is strictly prohibited without prior written permission from the copyright holder.
