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
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── pages/        # Route pages
│   │   │   ├── lib/          # Utilities & API client
│   │   │   └── hooks/        # Custom React hooks
│   │   └── ...
│   └── api/              # Express backend
│       ├── src/
│       │   ├── routes/       # API routes
│       │   ├── middleware/    # Auth & error handling
│       │   └── prisma/        # Database client
│       └── ...
├── prisma/               # Database schema & seed
└── shared/               # Shared TypeScript types
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
- `npm run test` - Run tests

### Backend (apps/api)
- `npm run dev` - Start dev server
- `npm run build` - Compile TypeScript
- `npm run start` - Production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:seed` - Seed database

## API Endpoints

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

## License

Private - All rights reserved
