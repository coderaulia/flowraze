# AGENTS.md - FlowRaze Development Guide

This document provides guidelines and instructions for AI agents working on the FlowRaze codebase.

---

## 1. Project Architecture

```
flowraze/
+-- apps/
|   +-- web/              # React + Vite + TypeScript frontend
|   |   +-- src/
|   |   |   +-- components/   # Reusable UI components (shadcn/ui style)
|   |   |   +-- pages/        # Route pages
|   |   |   +-- lib/          # Utilities, API client, helpers
|   |   |   +-- hooks/        # Custom React hooks
|   |   |   +-- types/        # Frontend-specific types
|   |   |   +-- App.tsx       # Router setup
|   |   |   +-- main.tsx      # React entry point
|   |   |   +-- index.css     # Global Tailwind/design tokens
|   |   +-- package.json
|   +-- api/              # Node.js + Express + TypeScript backend
|       +-- src/
|       |   +-- routes/       # Express route definitions
|       |   +-- middleware/   # Auth and error handling
|       |   +-- prisma/       # Prisma client singleton
|       |   +-- index.ts      # Express app entry point
|       +-- package.json
+-- shared/               # Shared TypeScript workspace packages
|   +-- types/
+-- prisma/               # Database schema, migrations, and seed data
|   +-- schema.prisma
|   +-- seed.ts
|   +-- migrations/
+-- package.json          # Root npm workspace
+-- package-lock.json
```

### Tech Stack
- **Frontend:** React 18+, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components, Recharts
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Auth:** Email/password with bcryptjs + JWT (MVP); betterauth planned for later
- **Package Manager:** npm ONLY

---

## 2. Build, Lint, and Test Commands

### Root Commands
```bash
npm install              # Install all dependencies
npm run build            # Build all apps
npm run dev              # Dev mode (all apps)
npm run lint             # ESLint all packages
npm run lint:fix         # Auto-fix lint
npm run typecheck        # TypeScript check all
```

### Frontend (apps/web)
```bash
cd apps/web
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview build
npm run lint             # ESLint
npm run lint:fix         # Fix lint
npm run typecheck        # TSC check
# No test script exists yet for apps/web
```

### Backend (apps/api)
```bash
cd apps/api
npm run dev              # Express dev (localhost:3000)
npm run build            # Compile TS to dist/
npm run start            # Production server
npm run lint             # ESLint
npm run lint:fix         # Fix lint
npm run typecheck        # TSC check
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npx prisma studio        # DB GUI
```

---

## 3. Code Style Guidelines

### TypeScript
- `strict: true` in tsconfig.json
- Never use `any`; use `unknown` + type narrowing
- Use path aliases (`@/` for `src/`)

### Import Order
1. Node.js built-ins (`node:fs`)
2. External packages (`express`, `react`)
3. Internal aliases (`@/lib/api`, `@shared/types`)
4. Relative imports (`../utils`)
5. Type imports last

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Lead, User } from '@shared/types';
import { Card } from './Card';
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `lead-service.ts`, `user-profile.tsx` |
| Components | PascalCase | `LeadTable.tsx`, `DashboardCard.tsx` |
| Hooks | camelCase + `use` prefix | `useAuth.ts`, `useLeads.ts` |
| Functions | camelCase | `getLeads()`, `createDeal()` |
| Variables | camelCase | `leadCount`, `isLoading` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `LeadProps`, `UserResponse` |
| API routes | kebab-case | `/leads`, `/deals`, `/campaigns` |

### Error Handling
```typescript
// Backend: Custom error class
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// In routes: use try/catch + next(error)
app.get('/leads', async (req, res, next) => {
  try {
    const leads = await leadService.getAll();
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
});

// Frontend: Result type pattern
async function fetchLeads() {
  try {
    const { data } = await api.get('/leads');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### API Response Format
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code?: string }

// Paginated
{ success: true, data: T[], pagination: { page, limit, total } }
```

---

## 4. Design System (from DESIGN.md)

The UI follows the "Kinetic Architect" design system:

### Colors (Dark Theme)
- **Background:** `surface` (#0b1326), `surface-container` (#171f33)
- **Primary:** `#bcc3ff` text, `#1e2a78` container
- **Secondary/Growth:** `#4ae176` (positive metrics)
- **Text:** min `on_surface_variant` (#c6c5d3) for body

### Key Rules
- **NO 1px borders** for sectioning - use background color shifts
- **Sidebar** separated via background shift, not border
- **Cards** use tonal elevation (color hierarchy), not drop shadows
- **Glassmorphism** for modals: `backdrop-blur` + 60% opacity
- **Generous whitespace** - more than seems necessary
- **No pure black/white** - stick to the tonal palette

---

## 5. Feature Tiers (for reference)

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | Rp 0 | 3 users, leads, basic deals, simple dashboard |
| Growth | Rp 149k/user/mo | Campaigns, revenue dashboard, team performance |
| Pro | Rp 299k/user/mo | Advanced reports, automation, API access |
| Custom | Custom | Full integrations, dedicated support |

---

## 6. Environment Variables

### apps/web/.env
```env
VITE_API_URL=http://localhost:3000
```

### apps/api/.env
```env
DATABASE_URL="postgresql://user:password@localhost:5432/flowraze"
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

---

## 7. Feature Status

### Completed
- [x] Project scaffolding & workspace setup
- [x] Database schema (Prisma) & seed data
- [x] JWT authentication (login/register)
- [x] CRUD APIs (leads, deals, campaigns, activities)
- [x] Core design system implementation
- [x] Frontend route scaffolding
- [x] Dashboard API uses persisted deal revenue data
- [x] Auth storage key cleanup on 401 uses `flowraze-auth`
- [x] Production hardening for JWT secret and CORS origin handling
- [x] API list endpoints support opt-in `page`/`limit` pagination metadata
- [x] Update endpoints reject empty payloads and only mutate provided fields
- [x] README script docs match the current frontend package
- [x] Header search is wired to lead search via `/leads?search=...`
- [x] Frontend table views expose API-backed pagination controls
- [x] API write routes use shared validation helpers for strings, numbers, enums, and dates
- [x] Dashboard UI supports range controls, chart empty states, and persisted revenue trends
- [x] Frontend forms show inline validation and API error feedback before writes

### In Progress
- [ ] Layout mobile responsiveness

### Placeholder/Todo
- [ ] Deals Kanban Board
- [ ] Activity Feed UI
- [ ] Team Performance real integration
- [ ] Settings Page (Profile/Security)
- [ ] Global Search functionality
- [ ] Pagination for all tables
- [ ] CSV/PDF Export

---

## 8. Technical Debt & Next Fixes

| Priority | Issue | Location |
|----------|-------|----------|
| MEDIUM | No frontend test runner/script exists yet | `apps/web/package.json` |
| MEDIUM | Search is lead-only; cross-entity search still needs a dedicated API/UI flow | `apps/web/src/components/layout/index.tsx` |

---

## 9. Git Conventions

### Commits
```
feat: add lead creation form
fix: resolve deal stage update bug
refactor: simplify API response handling
docs: update README
chore: add seed data
```

### Branches
```
feature/lead-management
feature/deal-pipeline
bugfix/auth-logout-issue
```

---

## 10. Important Notes

1. **NEVER** commit secrets/API keys
2. **DO** use `.env` files (gitignored)
3. **DO** run `typecheck` before committing
4. **DO NOT** add dependencies without discussion
5. **DO NOT** over-engineer; prefer simple, maintainable code
6. Match existing code style when adding features
