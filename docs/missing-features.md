# FlowRaze Missing Features And Roadmap

Last updated: 2026-05-10

This document tracks real gaps in the current codebase. Completed items are summarized first so new work does not repeat shipped features.

## Current Product Coverage

- **Authentication and account recovery:** Login/register, JWT sessions, email verification, password reset, invite acceptance, SMTP-backed email delivery through `nodemailer`, and a development logging fallback are implemented.
- **Multi-company foundation:** Companies, company-scoped users, billing accounts, CRM records, teams, targets, API keys, and webhooks are modeled in Prisma and seeded for demo use.
- **Role model:** `superadmin`, `admin`, `manager`, and `employee` roles are available in the database, API validation, frontend auth store, and route guards.
- **Platform admin:** Superadmins can manage companies, platform users, company users, billing state, invoices/payments, password reset tokens, and superadmin invites from `/admin/*`.
- **Company CRM:** Leads, deals, campaigns, activities, dashboard analytics, team performance, global search, settings, and company users have API and UI coverage.
- **Tenant and role isolation:** Shared backend scope helpers enforce `companyId`, manager team, and employee owner visibility across core CRM reads, detail/update/delete paths, global search, dashboards, team performance, and exports.
- **Campaign permissions:** Campaign writes are limited to admins and managers, with owner and sales-owner assignments validated inside the company.
- **Lead import:** Leads can be imported from CSV/XLSX-derived rows, with lowercased email duplicate checks inside the company scope.
- **Deal pipeline:** Deals support CRUD, stage movement, closed-won timestamps, Kanban totals, edit/delete actions, and automatic project campaign creation when a deal is created.
- **Sales targets and teams:** `/api/targets`, `/api/targets/teams`, `/api/dashboard/targets`, and the `/company/targets` page support target CRUD, sales team CRUD, member assignment, achievement KPIs, category mix, monthly breakdowns, and leaderboards.
- **Exports:** Leads, deals, campaigns, activities, and team performance export to CSV and lightweight PDF.
- **Webhooks:** Lead/deal/activity events create signed deliveries, retry failed deliveries with backoff, and support manual replay from Settings.
- **Billing state:** Workspace name, plan, status, seats, renewal date, invoices, manual payment checks, and paid payment marking are persisted.
- **Quality tooling:** Root/workspace build, lint, typecheck, and test scripts exist. Current automated coverage is utility-focused.

## Missing Or Incomplete Functionality

| Priority | Feature gap | Current state | Needed functionality |
| --- | --- | --- | --- |
| HIGH | Route-level regression coverage | Tests currently cover request utilities, security helpers, import parsing, and frontend form/import validation. Main API routes and critical UI flows are not covered. | Add backend route tests for auth, users, admin, leads, deals, campaigns, exports, webhooks, billing, targets, and team performance; add frontend smoke tests for login, CRUD forms, exports, Settings, and Targets. |
| MEDIUM | Billing seat enforcement | Billing accounts store `seats`, but company user create/invite flows do not block writes above the seat allowance. | Enforce active-user counts against billing seats before company user creation/invitation, with clear errors and admin UI messaging. |
| MEDIUM | Payment provider integration | Billing supports local state, invoices, and manual payment checks only. There is no provider checkout, invoice sync, subscription webhook, or customer portal handoff. | Integrate the chosen provider, map provider customer/subscription IDs to `BillingAccount`, and sync plan/status from provider webhooks. |
| MEDIUM | Webhook event coverage | Current event enum is `lead_created`, `deal_created`, `deal_won`, and `activity_created`. Lead/deal update/delete events are not emitted. | Decide the canonical event set, add update/delete events where useful, and expose them in the Settings webhook event picker. |
| LOW | Rich PDF reporting | PDF export is intentionally dependency-free and basic. | Adopt a richer PDF renderer only when branded layouts, multi-page tables, charts, or report templates are required. |
| LOW | White-label tenant layer | `Company.slug` exists, but `Tenant`, custom domain routing, tenant branding, and subdomain resolution are not implemented. | Add the white-label layer after production tenancy isolation is proven. |
| LOW | betterauth decision | JWT auth works for the MVP. | Revisit after workspace tenancy, session policy, and production auth requirements are finalized. |

## Recently Resolved Documentation Drift

- Sales target management UI and sales team management UI are implemented on `/company/targets`; they are no longer missing features.
- Email delivery provider support is implemented through SMTP plus development fallback.
- Webhook retry/replay is implemented.
- API docs now use the implemented `team-performance` export entity and include target/admin/onboarding endpoints.
