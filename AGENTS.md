# AGENTS.md - FlowRaze Development Guide

This document provides guidelines and instructions for AI agents working on the FlowRaze codebase.

---

## 1. Project Architecture

```
flowraze/
├── apps/
│   ├── web/              # React + Vite + TypeScript frontend
│   │   └── src/
│   │       ├── components/   # Reusable UI components (shadcn/ui style)
│   │       │   ├── ui/           # Primitives (button, card, dialog, input, etc.)
│   │       │   ├── guards/       # Route guards (SuperadminRoute, AdminRoute, etc.)
│   │       │   ├── landing/      # Marketing page components
│   │       │   └── layout/       # App shell (sidebar, header, mobile nav)
│   │       ├── pages/        # Route pages
│   │       │   ├── admin/        # Superadmin platform pages
│   │       │   ├── auth/         # Login, register
│   │       │   ├── company/      # CRM app pages (dashboard, leads, deals, etc.)
│   │       │   └── marketing/    # Public pages (landing, pricing, about, etc.)
│   │       ├── lib/          # Utilities, API client, form validation, routes
│   │       ├── hooks/        # Custom React hooks (useAuthStore)
│   │       ├── types/        # Frontend-specific types
│   │       ├── App.tsx       # Router setup
│   │       ├── main.tsx      # React entry point
│   │       └── index.css     # Global Tailwind/design tokens
│   │   └── package.json
│   └── api/              # Node.js + Express + TypeScript backend
│       └── src/
│           ├── routes/       # Express route definitions (24 route files)
│           ├── middleware/   # Auth and error handling
│           ├── prisma/       # Prisma client singleton
│           ├── utils/        # Shared helpers (data-scope, email, export, etc.)
│           └── index.ts      # Express app entry point
│       └── package.json
├── shared/               # Shared TypeScript workspace packages
│   └── types/            # Shared type definitions (User, Lead, Deal, etc.)
├── prisma/               # Database schema, migrations, and seed data
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docs/                 # Project documentation
│   ├── api.md            # Full API endpoint reference
│   ├── code-audit.md     # Security audit queue
│   ├── deployment.md     # VPS deployment guide
│   ├── implementation-plan.md  # Multi-tenant implementation status
│   ├── manual.md         # User manual
│   └── missing-features.md    # Roadmap gaps
├── package.json          # Root npm workspace
└── package-lock.json
```

### Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components (Radix UI primitives), Recharts, Zustand, Axios, Lucide icons, date-fns
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, nodemailer, express-rate-limit, slugify
- **Auth:** Email/password with bcryptjs + JWT; API key authentication for programmatic access
- **Payments:** Midtrans Snap checkout with webhook verification
- **Package Manager:** npm ONLY (workspaces)

### Database Models (22 models)
`Company`, `User`, `Lead`, `Deal`, `Pipeline`, `PipelineStage`, `Campaign`, `Activity`, `ApiKey`, `WebhookEndpoint`, `WebhookDelivery`, `AutomationRule`, `AutomationRun`, `SupportTicket`, `BillingAccount`, `BillingInvoice`, `BillingPayment`, `SalesTeam`, `SalesTeamMember`, `SalesTarget`, `Notification`, `AuditLog`

### API Routes (24 endpoints)
`/api/admin`, `/api/auth`, `/api/leads`, `/api/deals`, `/api/campaigns`, `/api/activities`, `/api/dashboard`, `/api/team`, `/api/users`, `/api/search`, `/api/api-keys`, `/api/billing`, `/api/exports`, `/api/webhooks`, `/api/targets`, `/api/onboarding`, `/api/analytics`, `/api/checkout`, `/api/subscription`, `/api/automations`, `/api/support`, `/api/pipelines`, `/api/notifications`, `/api/health`

---

## 2. Build, Lint, and Test Commands

### Root Commands
```bash
npm install              # Install all dependencies
npm run build            # Build all apps
npm run dev              # Dev mode (all apps)
npm run lint             # ESLint all packages
npm run lint:fix         # Auto-fix lint
npm test                 # Run API/web/shared tests
npm run typecheck        # TypeScript check all
npm run db:setup         # Generate + migrate + seed
```

### Frontend (apps/web)
```bash
cd apps/web
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build (tsc + vite build)
npm run preview          # Preview build
npm run lint             # ESLint
npm run lint:fix         # Fix lint
npm test                 # Node test runner via tsx
npm run typecheck        # TSC check
```

### Backend (apps/api)
```bash
cd apps/api
npm run dev              # Express dev via tsx watch (localhost:3000)
npm run build            # Compile TS to dist/
npm run start            # Production server (node dist/index.js)
npm run lint             # ESLint
npm run lint:fix         # Fix lint
npm test                 # Node test runner via tsx
npm run typecheck        # TSC check
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:deploy    # Run migrations (production)
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
// Backend: Custom error class (from middleware/errorHandler.ts)
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
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const leads = await prisma.lead.findMany({ where: { companyId } });
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
});

// Frontend: Result type pattern via lib/api.ts
async function fetchLeads() {
  const response = await get<{ leads: Lead[] }>('/leads');
  if (response.success) {
    return response.data;
  }
  // error handling
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

### Colors (Dark Theme — CSS custom properties in index.css)
- **Background:** `--surface` (#0b1326), `--surface-container` (#171f33), `--surface-container-high` (#222a3d), `--surface-container-lowest` (#060e20)
- **Primary:** `--primary` (#bcc3ff) text, `--primary-container` (#1e2a78) container
- **Secondary/Growth:** `--secondary` (#4ae176) for positive metrics
- **Tertiary:** `--tertiary` (#ffb595) for neutral metrics
- **Text:** min `--on-surface-variant` (#c6c5d3) for body
- **Error:** `--error` (#ffb4ab)
- **Outline:** `--outline-variant` (#454651) at 15% opacity only

### Key Rules
- **NO 1px borders** for sectioning — use background color shifts
- **Sidebar** separated via background shift, not border
- **Cards** use tonal elevation (color hierarchy), not drop shadows
- **Glassmorphism** for modals/floating elements: `.glass` class (`backdrop-blur: 20px` + 60% opacity)
- **Generous whitespace** — more than seems necessary
- **No pure black/white** — stick to the tonal palette
- **Typography:** Inter as primary font, Instrument Serif for editorial accents
- **Input fields:** Background `surface-container-lowest`, no borders, 2px bottom-accent on focus
- **No divider lines** between list items — use whitespace or alternating backgrounds

---

## 5. Multi-Tenant Architecture

### Role Model
| Role | Scope | Access |
|------|-------|--------|
| `superadmin` | Platform | Manage all companies, users, billing; no CRM data access |
| `admin` | Company | Full company control: users, settings, billing, CRM, pipelines, automations |
| `manager` | Team | Own team data, campaign writes, team-scoped operational reads |
| `employee` | Self | Own leads/deals/activities, company-wide read access where permitted |

### Data Isolation
- All tenant-scoped queries use `companyId` from the authenticated user
- Shared `data-scope.ts` helpers: `requireCompanyId()`, `companyDataScope()`, team/owner visibility
- Route guards: `requireSuperadmin`, `requireAdmin`, `requireManager`, `requireAdminOrManager`, `requireCompanyMember`
- Frontend guards: `SuperadminRoute`, `AdminRoute`, `CompanyMemberRoute`, `FeatureRoute`

### Plan Entitlements (Flat-Rate Pricing)
| Tier | Price | Seats | Key Features |
|------|-------|-------|--------------|
| Starter | Rp 300k/mo | 5 | Leads, 1 deal pipeline, CSV/PDF exports, basic dashboard |
| Growth | Rp 800k/mo | Unlimited | 14-day trial, 3 pipelines, campaigns, targets, team performance, analytics, 3 webhooks |
| Custom (Enterprise) | Custom | Unlimited | Unlimited pipelines, API access, workflow automation, unlimited webhooks, dedicated support |

Entitlements are centralized in `apps/api/src/utils/entitlements.ts` and enforced at the route and UI level.

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
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@flowraze.com
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
```

---

## 7. Feature Status

### Completed
- [x] Project scaffolding & npm workspace setup
- [x] Database schema (Prisma) with 22 models & seed data (multi-company)
- [x] JWT authentication (login/register) with email verification and password reset
- [x] Consent tracking in registration flow with comprehensive ToS and privacy policy
- [x] API key authentication for programmatic access
- [x] Multi-company schema with `Company`, `companyId`, role enum, and tenant isolation
- [x] Company onboarding creates workspace, billing account, and first admin
- [x] Vertical-specific onboarding: Industry selection (Agency Services, Property, Insurance/Financial Sales, Other)
- [x] Industry-matched pipeline presets & dynamic `Company.dealLabel` ('Project', 'Property', 'Policy', 'Deal') auto-configuration
- [x] WhatsApp click-to-chat integration (`wa.me`) with Indonesian mobile phone normalization (`lib/whatsapp.ts`)
- [x] Four-role model: superadmin, admin, manager, employee
- [x] Shared data-scope helpers for company/team/owner visibility
- [x] CRUD APIs: leads, deals, campaigns, activities, pipelines, targets, automations, support
- [x] Multi-pipeline and custom deal stages with plan-based limits
- [x] Deals Kanban board with stage totals, drag updates, edit, and delete
- [x] Dashboard with revenue, conversion, leads, campaign overview, range filters
- [x] Growth analytics: funnel analytics, single-touch attribution, linear forecast, lead velocity
- [x] Sales Targets: company, team, and individual achievement with leaderboard
- [x] Team performance tracking with tenant/role scoping, with sidebar nav gated by `teamPerformance` entitlement
- [x] Campaign management with admin/manager role restriction and tenant-aware owner checks
- [x] Workflow automation: tenant-scoped rules, manual runs, retry history, assignment, notification, webhook actions
- [x] In-app support tickets: bug reports, SLA due dates, admin triage, assignment, resolution
- [x] In-app notifications (CRUD, mark read, mark all read)
- [x] Global search across leads, deals, campaigns, and activities
- [x] CSV/PDF export with combined filters for all core CRM views
- [x] API list endpoints with opt-in `page`/`limit` pagination
- [x] Frontend table views with API-backed pagination controls
- [x] API write routes with shared validation helpers (strings, numbers, enums, dates)
- [x] Frontend forms with inline validation and API error feedback
- [x] Webhook CRUD, delivery signing, retry with backoff, and manual replay
- [x] Superadmin platform: companies, users, billing, payments, superadmin invites
- [x] Settings: profile, security, billing, API key, and webhook controls
- [x] Billing seat limits enforced for user creation and invites
- [x] Centralized plan entitlements gating API keys, webhooks, exports, campaigns, targets, team performance
- [x] Billing lifecycle: trial start/end, subscription dates, expired-trial enforcement
- [x] Midtrans Snap checkout, payment webhooks, and payment processing
- [x] Subscription lifecycle: renewal cron, cancellation, downgrade, reactivation, self-service portal
- [x] SMTP-backed email delivery (verification, invite, password reset) with dev fallback
- [x] Route-level isolation regression tests for critical permission paths
- [x] Comprehensive test suite: auth routes, leads CRUD, data-scope, entitlements, pagination (backend); auth store, routes, form validation, WhatsApp helper (frontend) — 80+ tests total
- [x] Layout shell with mobile navigation and responsive table scrolling
- [x] Core design system implementation (Kinetic Architect)
- [x] Marketing pages: landing, solutions, pricing, about, privacy, terms, blog, careers, help, resources
- [x] Legacy route redirects from `/dashboard`, `/leads`, etc. to `/company/*`
- [x] Production hardening: JWT secret validation, CORS origin handling, rate limiting
- [x] Security hardening: helmet headers, provider timeouts, audit logging, sanitized error logging
- [x] Superadmin seat-limit enforcement for platform-created company users
- [x] Sales-team manager validation on create/update
- [x] Shared email/URL validators in request utilities
- [x] Support ticket pagination with standard metadata
- [x] Race condition fixes: transactional writes for deals, leads, checkout, admin user creation, onboarding
- [x] Graceful shutdown with Prisma disconnect and interval cleanup
- [x] Cron job concurrency guards (webhook, automation, renewal processors)
- [x] N+1 query elimination: batched lead imports, dashboard leaderboard, team performance
- [x] Unbounded query limits on all list/detail endpoints (activities, deals, leads, campaigns, analytics)
- [x] Database indexes for all hot query paths (22 new indexes across 12 models)
- [x] Atomic retryCount increments for webhook and automation retry processors
- [x] Subscription renewal batch processing with updateMany

### Placeholder/Todo
- [ ] WhatsApp conversation capture gateway: Inbound webhooks, provider account credentials (Fonnte/Wablas or Cloud API), and message logging
- [ ] Workflow automation expansion: conditional branches, templates, deeper observability
- [ ] Live support chat, onboarding playbooks, and success-manager routing
- [ ] Broaden route-level isolation tests across admin, billing, target, and checkout edge cases
- [ ] Billing renewal retries and provider renewal reconciliation
- [ ] White-label tenant/domain/branding layer
- [ ] Multi-touch attribution and cohort analytics
- [ ] Custom roles and permissions (beyond fixed enum)
- [ ] SSO/SAML authentication
- [ ] Native mobile strategy (PWA or native apps)
- [ ] Future betterauth migration decision

---

## 8. Technical Debt & Next Fixes

| Priority | Issue | Location |
|----------|-------|----------|
| HIGH | WhatsApp conversation capture gateway integration (provider selection & message logging) | `apps/api/src/routes/`, `apps/web/src/` |
| HIGH | Billing renewal retries and provider renewal reconciliation | `apps/api/src/utils/subscription.ts`, `apps/api/src/utils/payment-provider.ts`, `apps/api/src/routes/checkout.ts` |
| MEDIUM | Route-level isolation tests should expand to admin, billing, target, and checkout edge cases | `apps/api/src/routes/*.test.ts` |
| MEDIUM | Expand audit logging coverage to API keys, webhooks, role changes, company deactivation | `apps/api/src/routes/admin.ts`, `apps/api/src/routes/api-keys.ts`, `apps/api/src/routes/webhooks.ts` |
| LOW | Advanced PDF templates/charts remain future polish | `apps/api/src/utils/export.ts` |
| LOW | Add `?connection_limit=10&pool_timeout=10` to production DATABASE_URL for connection pooling | `apps/api/.env` |

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
7. All tenant-scoped queries MUST include `companyId` — use `requireCompanyId(req)` from `data-scope.ts`
8. New routes must be registered in `apps/api/src/app.ts`
9. New pages must be added to `apps/web/src/App.tsx` with appropriate route guards
10. Refer to `docs/implementation-plan.md` for the authoritative status of the multi-tenant rework
