# FlowRaze

FlowRaze is a multi-tenant CRM and operations analytics platform for growing sales teams. It provides company workspaces for managing leads, deals, campaigns, targets, billing, and team performance.

## Features

- **Lead Management** — Track leads through their full lifecycle with status, source, and assignment.
- **Deal Pipeline** — Visual Kanban board for moving deals through stages from prospect to close.
- **Campaign Tracking** — Monitor marketing campaigns and the leads they generate.
- **Activity Logging** — Log calls, notes, and follow-ups against leads with a full audit trail.
- **Dashboard & Analytics** — Real-time metrics for revenue, conversion rates, and pipeline health.
- **Team Performance** — Per-member reporting on leads assigned, deals won, and revenue closed.
- **Sales Targets** — Company, team, and individual target tracking with achievement dashboards.
- **Platform Admin** — Superadmin tools for companies, users, billing, invoices, and manual payment checks.
- **Global Search** — Search across leads, deals, campaigns, and activities from anywhere.
- **Data Export** — Download filtered datasets as CSV or PDF reports.
- **API & Webhooks** — API key authentication and outbound webhook delivery for external integrations.
- **Settings & Security** — Email verification, password reset, invites, billing management, and role-based access control.

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
npm run db:setup

# Start development servers
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3000`.

### Default Logins (Development Seed)

All seeded demo users use `admin123`.

| Scope | Email | Company |
|-------|-------|---------|
| Superadmin | `superadmin@flowraze.com` | Platform |
| Admin | `admin@flowraze.com` | FlowRaze Demo Agency |
| Manager | `sarah@flowraze.com` | FlowRaze Demo Agency |
| Employee | `michael@flowraze.com` | FlowRaze Demo Agency |
| Admin | `admin@nusantara-retail.demo` | Nusantara Retail Group |
| Admin | `admin@byteworks-cloud.demo` | ByteWorks Cloud |

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
| [docs/implementation-plan.md](docs/implementation-plan.md) | Multi-tenant implementation status and remaining hardening checklist |
| [docs/manual.md](docs/manual.md) | User manual (Employee, Manager, Admin, Superadmin) |
| [docs/missing-features.md](docs/missing-features.md) | Current missing features and roadmap gaps |

## Current Caveats

The multi-company foundation is implemented, but production multi-tenant rollout still needs route-level hardening for several detail/export/reporting paths and manager/employee read scopes. Track that work in [docs/missing-features.md](docs/missing-features.md).

## License

Copyright © 2026 FlowRaze. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, in whole or in part, is strictly prohibited without prior written permission from the copyright holder.
