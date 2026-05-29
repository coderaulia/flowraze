# FlowRaze User Manual

FlowRaze is a flat-rate, multi-company CRM and operations analytics app for tracking leads, deals, campaigns, activity, targets, billing, and team performance.

Plans: **Starter** (Rp 300k/mo, up to 5 users), **Growth** (Rp 800k/mo, unlimited users), **Custom** (contact sales, unlimited everything). New workspaces begin with a 14-day Growth trial.

The app has four roles: **Employee**, **Manager**, **Admin**, and **Superadmin**.

---

## Employee Guide

Employees focus on their own sales work.

### Main Areas

- **Dashboard:** Revenue, leads, conversion, campaign, and target performance.
- **Leads:** Create leads, import lead files, update status, and add notes.
- **Deals:** Move deals through the Kanban pipeline from new to won/lost.
- **Campaigns:** Review campaigns and the leads/deals connected to them.
- **Activities:** Log calls, notes, and follow-ups.
- **Targets:** Review assigned targets and achievement.

### Common Flow

1. Add or import leads from the Leads page.
2. Create deals from qualified leads.
3. Move deals through the pipeline as work progresses.
4. Log activities so follow-up history stays visible.
5. Check Targets and Dashboard for progress against revenue, lead, and deal goals.

---

## Manager Guide

Managers have employee capabilities plus team responsibilities.

### Team And Targets

- View team performance and revenue contribution.
- Create and maintain sales teams where permitted.
- Assign or adjust team and individual targets for their own team.
- Add or remove team members from managed teams.

### CRM Work

Managers can create leads, deals, and campaigns. Manager views are scoped to their managed teams where team-level visibility applies.

---

## Admin Guide

Admins manage one company workspace.

### Company Management

- **Users:** Create, invite, edit, delete, and resend invitations for company users.
- **Settings:** Manage profile/security settings, company billing state, API keys, and webhooks.
- **Billing:** Review and update workspace billing details.
- **Subscription:** Upgrade through Midtrans checkout, review payments/invoices, adjust seats, cancel/reactivate, or schedule downgrades.
- **Targets:** Create company, team, and individual targets; manage sales teams and members.
- **Pipelines:** Manage company pipelines and custom stages from Settings.
- **Automations:** Create CRM event rules for activity creation, lead status updates, owner assignment, notifications, and webhook calls.
- **Support:** Review, assign, and resolve company support tickets.
- **CRM:** Manage company leads, deals, campaigns, activities, exports, and dashboard reporting.

Admins cannot access other company workspaces through company routes.

---

## Superadmin Guide

Superadmins manage the FlowRaze platform, not day-to-day company CRM operations.

### Platform Administration

- View platform overview metrics.
- Create, update, deactivate, and inspect companies.
- Create and manage cross-company users.
- Invite other superadmins.
- Inspect and override company billing state.
- Review payment checks, mark invoices paid, and override company billing when needed.

Superadmin pages are available under `/admin/*`.

---

## Account And Access

- **Registration:** Public registration creates a user account, then sends the user to onboarding to create a company workspace.
- **Onboarding:** The first user who creates a company becomes that company's admin.
- **Invites:** Admins and superadmins can invite users. Invite links are emailed when SMTP is configured; in development the email body is logged to the API console.
- **Email verification:** Verification emails are sent through SMTP or logged in development.
- **Forgot password:** Password reset links are sent through SMTP or logged in development.

---

## Company Settings (Admin)

Admins can manage workspace settings via Settings, including:

- **Profile and security:** Update display name, email, and password.
- **Workspace label:** Rename "Deals" to "Projects" (or any label) via the `dealLabel` setting. This propagates to the sidebar navigation and Deal/Project page header.
- **Billing:** Review and update workspace billing details.
- **Subscription:** Upgrade through Midtrans checkout, review payments/invoices, cancel/reactivate, or schedule downgrades.
- **API keys and webhooks:** Available on the Growth and Custom plans.
- **Pipelines:** Manage company pipelines and custom stages from Settings.

## WhatsApp Contact

The Leads table includes a **WhatsApp** button on each lead row. Clicking it opens a `wa.me` chat with the lead's phone number (Indonesian formats like `0812-xxxx`, `+62 812-xxxx`, and `812-xxxx` are normalized automatically). No gateway or token setup is required.

## Dashboard (Agency Metrics)

For agencies and B2B service teams, the dashboard includes:

- **Proposal pipeline value:** Total value of deals in proposal/negotiation stages.
- **Average deal cycle:** Days from lead creation to deal won.
- **Repeat clients:** Count of clients with multiple deals.
- **Revenue by service type:** Breakdown chart by `serviceType`.

## Exports

The app can export leads, deals, campaigns, activities, and team performance as CSV or branded multi-page PDF. Exports accept the same filters as the corresponding list views where supported.

---

## Troubleshooting

- **Cannot log in:** Confirm the API is running and the account is active.
- **Invite or reset email missing:** Check SMTP configuration. In development, inspect the API console for the logged fallback email.
- **Missing Users or Settings page:** Those pages require the Admin role.
- **Redirected to onboarding:** Your user has no company yet; finish workspace setup.
- **Payment status does not update:** Confirm the Midtrans webhook is configured and check the checkout status from the billing/subscription pages.
