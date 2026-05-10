# Implementation Plan Status: Multi-Tenant SaaS Role Rework

**Last updated:** 2026-05-10

**Scope:** Role system, company tenancy, pricing/package promises, platform admin, billing foundation, white-label prep

**Current status:** Mostly implemented, hardening needed before production multi-tenant use

This document is now the source-of-truth status check for the multi-tenant rework. It compares the original plan with the current codebase and separates shipped work from remaining gaps.

---

## 1. Target Outcomes

| Outcome | Current status | Notes |
| --- | --- | --- |
| Company-owned data isolation | Mostly done | Shared backend scope helpers now cover CRM reads, detail/update/delete paths, search, dashboard metrics, team performance, and exports. Route tests still need to lock this down. |
| Four-role model | Done | `superadmin`, `admin`, `manager`, and `employee` are in Prisma, API validation, frontend types, and seeded users. |
| Superadmin platform control | Mostly done | `/api/admin/*` and `/admin/*` pages cover companies, users, billing, payments, and superadmin invites. |
| Admin company control | Mostly done | Company users, settings, billing, API keys, webhooks, CRM data, teams, and targets are exposed. |
| Manager team control | Mostly done | Managers can manage assigned teams and see team-scoped operational data. Route tests remain the next hardening step. |
| Employee self-service | Mostly done | Employees can use company app routes and operational reads are owner-scoped. Route tests remain the next hardening step. |
| White-label readiness | Planned | `Company.slug` exists; `Tenant`, custom domains, and tenant branding APIs are not implemented. |

---

## 2. Original Role Contract

| Action | Superadmin | Admin | Manager | Employee |
| --- | :---: | :---: | :---: | :---: |
| Manage companies | Yes | No | No | No |
| Manage platform users/admins | Yes | No | No | No |
| Platform billing overview | Yes | No | No | No |
| Company billing | Platform override | Yes | No | No |
| Manage company users | No | Yes | No | No |
| Manage API keys and webhooks | No | Yes | No | No |
| Company targets | No | Yes | No | No |
| Team targets and members | No | Yes | Own team | No |
| Create campaigns | No | Yes | Yes | No |
| Create leads/deals | No | Yes | Yes | Yes |
| View operational data | Platform metadata only | Company | Team | Own |

The code already supports much of the role surface, but the final row is the key remaining hardening item: operational reads and exports must consistently enforce company, team, and owner scope.

---

## 3. Done

### Database And Seed Data

- `Company` model exists with `slug`, `isActive`, billing, users, CRM records, teams, targets, API keys, and webhooks.
- `Role` enum is now `superadmin | admin | manager | employee`.
- `companyId` exists on tenant-scoped models: users, leads, deals, campaigns, activities, teams, targets, billing, API keys, and webhooks.
- Unique constraints were moved to company scope for leads, campaigns, teams, and billing accounts.
- Migrations backfill a default company, make tenant records non-null where required, and replace the legacy `staff` enum.
- Seed data creates multiple demo companies with admin, manager, employee, billing, API key, webhook, campaign, lead, deal, activity, team, and target data.

### Auth And Middleware

- JWT login, registration, and invite acceptance include `companyId`.
- `authenticate()` validates JWT/API key users against the database and attaches `userId`, `userRole`, and `companyId`.
- Role helpers exist for `requireSuperadmin`, `requireAdmin`, `requireManager`, `requireAdminOrManager`, `requireCompanyMember`, and `companyDataScope`.
- Public registration sends users to company onboarding; onboarding creates a company, billing account, and first admin.

### Superadmin Platform Routes

Implemented under `/api/admin`:

- `GET /overview`
- `GET /companies`
- `GET /companies/:id`
- `GET /companies/:id/users`
- `POST /companies`
- `PUT /companies/:id`
- `DELETE /companies/:id`
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `POST /users/:id/resend-invite`
- `POST /users/:id/reset-password-token`
- `DELETE /users/:id`
- `GET /billing`
- `GET /billing/:companyId`
- `PUT /billing/:companyId`
- `POST /billing/:companyId/check-payment`
- `POST /billing/:companyId/mark-paid`
- `POST /users/invite-superadmin`

### Company App Routes

- `/api/users` supports self profile, company-scoped admin user management, invites, and resend invite.
- `/api/leads`, `/api/deals`, `/api/campaigns`, `/api/activities`, `/api/dashboard`, `/api/search`, `/api/billing`, `/api/api-keys`, `/api/webhooks`, and `/api/targets` use company-aware data on many primary paths.
- `/api/targets` includes sales team CRUD, team membership CRUD, target CRUD, and dashboard achievement reporting.
- Shared data-scope helpers enforce company, manager team, and employee owner visibility for core CRM reads, detail/update/delete paths, search, exports, team performance, and dashboard metrics.
- Campaign write routes are restricted to admins and managers, and campaign owner/sales-owner assignments must stay inside the authenticated company.
- Route-level isolation regression tests cover critical manager team visibility, employee owner visibility, exports, lead detail denial, team performance, and campaign write permissions.
- Company user create and invite flows enforce active user counts against the workspace billing seat allowance.
- A centralized plan entitlement module gates API keys, API-key authentication, webhooks, exports, campaigns, targets, and team performance according to the current pricing tiers.
- Billing accounts now store trial/subscription lifecycle dates, new workspaces receive 14-day trial windows, paid marking sets subscription dates, and expired trials are canceled during entitlement checks.
- Webhook deliveries persist, sign payloads, retry with backoff, and support manual replay.
- SMTP-backed verification, invite, and password reset email delivery exists with a development logging fallback.

### Frontend

- `UserRole`, `Company`, billing, team, and target types are updated.
- Auth state stores `companyId` and has role helpers.
- Route guards exist for superadmin, admin, admin-or-manager, and company members.
- Public marketing routes, login, register, onboarding, and invite acceptance are wired.
- Superadmin pages exist for dashboard, companies, company detail, platform billing, and users.
- Company app routes live under `/company/*`, with legacy redirects from `/dashboard`, `/leads`, `/deals`, and related paths.
- Admin-only company routes protect `/company/users` and `/company/settings`.
- Targets page includes create/edit/delete target flows plus sales team create/edit/delete and membership management.

---

## 4. Missing Or Incomplete

| Priority | Gap | Evidence | Needed work |
| --- | --- | --- | --- |
| Medium | Expanded route isolation test matrix | Critical route-level isolation tests now exist for manager, employee, export, team-performance, and campaign permission paths. | Broaden the route matrix across admin, billing, API keys, webhooks, targets, and additional dashboard edge cases. |
| Medium | Webhook event coverage | Current event enum covers `lead_created`, `deal_created`, `deal_won`, and `activity_created`; update/delete events are not emitted. | Decide event contract and add update/delete events where useful. |
| Medium | Payment provider integration | Billing supports local account state, invoices, and manual payment checks; no checkout/customer portal/provider webhook sync exists. | Choose a provider, map provider IDs to `BillingAccount`, and sync subscription/invoice status. |
| Low | Rich PDF reporting | Export PDF is dependency-free and intentionally basic. | Adopt a richer PDF renderer only when branded, charted, or multi-page reports are required. |
| Low | White-label tenant layer | `Company.slug` exists only as prep. | Add `Tenant`, domain/subdomain resolver, branding API, SSL/domain handling, and tenant admin flows after MVP hardening. |
| Low | Future auth architecture | JWT auth is working. | Revisit betterauth only after tenancy and session requirements settle. |

---

## 5. Pricing Page Feature Audit

The public pricing page is the current packaging promise. This table maps `apps/web/src/pages/marketing/pricing.tsx` against the implemented product surface.

| Pricing promise | Plans shown | Implementation status | Evidence / gap | Priority |
| --- | --- | --- | --- | --- |
| Up to 3 users on Starter | Starter | Partial | `BillingAccount.seats` defaults to 3, but user create/invite flows do not enforce seat limits. | P0 |
| Unlimited users on paid plans | Growth+ | Partial | Plans store seats, but there is no entitlement engine that maps plan to allowed seats/features. | P0 |
| Lead and contact management | All | Mostly done | Leads include contact fields and CRUD/import; there is no separate contact entity. | P2 |
| Basic deal pipeline / full sales pipeline | All/Growth | Done for fixed stages | Deal CRUD, Kanban, stage movement, and won revenue exist. | Done |
| One board / custom stages / multi-pipeline | Starter/Growth/Performance+ | Missing | `DealStage` is a fixed enum and there is no pipeline/stage model. | P2 |
| Mobile apps | All | Missing | No iOS, Android, React Native, PWA install flow, or mobile app project exists. | P4 |
| Revenue dashboard | Starter+ | Done, with caveat | Dashboard supports revenue, conversion, leads, campaign overview, and range filters. Forecasting is not implemented. | P2 |
| Forecasting: linear / predictive ML / custom models | Growth+ | Missing | No forecast model, endpoint, or UI exists beyond historical charts. | P3 |
| Team performance tracking | Growth+ | Partial | Team performance page/API exists, but tenant/role scoping still needs hardening. | P0 |
| Campaign attribution: single-touch / multi-touch / custom | Growth+ | Partial to missing | Campaign-to-lead/deal linkage and campaign overview exist; no attribution model, touch table, ROAS, CAC, or multi-touch logic. | P2 |
| Conversion funnel tracking | Growth+ | Partial | Deal stage counts exist; no dedicated funnel analytics, conversion steps, or cohort breakdown. | P2 |
| Advanced analytics and cohorts | Performance+ | Missing | No cohort model, endpoint, or UI exists. | P3 |
| WhatsApp + email integrations | Growth+ | Missing for CRM | SMTP is used for auth/invite/reset only; no Gmail/WhatsApp inbox, sync, messaging, or provider integration exists. | P3 |
| Workflow automation / manual triggers / workflow engine | Growth+ | Missing | Webhooks exist, but no automation rule model, trigger/action builder, or job engine exists. | P2 |
| API access | Performance+ | Mostly done | API key CRUD and `X-API-Key` auth exist. Plan-based API access is not enforced. | P1 |
| Webhooks limited/unlimited | Growth+ | Mostly done | Webhook CRUD, delivery signing, retry, and replay exist. Plan-based limits are not enforced. | P1 |
| Custom roles and permissions | Performance+ | Missing | Roles are fixed enum values: `superadmin`, `admin`, `manager`, `employee`. | P3 |
| SSO and SAML | Performance+ | Missing | Auth is email/password JWT with invite/reset/verification flows only. | P3 |
| Billing plan changes from dashboard | FAQ | Partial | Admin/superadmin can edit billing state manually; no checkout/customer portal/provider lifecycle exists. | P1 |
| Payment methods: cards, virtual accounts, wallets, bank transfer | FAQ | Missing except manual records | Billing stores invoices/payments and manual checks; no provider integration exists. | P1 |
| 14-day Performance trial | Trial/FAQ | Partial | `BillingStatus.trialing` exists; no trial start/end, expiry enforcement, or automatic paid-plan entitlement exists. | P1 |
| SOC 2, UU PDP, data residency, SLA/security audit | FAQ/Enterprise | Missing as product controls | No compliance evidence, audit workflow, residency configuration, or SLA enforcement exists in code. | P4 |
| Dedicated onboarding/success/support tiers | Performance/Enterprise | Operational only | No in-app support/chat, onboarding workflow, SLA tracking, or success-manager assignment exists. | P4 |
| Custom integrations and white-label/client portal | Enterprise and landing pages | Missing | `Company.slug` exists only as prep; no `Tenant`, custom domain, branding API, or client portal exists. | P4 |

Priority legend:

- **P0:** Must fix before charging for company/role-based SaaS because it affects data isolation or plan-limit correctness.
- **P1:** Billing and entitlement truth; needed before paid self-service checkout.
- **P2:** Core Growth/Performance product depth; strong near-term roadmap after P0/P1.
- **P3:** Advanced Performance/Enterprise differentiation.
- **P4:** Marketing/compliance/enterprise operations; keep out of near-term build unless sales requires it.

---

## 6. Phase Status

| Phase | Original scope | Status | Notes |
| --- | --- | --- | --- |
| 1 | Database schema migration | Done | Completed by multi-tenant and not-null migrations. |
| 2 | JWT and auth middleware update | Done | JWT/API key auth now attaches role and company context. |
| 3 | User routes rework | Done | Company admin scoping and billing seat enforcement exist. Superadmin support remains in `/api/users` plus richer `/api/admin/users`. |
| 4 | Superadmin admin routes | Done | More complete than the original plan, including payment and superadmin invite helpers. |
| 5 | Company data routes rework | Mostly done | Shared data-scope helpers and critical route-level isolation tests now harden company, manager team, and employee owner visibility. Broader edge-case tests can continue incrementally. |
| 6 | Frontend rework | Mostly done | Admin and company route families exist; target/team management UI is implemented. Remaining work is mostly permission polish and tests. |
| 7 | White-label preparation | Planned | Do not implement until tenancy hardening is complete. |
| 8 | Pricing entitlement alignment | Planned | Map public pricing features to plan gates, limits, and honest in-app behavior. |
| 9 | Advanced paid-plan features | Planned | Automation, attribution, cohorts, integrations, SSO, and white-label should follow entitlement foundations. |

---

## 7. Recommended Next Work Order

1. **P2: Pricing truth cleanup.** Either implement or soften public claims for custom stages, multi-pipeline, forecasting, attribution, conversion funnel, and unlimited plan wording.
2. **P2: Growth analytics depth.** Add funnel analytics, single-touch campaign attribution, forecast basics, and stronger revenue/campaign reporting.
3. **P2: Workflow foundations.** Convert current webhooks into a broader automation base with rule triggers, actions, retry history, and manual trigger UI.
4. **P3: Performance differentiators.** Add multi-touch attribution, ROAS/CAC, cohorts, custom roles/permissions, and SSO/SAML if they remain in paid packaging.
5. **P4: Enterprise and white-label.** Add `Tenant`, custom domains, branding API, client portals, data residency options, SLA/support workflows, and compliance artifacts only after P0-P2 are stable.
6. **P4: Mobile strategy.** Decide whether "mobile apps" means responsive web/PWA first or native iOS/Android, then update pricing copy or create the mobile project.

---

## 8. Production Readiness Checklist

- [x] Company schema foundation
- [x] Role enum migration
- [x] JWT/API key company context
- [x] Superadmin platform API
- [x] Superadmin platform UI
- [x] Company onboarding
- [x] Company targets and sales team management UI
- [x] Every tenant query includes company scope
- [x] Manager reads are team-scoped
- [x] Employee reads are owner-scoped
- [x] Exports are tenant/role-scoped
- [x] Route-level tenancy regression tests exist
- [x] Seat limits are enforced
- [x] Plan entitlements are centralized and enforced
- [x] Existing paid-feature gates match pricing claims
- [x] Trial start/end and expiry behavior exists
- [ ] Provider billing is integrated
- [ ] Pricing copy matches implemented product capabilities
- [ ] White-label tenant routing is designed and implemented
