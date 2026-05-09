# FlowRaze - Missing Features & Roadmap

Last updated: 2026-05-09

This document tracks functionality that is actually missing or incomplete in the current codebase. Items that are already shipped are listed separately so the roadmap stays focused.

## Current Product Coverage

- **Authentication and account recovery**: Login/register, JWT sessions, email verification tokens, password reset tokens, SMTP-backed delivery through `nodemailer`, and a development logging fallback are implemented.
- **Core CRM**: Leads, deals, campaigns, activities, users, team performance, dashboard analytics, settings, and global search have API and UI coverage.
- **Lead and project tracking**: Leads support source, service type, campaign assignment, owner, status, notes, and activity history. Campaigns support project type, owner, and sales owner.
- **Deal pipeline**: Deals support CRUD, stage movement, closed-won timestamping, Kanban totals, edit/delete actions, and automatic project campaign creation when a deal is created.
- **Dashboard and reporting**: Dashboard metrics support 7D, 30D, 90D, 12M, and all-time ranges with empty chart states. Team performance supports the same range pattern.
- **Sales targets**: Backend models, seed data, `/api/targets`, `/api/targets/teams`, and `/api/dashboard/targets` exist. The `/targets` page displays achievement KPIs, category mix, monthly breakdowns, and leaderboards.
- **Administration**: Superadmins can manage users, roles, API keys, billing state, and webhooks.
- **Exports**: Leads, deals, campaigns, activities, and team performance export to CSV and lightweight PDF.
- **Webhooks**: Lead/deal/activity events create persisted deliveries, sign payloads, retry failed deliveries with backoff, and support manual replay from Settings.
- **Billing state**: Workspace name, plan, status, seats, renewal date, and external customer reference are persisted and editable by superadmins.
- **Quality tooling**: Root/workspace build, lint, typecheck, and test scripts exist. Current test coverage is utility-focused.

## Missing Or Incomplete Functionality

| Priority | Feature gap                     | Current state                                                                                                                                                            | Needed functionality                                                                                                                                                                       |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HIGH     | Sales target management UI      | Backend CRUD exists and the `/targets` page has a visible `Set Target` button, but the button is not wired to a create/edit flow.                                        | Add target create/edit/delete UI, validate period/scope fields, support company/team/individual target assignment, and refresh dashboard achievement after writes.                         |
| HIGH     | Sales team management UI        | `/api/targets/teams` supports team and member CRUD, but no admin page exposes team creation, manager assignment, or membership management.                               | Add superadmin UI for sales teams, member assignment, manager changes, and delete safeguards.                                                                                              |
| MEDIUM   | Payment provider integration    | Billing is a local account-state editor only. There is no checkout, invoice sync, subscription status webhook, or customer portal handoff.                               | Integrate a chosen payment provider, map provider customer/subscription IDs to `BillingAccount`, and handle plan/status sync from provider webhooks.                                       |
| MEDIUM   | Webhook event coverage          | Webhooks currently support `lead_created`, `deal_created`, `deal_won`, and `activity_created`. Lead updates/deal updates are not emitted even though those writes exist. | Decide the canonical event set, then add update/delete events where useful and expose them in the Settings webhook event picker.                                                           |
| MEDIUM   | Route-level regression coverage | Tests currently cover request utilities, webhook signing, and frontend form validation. Main API routes and critical UI flows are not covered.                           | Add backend route tests for auth, leads, deals, exports, webhooks, billing, targets, and team performance. Add frontend smoke tests for login, CRUD forms, exports, Settings, and Targets. |
| LOW      | Rich PDF reporting              | PDF export is intentionally dependency-free and basic.                                                                                                                   | Adopt a richer PDF renderer only when branded layouts, multi-page tables, charts, or report templates are required.                                                                        |
| LOW      | betterauth decision             | JWT auth works for the MVP; betterauth remains an architecture option.                                                                                                   | Revisit after workspace tenancy, session policy, and production auth requirements are finalized.                                                                                           |

## Documentation Follow-Ups

- `AGENTS.md` still lists email delivery and webhook retry/replay as todos even though both are implemented in source.
- `docs/manual.md` still says password reset tokens are surfaced directly for manual QA, but auth routes now send reset/verification emails and no longer include raw tokens in JSON responses.
- `docs/api.md` does not yet document the Sales Targets endpoints and still names the team export entity as `team` instead of the implemented `team-performance`.
