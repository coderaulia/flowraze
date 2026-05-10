# Implementation Plan: Multi-Tenant SaaS Role Rework

**Date:** 2026-05-09  
**Scope:** Role system, multi-tenancy (Company isolation), white-label prep  
**Status:** In Progress (Phase 3)

---

## 1. Goals

| Goal | Description |
|------|-------------|
| Multi-tenant isolation | Each Company owns its data (leads, deals, campaigns, targets, teams) |
| Role clarity | 4 clear roles with distinct permission scopes |
| Superadmin platform control | Manages companies, admins, and platform billing |
| Admin company control | Manages own company users, data, billing subscription |
| Manager team control | Manages team members, team targets, views team leads/deals |
| Employee self-service | Own leads, own deals, own targets, own achievements |
| White-label ready | Schema and routing ready for per-tenant branding/domain |

---

## 2. New Role System

### Role Enum Change

```
Current:  superadmin | admin | staff
Target:   superadmin | admin | manager | employee
```

`staff` → renamed `employee`. `manager` added as new distinct role.

### Permission Matrix

| Action | Superadmin | Admin | Manager | Employee |
|--------|:---:|:---:|:---:|:---:|
| **Platform** | | | | |
| Manage Companies (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Manage platform Admins | ✅ | ❌ | ❌ | ❌ |
| View all Companies | ✅ | ❌ | ❌ | ❌ |
| Platform billing (Stripe plans/subs) | ✅ | ❌ | ❌ | ❌ |
| **Company** | | | | |
| Company billing (own subscription) | ✅ | ✅ | ❌ | ❌ |
| Invite/manage company users | ❌ | ✅ | ❌ | ❌ |
| Invite/manage company admins | ❌ | ✅ | ❌ | ❌ |
| Manage API keys & webhooks | ❌ | ✅ | ❌ | ❌ |
| Company-level targets (set/edit) | ❌ | ✅ | ❌ | ❌ |
| View all company leads/deals | ❌ | ✅ | ❌ | ❌ |
| **Team** | | | | |
| Create/manage teams | ❌ | ✅ | ✅ (own team) | ❌ |
| Set team targets | ❌ | ✅ | ✅ (own team) | ❌ |
| View team leads/deals | ❌ | ✅ | ✅ (own team) | ❌ |
| Add team members | ❌ | ✅ | ✅ (own team) | ❌ |
| Create campaigns/projects | ❌ | ✅ | ✅ | ❌ |
| **Individual** | | | | |
| Create leads | ❌ | ✅ | ✅ | ✅ |
| View/edit own leads | ❌ | ✅ | ✅ | ✅ |
| Create deals (own leads) | ❌ | ✅ | ✅ | ✅ |
| View own targets/achievements | ❌ | ✅ | ✅ | ✅ |
| View own dashboard | ❌ | ✅ | ✅ | ✅ |

---

## 3. Schema Rework

### 3.1 New `Company` Model

```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique   // used for subdomain in white-label
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  billing          BillingAccount?
  users            User[]
  leads            Lead[]
  deals            Deal[]
  campaigns        Campaign[]
  salesTeams       SalesTeam[]
  salesTargets     SalesTarget[]
  apiKeys          ApiKey[]
  webhookEndpoints WebhookEndpoint[]
}
```

### 3.2 Updated `User` Model

Add `companyId` (nullable — superadmin has no company):

```prisma
model User {
  // existing fields...
  companyId  String?   // null for superadmin
  role       Role      @default(employee)

  company    Company?  @relation(fields: [companyId], references: [id])
  // ...existing relations
}
```

### 3.3 Updated `Role` Enum

```prisma
enum Role {
  superadmin
  admin
  manager
  employee
}
```

### 3.4 Add `companyId` to All Tenant-Scoped Models

| Model | Add Field | Unique Constraint Change |
|-------|-----------|--------------------------|
| `Lead` | `companyId String` | `[ownerId, email]` → `[companyId, email]` |
| `Deal` | `companyId String` | no change |
| `Campaign` | `companyId String` | `[name, channel, startDate]` → `[companyId, name, channel, startDate]` |
| `Activity` | `companyId String` | no change (leadId scopes it) |
| `SalesTeam` | `companyId String` | add `@@unique([companyId, name])` |
| `SalesTarget` | `companyId String` | no change |
| `ApiKey` | `companyId String` | no change |
| `WebhookEndpoint` | `companyId String` | no change |

### 3.5 Updated `BillingAccount` Model

Link to Company (1-to-1):

```prisma
model BillingAccount {
  // existing fields...
  companyId String  @unique

  company   Company @relation(fields: [companyId], references: [id])
}
```

### 3.6 White-Label Prep: `Tenant` Model (Phase 7, do not implement yet)

```prisma
// Future — white-label only
model Tenant {
  id           String   @id @default(cuid())
  domain       String?  @unique  // custom domain: crm.clientbrand.com
  subdomain    String   @unique  // clientbrand.flowraze.com
  logoUrl      String?
  primaryColor String?
  companyId    String   @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  company      Company  @relation(fields: [companyId], references: [id])
}
```

---

## 4. JWT Token Changes

Current payload: `{ userId, role }`  
New payload: `{ userId, role, companyId }` (companyId = null for superadmin)

All API routes extract `companyId` from token for automatic data scoping. No route should accept a `companyId` from the request body/query for security — it always comes from the verified JWT.

---

## 5. API Authorization Rework

### 5.1 New Middleware Helpers

```typescript
// New helpers needed in apps/api/src/middleware/auth.ts

requireSuperadmin()          // role === 'superadmin'
requireAdmin()               // role === 'admin'
requireManager()             // role === 'manager'
requireAdminOrManager()      // role in ['admin', 'manager']
requireCompanyMember()       // any authenticated user with companyId (admin|manager|employee)
requireSameCompany()         // entity.companyId === req.companyId

// Scope injector — applied globally to all company routes
injectCompanyScope()         // adds WHERE companyId = req.companyId to all queries
```

### 5.2 Route Scoping Rules

**Superadmin routes** (`/api/admin/*`):
- `GET /admin/companies` — list all companies
- `POST /admin/companies` — create company (onboard new customer)
- `PUT /admin/companies/:id` — update company
- `DELETE /admin/companies/:id` — deactivate company
- `GET /admin/users` — all users across companies
- `GET /admin/billing` — platform billing overview
- `PUT /admin/billing/:companyId` — override company plan

**Admin routes** (scoped to own company via JWT):
- `GET /users` — company users only
- `POST /users` / `POST /users/invite` — invite to own company only
- `PUT /users/:id` — manage own company users (not superadmin)
- `DELETE /users/:id` — own company only
- `GET /leads` — all company leads
- `POST /targets` — set company/team/individual targets
- `GET /settings` — company settings (API keys, webhooks, billing)

**Manager routes** (scoped to own company + own team):
- `GET /leads` — own team members' leads
- `POST /leads` — create lead
- `GET /deals` — own team members' deals
- `GET /targets` — own team targets + member individual targets
- `POST /targets` — set team/individual targets (team scope only)
- `GET /teams` — own managed teams
- `PUT /teams/:id` — manage own team (members only)

**Employee routes** (scoped to own records):
- `GET /leads` — own leads only
- `POST /leads` — create lead
- `GET /deals` — own deals only
- `GET /targets` — own targets only
- `GET /dashboard` — own achievements only

### 5.3 Data Filter Middleware

Apply at router level so no route forgets scoping:

```typescript
// Applied to all non-superadmin routes
function companyDataScope(req, res, next) {
  if (!req.companyId) return res.status(403).json({ error: 'No company context' });
  req.dataScope = { companyId: req.companyId };
  next();
}

// For employee/manager — further restrict to own data or team data
function ownerDataScope(req, res, next) {
  if (req.userRole === 'employee') {
    req.dataScope.ownerId = req.userId;
  } else if (req.userRole === 'manager') {
    // resolve team member IDs from DB, add to scope
    req.dataScope.teamMemberIds = [...]; // resolved async
  }
  next();
}
```

---

## 6. Implementation Phases

### Phase 1: Database Schema Migration [COMPLETED]
**Files:** `prisma/schema.prisma`, new migration

Steps:
1. Add `Company` model
2. Add `companyId` to `User`, `Lead`, `Deal`, `Campaign`, `Activity`, `SalesTeam`, `SalesTarget`, `ApiKey`, `WebhookEndpoint`
3. Link `BillingAccount` to `Company` (1-to-1)
4. Change `Role` enum: rename `staff` → `employee`, add `manager`
5. Update unique constraints (Lead: `[companyId, email]`, Campaign: `[companyId, name, channel, startDate]`)
6. Write migration: create default Company, assign existing users/data, migrate `staff` → `employee`

**Migration script logic:**
```sql
-- 1. Create default company for existing data
INSERT INTO "Company" (id, name, slug, "createdAt", "updatedAt")
VALUES ('default-company-id', 'Default Company', 'default', NOW(), NOW());

-- 2. Assign all existing non-superadmin users to default company
UPDATE "User" SET "companyId" = 'default-company-id' WHERE role != 'superadmin';

-- 3. Assign all data to default company
UPDATE "Lead" SET "companyId" = 'default-company-id';
-- (repeat for Deal, Campaign, etc.)

-- 4. Rename staff → employee in Role enum (Postgres: alter type)
ALTER TYPE "Role" ADD VALUE 'employee';
UPDATE "User" SET role = 'employee' WHERE role = 'staff';
ALTER TYPE "Role" ADD VALUE 'manager';
-- Note: Postgres can't drop enum values; handle via new enum + column migration
```

### Phase 2: JWT & Auth Middleware Update [COMPLETED]
**Files:** `apps/api/src/routes/auth.ts`, `apps/api/src/middleware/auth.ts`

Steps:
1. Add `companyId` to JWT payload (login + accept-invite)
2. Update `authenticate()` to extract and attach `req.companyId`
3. Add new middleware helpers (`requireAdmin`, `requireManager`, `requireCompanyMember`, etc.)
4. Add `companyDataScope` middleware function
5. Update `buildAuthUser()` to return companyId

### Phase 3: User Routes Rework
**Files:** `apps/api/src/routes/users.ts`

Steps:
1. Scope all queries to `req.companyId`
2. Admin can only manage users within own company
3. Admin can invite as `admin`, `manager`, or `employee` (not `superadmin`)
4. Remove superadmin guard logic from admin routes (superadmin uses separate `/admin/*` routes)
5. Manager/employee can only `GET /me` and `PUT /me`
6. Validate `companyId` seat limits on invite (from BillingAccount)

### Phase 4: Superadmin Admin Routes (new)
**Files:** `apps/api/src/routes/admin.ts` (new file)

Steps:
1. `GET /admin/companies` — list + search companies
2. `POST /admin/companies` — onboard new company (create Company + BillingAccount + first admin user)
3. `PUT /admin/companies/:id` — update company name/slug/status
4. `DELETE /admin/companies/:id` — soft-delete (set `isActive = false`)
5. `GET /admin/users` — cross-company user list
6. `GET /admin/billing` — platform billing summary
7. `PUT /admin/billing/:companyId` — override plan tier

### Phase 5: Company Data Routes Rework
**Files:** `apps/api/src/routes/leads.ts`, `deals.ts`, `campaigns.ts`, `targets.ts`, `teams.ts`

For each route file:
1. Apply `companyDataScope` middleware at router level
2. Apply `ownerDataScope` for employee-restricted endpoints
3. Manager gets team-scoped access (resolve team member IDs)
4. Admin gets full company-scoped access

**Lead-specific:**
- Remove `@@unique([ownerId, email])` — same lead email can be owned by different employees
- Add `@@unique([companyId, email])` — no duplicate leads per company

**Campaign-specific:**
- Admin and manager can create campaigns
- Employee has read-only access to campaigns (to assign leads)

**Target-specific:**
- Admin sets `scope: company` targets
- Admin or manager sets `scope: team` targets (manager: own team only)
- Admin or manager sets `scope: individual` targets (manager: own team members only)
- Employee sees own individual targets only

### Phase 6: Frontend Rework
**Files:** `apps/web/src/App.tsx`, `apps/web/src/types/index.ts`, all pages

#### 6.1 Type Updates
```typescript
// types/index.ts
type UserRole = 'superadmin' | 'admin' | 'manager' | 'employee';

interface User {
  // existing fields
  companyId: string | null;  // null for superadmin
  role: UserRole;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  billing?: BillingAccount;
  createdAt: string;
  updatedAt: string;
}
```

#### 6.2 Auth Context
Add `companyId` and expanded role to auth context. Gate UI elements by role.

#### 6.3 Route Guards
```typescript
// New route guard components
<SuperadminRoute />    // superadmin only
<AdminRoute />         // admin only  
<ManagerRoute />       // manager only
<ManagerOrAdminRoute /> // manager | admin
<CompanyMemberRoute /> // any company member
```

#### 6.4 New Pages

| Page | Path | Role Access |
|------|------|-------------|
| Superadmin Dashboard | `/admin` | superadmin |
| Company Management | `/admin/companies` | superadmin |
| Company Detail | `/admin/companies/:id` | superadmin |
| Platform Billing | `/admin/billing` | superadmin |
| All Users (cross-company) | `/admin/users` | superadmin |
| Company Settings | `/settings` | admin |
| Team Management | `/teams` | admin, manager |
| My Team | `/my-team` | manager |

#### 6.5 Existing Page Visibility Changes

| Page | Was visible to | Now visible to |
|------|----------------|----------------|
| `/users` | superadmin, admin | admin only (own company) |
| `/leads` | all | admin (all company), manager (team), employee (own) |
| `/deals` | all | admin (all company), manager (team), employee (own) |
| `/campaigns` | all | admin, manager (read/write), employee (read-only) |
| `/targets` | all | all (scoped by role) |
| `/settings` | all | admin only |
| `/dashboard` | all | all (scoped by role) |

#### 6.6 Superadmin-Specific UI
- `/admin` — platform dashboard (total companies, MRR, active seats, plan distribution)
- `/admin/companies` — company list with plan/status badges, seat usage
- `/admin/companies/:id` — company detail: users, billing, activity summary
- No access to individual company's leads/deals/campaigns (operational data)

---

## 7. White-Label Preparation (Phase 7 — Post-MVP)

Do **not** implement now. Schema placeholder documented in section 3.6.

### What to prepare now (Phase 1-6):
- `Company.slug` field already supports subdomain routing (`slug.flowraze.com`)
- All data isolation is company-scoped (foundation is set)
- No hardcoded `flowraze` branding in API responses

### What Phase 7 adds:
1. `Tenant` model (see section 3.6)
2. Subdomain-based tenant resolution middleware
3. Custom domain SSL (via Caddy/nginx wildcard + Let's Encrypt)
4. Per-tenant branding tokens (logo, colors, fonts) surfaced via `/api/tenant/brand`
5. White-label admin portal (separate login flow at custom domain)
6. Tenant onboarding wizard (superadmin maps Company → Tenant)

---

## 8. Migration Strategy for Existing Data

**Risk:** Low — currently pre-production / single-tenant

### Step-by-step migration:

1. **Create schema migration** (`prisma/migrations/20260509_multi_tenant/`)
   - Add Company table
   - Add companyId columns (nullable first)
   - Add manager to Role enum

2. **Data migration script** (`prisma/seed-migration.ts`)
   - Create "Default Company" with slug `default`
   - Assign all existing users (non-superadmin) to Default Company
   - Assign all leads/deals/campaigns/etc to Default Company
   - Rename `staff` → `employee` (requires new enum column approach in Postgres)
   - Create BillingAccount for Default Company (copy existing BillingAccount data)

3. **Make companyId NOT NULL** (second migration after data fill)
   - Add `@default` constraint or remove nullable
   - Superadmin stays null (handled by schema optional relation)

4. **Deploy API with backward compat flag**
   - JWT without companyId still valid for 1 deploy cycle
   - Force re-login after deploy to get new JWT with companyId

### Rollback plan:
- Keep migration numbered (can revert with `prisma migrate reset` in dev)
- Tag git commit before migration for production rollback point

---

## 9. File Change Summary

### New files
- `apps/api/src/routes/admin.ts` — superadmin platform routes
- `apps/api/src/routes/companies.ts` — if needed separate from admin
- `apps/web/src/pages/admin/index.tsx` — superadmin dashboard
- `apps/web/src/pages/admin/companies.tsx` — company list
- `apps/web/src/pages/admin/companies/[id].tsx` — company detail
- `apps/web/src/pages/admin/billing.tsx` — platform billing
- `apps/web/src/components/guards/` — role-based route guard components
- `prisma/migrations/20260509_multi_tenant/migration.sql`
- `prisma/seed-migration.ts`

### Modified files
- `prisma/schema.prisma` — Company model, Role enum, all companyId FKs
- `apps/api/src/routes/auth.ts` — JWT companyId, register → assign company
- `apps/api/src/middleware/auth.ts` — companyId extraction, new role helpers
- `apps/api/src/routes/users.ts` — company-scoped, role hierarchy rework
- `apps/api/src/routes/leads.ts` — companyId scope, role-based filters
- `apps/api/src/routes/deals.ts` — companyId scope, role-based filters
- `apps/api/src/routes/campaigns.ts` — companyId scope, role access
- `apps/api/src/routes/targets.ts` — companyId scope, manager/admin split
- `apps/api/src/routes/teams.ts` — companyId scope, manager own-team guard
- `apps/web/src/types/index.ts` — UserRole, Company, updated User
- `apps/web/src/App.tsx` — route guards, superadmin routes
- `apps/web/src/pages/users.tsx` — admin-only, company-scoped
- `apps/web/src/pages/leads.tsx` — role-filtered view
- `apps/web/src/pages/targets.tsx` — role-filtered view
- `apps/web/src/pages/settings.tsx` — admin-only sections

---

## 10. Build Order (Recommended)

Build in this order to avoid merge conflicts and have testable checkpoints:

```
1. prisma/schema.prisma         (schema + enum changes)
2. prisma/migrations/...        (migration SQL)
3. prisma/seed-migration.ts     (data backfill)
4. middleware/auth.ts           (JWT + new helpers)
5. routes/auth.ts               (login/register companyId)
6. routes/admin.ts              (superadmin CRUD — new file)
7. routes/users.ts              (company-scoped rework)
8. routes/leads.ts              (role-scoped)
9. routes/deals.ts              (role-scoped)
10. routes/campaigns.ts         (role-scoped)
11. routes/targets.ts           (role-scoped)
12. routes/teams.ts             (role-scoped)
13. types/index.ts              (frontend types)
14. App.tsx                     (route guards)
15. pages/admin/*               (superadmin UI — new pages)
16. pages/users.tsx             (admin-only rework)
17. pages/leads.tsx             (role-filtered)
18. pages/targets.tsx           (role-filtered)
19. pages/settings.tsx          (admin-only sections)
```

---

## 11. Open Questions / Decisions Needed

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Rename `staff` → `employee` or keep `staff` and add `manager`? | A) rename all, B) keep staff, add manager | **A** — clean cut, no legacy confusion |
| 2 | Self-service company registration (signup flow)? | A) superadmin-only onboarding, B) public signup creates company | **B for SaaS** — public signup page creates Company + first admin |
| 3 | Can admin create other admins (same company)? | A) yes, B) only superadmin can promote to admin | **A** — admin manages own company fully |
| 4 | Manager: can they see all company leads or only team leads? | A) team-only, B) all company | **A** — team-scoped, admin sees all |
| 5 | Employee: can they see other employees' leads? | A) no (own only), B) read-only company leads | **A** — own only, manager is bridge |
| 6 | BillingAccount per Company or global singleton? | A) per Company (current singleton repurposed), B) global admin-managed | **A** — per Company for SaaS |
| 7 | Public company signup endpoint? | A) `POST /auth/register` creates Company+User, B) separate `POST /companies/register` | **B** — cleaner separation |
