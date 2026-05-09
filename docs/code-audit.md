# FlowRaze - Code Audit & Technical Debt

Last updated: 2026-05-09

This audit reflects the current repository state after reviewing the API routes, Prisma schema, frontend pages, shared types, and docs.

## Progress Snapshot

The previous high-level roadmap items are mostly implemented:

- **Auth hardening**: JWT production checks, CORS origin allowlisting, email verification, password reset, SMTP delivery, and local email logging fallback are in place.
- **Core CRM API and UI**: Leads, deals, campaigns, activities, users, team performance, dashboard, search, exports, billing, API keys, and webhooks are implemented.
- **Filtering and pagination**: Core list pages use API-backed pagination and combined filters. Export controls remove pagination params before exporting filtered datasets.
- **Dashboard analytics**: Revenue, leads, sources, stages, and conversion metrics are derived from persisted data and support `7d`, `30d`, `90d`, `12m`, and `all` ranges.
- **Webhook reliability**: Deliveries persist with status, retry count, next retry time, signed payloads, automatic retry processing, and manual replay.
- **Sales targets management**: Prisma models, seed data, target CRUD routes, sales team routes, dashboard achievement aggregation, target CRUD UI, and superadmin sales-team member management are implemented.
- **Validation pattern**: Backend write routes use shared request validators; frontend write forms use shared form validation helpers and inline errors in the main CRUD surfaces.

## Audit Findings

| Priority | Finding | Evidence | Recommended fix |
|----------|---------|----------|-----------------|
| MEDIUM | Shared package types are stale versus app-local types and schema. | `shared/types/index.ts` lacks `Lead.serviceType`, `Deal.closedAt`, webhook retry fields, `WebhookStatus.pending`, and `DashboardStats.leadsOverTime`; `apps/web/src/types/index.ts` has several of these. | Either update shared types and import them consistently, or remove unused duplicated shared contracts. |
| MEDIUM | API docs are behind shipped routes. | `docs/api.md` omits `/api/targets`, `/api/targets/teams`, and `/api/dashboard/targets`; it documents export entity `team`, while code supports `team-performance`. | Update API docs from current route files and keep endpoint names aligned with frontend calls. |
| MEDIUM | Manual and tracker docs contain stale QA guidance. | `docs/manual.md` still says reset tokens are surfaced for manual QA. `AGENTS.md` still lists email delivery and webhook retry/replay as todos. | Update the manual and tracker docs in a focused docs pass. |
| MEDIUM | Route-level behavior has little automated coverage. | Only `apps/api/src/utils/request.test.ts`, `apps/api/src/utils/security.test.ts`, and `apps/web/src/lib/form-validation.test.ts` are present. | Add API route tests for auth, leads/deals, exports, webhooks, billing, targets, and team performance. |
| LOW | Webhook events cover creates and deal wins but not updates/deletes. | `WebhookEvent` includes only `lead_created`, `deal_created`, `deal_won`, and `activity_created`; lead/deal update routes do not dispatch events. | Add events only after confirming integration needs; otherwise document the intentionally small event set. |
| LOW | Lightweight PDF export is intentionally basic. | `apps/api/src/utils/export.ts` avoids a PDF dependency and generates simple reports. | Keep as-is until branded or multi-page reporting is required. |

## Verification Snapshot

Recommended verification after code changes:

```bash
npm run typecheck --workspaces
npm test
npm run lint --workspaces
npm run build
```

Latest run on 2026-05-09 passed all four commands after implementing audit items 1 and 2.

## Next Implementation Order

1. Sync shared types and API documentation with current routes.
2. Add route-level tests around auth, targets, webhooks, exports, and billing.
3. Decide whether webhook update/delete events and payment provider integration belong in the next product phase.
