# FlowRaze - Code Audit & Technical Debt

Last updated: 2026-05-09

## Current Status

The audit items from the previous pass are now implemented in the codebase:

- **Testing Infrastructure**: Root, API, web, and shared workspaces now expose `npm test`. API and web tests use Node's built-in test runner through the existing `tsx` dev dependency, so no new packages were added.
- **Global Search**: Header search now routes to `/search` and the backend searches leads, deals, campaigns, and activities.
- **Security Workflows**: Auth now supports email verification tokens and password-reset request/confirm endpoints. Manual QA tokens have been replaced with a `nodemailer` service that safely logs locally and supports SMTP configuration.
- **API Keys**: Superadmins can create/revoke API keys. API key authentication is supported through `X-API-Key`.
- **Webhooks**: Superadmins can create, pause, test, and delete event webhooks. Lead, deal, and activity writes dispatch persisted webhook deliveries with exponential backoff for failures and UI controls for manual replay.
- **Billing**: A persisted workspace billing account exists with editable plan, status, seats, renewal date, and external customer reference.
- **Exporting**: Leads, deals, campaigns, activities, and team performance can be exported as CSV or lightweight PDF reports.
- **Advanced Filtering**: List/export endpoints support combined search/filter query params for common CRM fields and date/value ranges.
- **Pagination Syncing**: Table views retain API-backed pagination controls, and exports remove page/limit to export the filtered dataset.
- **Error Handling Consistency**: Settings, auth, forms, API keys, webhooks, billing, and export controls use the existing API response pattern and inline feedback.
- **Project Tracking**: Campaigns now track `type`, `owner`, and `salesOwner` to support complex sales-to-project transitions and dual ownership.
- **Analytics & Dashboards**: Added date-range filtering (7D, 30D, etc.) to the revenue dashboard and time-based filtering to Team Performance KPIs.

## Verification Snapshot

Run on 2026-05-09:

```bash
npm run typecheck --workspaces
npm test
npm run lint --workspaces
```

The final build should be run after every follow-up patch:

```bash
npm run build
```

## Remaining Watch Items

- PDF export is dependency-free and intentionally simple. Replace it with a richer renderer only after choosing a PDF dependency.
- `betterauth`, Turborepo, and paid subscription provider integration remain future architecture choices, not current blockers.
