# FlowRaze Missing Features And Roadmap

Last updated: 2026-05-14

This document tracks active product gaps only. Completed historical items belong in `docs/implementation-plan.md`, `docs/code-audit.md`, or commit history.

## Current Product Coverage

- **Authentication and account recovery:** Login/register, JWT sessions, email verification, invite acceptance, password reset, `/auth/me`, SMTP delivery, and development email fallback are implemented.
- **Multi-company SaaS foundation:** Companies, company users, billing accounts, CRM records, pipelines, teams, targets, API keys, webhooks, automations, notifications, and support tickets are tenant-scoped in Prisma.
- **Role model:** `superadmin`, `admin`, `manager`, and `employee` exist across Prisma, API validation, frontend auth state, and route guards.
- **Platform admin:** Superadmins manage companies, platform/company users, billing state, payment checks, reset tokens, and superadmin invites from `/admin/*`.
- **Company CRM:** Leads, CSV/XLSX-derived lead import, deals, pipelines, campaigns, activities, dashboard analytics, global search, settings, users, teams, targets, exports, automations, and support tickets have API and UI coverage.
- **Tenant and role isolation:** Shared data-scope helpers enforce company, manager-team, and employee-owner visibility across core CRM reads, detail/update/delete paths, dashboards, team performance, exports, and search.
- **Billing and subscriptions:** Plan entitlements, seat limits, trials, Midtrans Snap checkout, webhook payment processing, subscription cancellation/reactivation/downgrade flows, invoices, payment history, and renewal checks are implemented.
- **Analytics:** Funnel analytics, single-touch attribution, linear forecast, and lead velocity are implemented in `/api/analytics` and the company analytics UI.
- **Pipeline customization:** `Pipeline` and `PipelineStage` replaced the fixed deal-stage enum. Admins can manage company pipelines/stages, and deal Kanban/analytics are pipeline-aware.
- **Workflow automation:** Rules support manual and CRM-event triggers, retry history, and actions for activity creation, lead status updates, owner assignment, notifications, and webhook calls.
- **Support:** Company members can submit support/bug tickets, while admins can triage, assign, and resolve tickets with SLA due dates.
- **Exports:** Leads, deals, campaigns, activities, and team performance export to CSV and branded multi-page PDF.

## Active Missing Or Incomplete Functionality

| Priority | Feature gap | Current state | Needed functionality |
| --- | --- | --- | --- |
| MEDIUM | Webhook event coverage | Webhook events are still limited to `lead_created`, `deal_created`, `deal_won`, and `activity_created`. Automations have broader trigger coverage, but customer webhooks do not. | Define the external webhook event contract and add update/delete/stage-change events where useful. |
| MEDIUM | Billing renewal depth | Midtrans checkout/webhooks and subscription state transitions exist. Renewal checks mark past-due/canceled states, but there is no automated provider-side renewal charge or saved-payment retry flow. | Generate renewal invoices, initiate retry/payment-update flows, and reconcile provider renewal results. |
| MEDIUM | Route and security regression depth | Comprehensive test coverage exists for auth routes (login/register/me), leads CRUD, data-scope utilities, entitlements, pagination, isolation matrix, and support tickets on the backend; auth store, routes, and form validation on the frontend. Total: 80 tests passing. | Broaden tests for admin billing/user edge cases, target team manager validation, checkout timeouts, and security-header behavior. |
| MEDIUM | Security and audit controls | Rate limiting, invite expiry checks, security headers (helmet), audit logging infrastructure, and sanitized error logging are implemented. | Expand audit log coverage to API keys, webhooks, role changes, and company deactivation. |
| MEDIUM | Advanced analytics | Funnel, single-touch attribution, linear forecast, and lead velocity are shipped. | Add multi-touch attribution, cohort analytics, predictive forecasting, and custom forecast models only if they remain in paid packaging. |
| MEDIUM | CRM communication integrations | SMTP is used for auth/invite/reset mail only. | Add CRM email/WhatsApp inbox or messaging integrations if those claims stay on the roadmap. |
| LOW | Custom roles and SSO | Roles are fixed and auth is email/password JWT. | Add custom permissions and SSO/SAML only after the SaaS permission model settles. |
| LOW | White-label tenant layer | `Company.slug` exists, but custom domain routing, tenant branding, and subdomain resolution are not implemented. | Add tenant/domain/branding APIs and admin flows after production tenancy hardening. |
| LOW | Native mobile/PWA strategy | The web app is responsive, but there is no iOS, Android, or PWA install flow. | Decide whether the product promise is responsive web, PWA, or native apps before implementation. |
| LOW | Compliance and enterprise operations | No SOC 2/UU PDP evidence workflow, data residency setting, or enterprise compliance controls exist. | Keep compliance claims as roadmap until evidence, workflows, and operating controls are real. |

## Recently Resolved Documentation Drift

- Growth analytics depth is no longer missing at the baseline level; funnel, attribution, forecast, and lead velocity are implemented.
- Payment provider integration is no longer missing; Midtrans checkout, webhook verification, payment processing, and subscription self-service routes exist.
- Multi-pipeline/custom deal stages are no longer missing; pipeline and stage models/routes/UI exist.
- Workflow automation has moved beyond the foundation; assignment, notification, and webhook actions are implemented.
- Rich PDF export is no longer a missing feature; exports now produce branded multi-page PDFs without a new runtime dependency.
