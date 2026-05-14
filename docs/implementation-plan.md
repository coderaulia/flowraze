# Implementation Plan Status: Multi-Tenant SaaS Role Rework

**Last updated:** 2026-05-14

**Scope:** Role system, company tenancy, pricing/package promises, platform admin, billing foundation, white-label prep

**Current status:** Implemented; company data isolation, role-based access, plan entitlements, Midtrans checkout, subscription lifecycle, multi-pipeline customization, baseline analytics, and workflow automation are enforced. White-labeling, compliance/enterprise controls, and deeper advanced analytics remain future platform gaps.

This document is now the source-of-truth status check for the multi-tenant rework. It compares the original plan with the current codebase and separates shipped work from remaining gaps.

---

## 1. Target Outcomes

| Outcome | Current status | Notes |
| --- | --- | --- |
| Company-owned data isolation | Done | Shared backend scope helpers cover CRM reads, detail/update/delete paths, search, dashboard metrics, team performance, and exports. Route tests cover the critical paths and can continue expanding around edge cases. |
| Four-role model | Done | `superadmin`, `admin`, `manager`, and `employee` are in Prisma, API validation, frontend types, and seeded users. |
| Superadmin platform control | Done | `/api/admin/*` and `/admin/*` pages cover companies, users, billing, payments, and superadmin invites. Remaining hardening is audit logging and seat-limit semantics for platform-created company users. |
| Admin company control | Done | Company users, settings, billing, subscription self-service, API keys, webhooks, CRM data, pipelines, teams, targets, automations, and support are exposed. |
| Manager team control | Done | Managers can manage assigned teams and see team-scoped operational data. More edge-case tests can be added incrementally. |
| Employee self-service | Done | Employees can use company app routes and operational reads are owner-scoped. More edge-case tests can be added incrementally. |
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

The code now supports the role surface and consistently scopes operational reads and exports through company, team, and owner visibility helpers. Remaining hardening is focused on edge-case tests and audit/security controls rather than the core role contract.

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
- Pricing copy now describes shipped capabilities and labels unsupported areas such as native apps, predictive/custom forecasting, SSO, SOC2, and enterprise controls as roadmap/planning rather than current features.
- Webhook deliveries persist, sign payloads, retry with backoff, and support manual replay.
- SMTP-backed verification, invite, and password reset email delivery exists with a development logging fallback.
- Midtrans Snap checkout, payment webhooks, subscription cancellation/reactivation/downgrade flows, payment history, and renewal checks are implemented.
- Multi-pipeline and custom-stage support is implemented through `Pipeline` and `PipelineStage` models, `/api/pipelines`, and pipeline-aware deal/analytics surfaces.

### Frontend

- `UserRole`, `Company`, billing, team, and target types are updated.
- Auth state stores `companyId` and has role helpers.
- Route guards exist for superadmin, admin, admin-or-manager, and company members.
- Public marketing routes, login, register, onboarding, and invite acceptance are wired.
- Superadmin pages exist for dashboard, companies, company detail, platform billing, and users.
- Company app routes live under `/company/*`, with legacy redirects from `/dashboard`, `/leads`, `/deals`, and related paths.
- Admin-only company routes protect `/company/users` and `/company/settings`.
- Targets page includes create/edit/delete target flows plus sales team create/edit/delete and membership management.
- Automations page lets admins create trigger/action rules, run them manually, pause/resume rules, and inspect recent retry history. Current actions include activity creation, lead status updates, owner assignment, notifications, and webhook calls.
- Support page lets company members submit bug reports and help requests, while admins can triage, assign, and resolve tickets with SLA due dates.

---

## 4. Missing Or Incomplete

| Priority | Gap | Evidence | Needed work |
| --- | --- | --- | --- |
| Medium | Webhook event coverage | Current event enum covers `lead_created`, `deal_created`, `deal_won`, and `activity_created`; update/delete events are not emitted. | Decide event contract and add update/delete events where useful. |
| Medium | Billing renewal depth | Midtrans checkout/webhooks and subscription state transitions exist. Renewal checks mark past-due/canceled states, but there is no automated provider-side renewal charge or saved-payment retry flow. | Generate renewal invoices, initiate retry/payment-update flows, and reconcile provider renewal results. |
| Medium | Security and audit controls | Rate limiting, invite expiry checks, support assignee checks, campaign owner checks, and automation config validation exist. Audit logging, security headers, provider timeouts, and shared email/URL validators remain open. | Work through `docs/code-audit.md` in priority order. |
| Medium | Advanced analytics depth | Funnel, single-touch attribution, linear forecast, and lead velocity are implemented. | Add multi-touch attribution, cohort analytics, predictive forecasting, and custom forecast models only if they remain in paid packaging. |
| Low | White-label tenant layer | `Company.slug` exists only as prep. | Add `Tenant`, domain/subdomain resolver, branding API, SSL/domain handling, and tenant admin flows after MVP hardening. |
| Low | Future auth architecture | JWT auth is working. | Revisit betterauth only after tenancy and session requirements settle. |

---

## 5. Pricing Page Feature Audit

The public pricing page is the current packaging promise. This table maps `apps/web/src/pages/marketing/pricing.tsx` against the implemented product surface.

| Pricing promise | Plans shown | Implementation status | Evidence / gap | Priority |
| --- | --- | --- | --- | --- |
| Up to 3 users on Starter | Starter | Done | `BillingAccount.seats` defaults to 3; `ensureSeatAvailable()` in user create and invite flows enforces the limit against `getCompanyEntitlements()`. | Done |
| Unlimited users on paid plans | Growth+ | Done | `PLAN_ENTITLEMENTS` maps growth/pro/custom to `seats: null` (unlimited); entitlement engine resolves and enforces per-plan seat allowances. | Done |
| Lead and contact management | All | Done for lead-centric CRM | Leads include contact fields, CRUD, search, filters, owner scoping, and CSV/XLSX-derived import. There is no separate contact entity by design today. | Done |
| Basic deal pipeline / full sales pipeline | All/Growth | Done | Deal CRUD, Kanban, stage movement, pipeline stages, and won revenue exist. | Done |
| One board / custom stages / multi-pipeline | Starter/Growth/Performance+ | Done | `Pipeline` and `PipelineStage` support default and custom pipelines/stages with plan limits. | Done |
| Mobile apps | All | Missing | No iOS, Android, React Native, PWA install flow, or mobile app project exists. | P4 |
| Revenue dashboard | Starter+ | Done | Dashboard supports revenue, conversion, leads, campaign overview, range filters, and linear forecast. | Done |
| Forecasting: linear / predictive ML / custom models | Growth+ | Partial | Linear regression forecast exists (`/analytics/forecast` + UI panel); predictive ML and custom models are not implemented. | P3 |
| Team performance tracking | Growth+ | Done | Team performance page/API exists with tenant/role scoping enforced via data-scope helpers and plan entitlements. | Done |
| Campaign attribution: single-touch / multi-touch / custom | Growth+ | Partial | Single-touch attribution exists (`/analytics/attribution`) with ROAS, cost-per-lead, and conversion rate; multi-touch and custom models are not implemented. | P3 |
| Conversion funnel tracking | Growth+ | Done | Dedicated funnel analytics endpoint (`/analytics/funnel`) and UI panel with stage-to-stage conversion rates and drop-off. | Done |
| Advanced analytics and cohorts | Performance+ | Missing | No cohort model, endpoint, or UI exists. | P3 |
| WhatsApp + email integrations | Growth+ | Missing for CRM | SMTP is used for auth/invite/reset only; no Gmail/WhatsApp inbox, sync, messaging, or provider integration exists. | P3 |
| Workflow automation / manual triggers / workflow engine | Growth+ | Mostly done | `AutomationRule` and `AutomationRun` support tenant-scoped triggers, retryable job runs, manual admin runs, and actions for activities, lead status updates, owner assignment, notifications, and webhook calls. Remaining depth is more triggers, conditions, templates, and observability. | P2 |
| API access | Performance+ | Done | API key CRUD, `X-API-Key` auth, and plan-based gating exist. `authenticate()` checks `entitlements.features.apiKeys`; `assertApiKeyLimit()` enforces per-plan key count. | Done |
| Webhooks limited/unlimited | Growth+ | Done | Webhook CRUD, delivery signing, retry, replay, and plan-based limits exist. `assertWebhookLimit()` enforces per-plan webhook count (growth=3, pro=unlimited). | Done |
| Custom roles and permissions | Performance+ | Missing | Roles are fixed enum values: `superadmin`, `admin`, `manager`, `employee`. | P3 |
| SSO and SAML | Performance+ | Missing | Auth is email/password JWT with invite/reset/verification flows only. | P3 |
| Billing plan changes from dashboard | FAQ | Done | Admin can initiate Midtrans Snap checkout from settings; plan/status updates on payment success. Customer self-service portal with subscription management, cancellation, reactivation, downgrade, and payment history is implemented. | Done |
| Payment methods: cards, virtual accounts, wallets, bank transfer | FAQ | Done via Midtrans | Midtrans Snap supports credit cards, bank transfers, e-wallets, and virtual accounts. All methods available through the checkout dialog. | Done |
| 14-day Performance trial | Trial/FAQ | Done | Onboarding creates `trialStartedAt` + `trialEndsAt` (14 days); `getCompanyEntitlements()` auto-expires trials and cancels billing status. | Done |
| SOC 2, UU PDP, data residency, SLA/security audit | FAQ/Enterprise | Missing as product controls | No compliance evidence, audit workflow, residency configuration, or SLA enforcement exists in code. | P4 |
| Dedicated onboarding/success/support tiers | Performance/Enterprise | Partial | In-app support tickets exist with bug reports, request types, priorities, SLA due dates, admin triage, assignment, and resolution tracking. Live chat, onboarding playbooks, and dedicated success-manager routing remain future work. | P4 |
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
| 5 | Company data routes rework | Done | Shared data-scope helpers and critical route-level isolation tests now harden company, manager team, and employee owner visibility. Broader edge-case tests can continue incrementally. |
| 6 | Frontend rework | Done | Admin and company route families exist; target/team management, pipeline settings, analytics, automations, support, checkout, and subscription UI are implemented. Remaining work is mostly polish and tests. |
| 7 | White-label preparation | Planned | Do not implement until tenancy hardening is complete. |
| 8 | Pricing entitlement alignment | Done | Map public pricing features to plan gates, limits, and honest in-app behavior. |
| 9 | Advanced paid-plan features | In progress | Funnel analytics, single-touch attribution, linear forecast, lead velocity, multi-pipeline, and workflow automation actions are shipped. Remaining: multi-touch attribution, cohorts, custom roles, SSO, communication integrations, and enterprise controls. |

---

## 7. Recommended Next Work Order

1. **Security hardening:** Work through `docs/code-audit.md`, starting with seat-limit semantics for superadmin-created company users, sales-team manager validation, audit logs, provider timeouts, and security headers.
2. **Billing renewal depth:** Add automated renewal invoices, payment retry/payment-method update flows, and reconciliation for provider renewal outcomes.
3. **Advanced paid-plan differentiation:** Add multi-touch attribution, cohort analytics, custom roles/permissions, and SSO/SAML only if they remain in paid packaging.
4. **Enterprise and white-label:** Add `Tenant`, custom domains, branding API, client portals, data residency options, SLA/support workflows, and compliance artifacts after the security/billing gaps are stable.
5. **Mobile strategy:** Decide whether "mobile apps" means responsive web/PWA first or native iOS/Android, then update pricing copy or create the mobile project.

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
- [x] Provider billing is integrated
- [x] Pricing copy matches implemented product capabilities
- [x] Multi-pipeline and custom stages are implemented
- [x] Baseline analytics are implemented
- [x] Workflow automation supports assignment, notification, and webhook actions
- [ ] Security audit queue is closed
- [ ] Billing renewal retries and provider renewal reconciliation are implemented
- [ ] White-label tenant routing is designed and implemented
