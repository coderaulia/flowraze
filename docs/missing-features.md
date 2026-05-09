# FlowRaze - Missing Features & Roadmap

Last updated: 2026-05-09

## Implemented In This Pass

- **Email Verification**: Users can request and confirm verification tokens from Settings. Registration also creates an initial verification token.
- **Password Reset**: Public request/confirm endpoints are available from the login page, with the same controls mirrored in Settings for QA.
- **Email Delivery**: Integrated `nodemailer` to dispatch real verification and password reset emails, removing manual QA tokens from the JSON API responses.
- **Roles Management**: Superadmins can create users, promote/demote roles, and delete users while preserving at least one superadmin account.
- **API Access Keys**: Superadmins can create and revoke API keys for external integrations. API requests may authenticate with `X-API-Key`.
- **Settings Page**: Profile, Security, Billing, API Keys, and Webhooks are implemented.
- **Global Search**: Search covers leads, deals, campaigns, and activities through `/api/search`.
- **Table Pagination**: Leads, campaigns, users, and team performance expose API-backed pagination controls.
- **Mobile Responsiveness**: The shell, tables, dashboard, and Kanban board use responsive layouts and horizontal scrolling where needed.
- **Data Export**: CSV and PDF export is available for leads, deals, campaigns, activities, and team performance.
- **Webhook Integrations**: Webhook endpoints, testing, delivery logging, CRM event dispatch, automated retries with exponential backoff, and manual delivery replays are implemented.
- **Advanced Filtering**: Leads, deals, campaigns, activities, and exports support combined filter query params.
- **Team Performance**: `/api/team/performance` is wired to a real frontend view with pagination, time-based filtering, and export.
- **Billing System**: A persisted billing account tracks workspace name, plan, status, seats, renewal date, and external customer reference.
- **Testing Infrastructure**: `npm test` is available across workspaces without adding new dependencies.
- **Project Tracking & Campaigns**: Added `type`, `owner`, and `salesOwner` to Campaigns for robust project tracking and dual-ownership. Leads can be associated directly with Campaigns.
- **Dashboard Analytics**: Dashboard charts and metrics track revenue over dynamic time ranges (7D, 30D, 90D, 12M).
- **Sales Targets Tracking**: Implemented revenue, lead, and deal targets across company, team, and individual scopes with achievement visualization and trend tracking.

## Future Enhancements

- Add a richer PDF renderer if reports need branding, tables across multiple pages, or charts.
- Integrate a real billing provider for checkout, invoices, payment status sync, and customer portal handoff.
- Revisit betterauth and workspace-level multi-tenancy when the SaaS tenancy model is finalized.
