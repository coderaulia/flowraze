# FlowRaze User Manual

Welcome to the FlowRaze user guide! FlowRaze is a modern CRM and Operations Analytics application designed to help teams track leads, manage deal pipelines, and monitor overall sales performance.

This manual is divided into sections based on your account role: **Employee**, **Manager**, **Admin**, and **Superadmin**. 

---

## 1. Employee Guide

As an employee (e.g., Sales Representative), your primary focus is managing your pipeline, communicating with leads, and closing deals. In the multi-tenant system, you only see your own assigned data.

### Navigating the Interface
- **Dashboard**: Gives you a high-level overview of your sales metrics, including total revenue, conversion rates, and your active pipeline.
- **Leads**: The starting point for all potential clients.
- **Deals**: Your Kanban board where you track the progress of ongoing sales.
- **Campaigns**: View the marketing campaigns generating your leads.

### Managing Leads
1. **Adding a Lead**: Go to the **Leads** page and click **Add Lead**. Fill in the contact details, source, and initial status (e.g., `New`, `Contacted`).
2. **Logging Activity**: When you call, email, or follow up with a lead, log an activity to keep a historical record. This populates the Activity Feed on the dashboard and helps you pick up where you left off.
3. **Updating Status**: As you engage with the lead, update their status to `Qualified` or `Unqualified`.

### Managing Deals
1. **The Kanban Board**: Deals are visualized on a board by their stage (`New`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`).
2. **Moving Deals**: Drag and drop a deal from one column to the next as the negotiation progresses.
3. **Winning a Deal**: Dragging a deal to the `Won` column immediately updates your Dashboard's Revenue metrics.

---

## 2. Manager Guide

Managers act as team leads. They have all the capabilities of an Employee, plus oversight of their specific sales team.

### Team Management
- **My Team**: Managers can view the leads and deals for all members of their assigned team.
- **Team Targets**: Managers can set and monitor individual targets for their team members.
- **Reporting**: Access to team-specific performance dashboards and activity feeds.

---

## 3. Admin Guide

Admins manage their specific **Company**. They have full visibility into all company data (leads, deals, campaigns, targets) but cannot access other companies on the platform.

### Company Management
- **User Management**: Admins invite and manage Employees, Managers, and other Admins within their own company.
- **Company Settings**: Manage API keys, webhooks, and branding for the company.
- **Billing**: Manage the company's subscription plan and seat limits.
- **Company Targets**: Set company-wide revenue and lead targets.

---

## 4. Superadmin (Platform) Guide

Superadmins manage the entire FlowRaze **Platform**. They oversee all companies, global billing, and platform-wide configurations.

### Platform Administration
- **Company Onboarding**: Superadmins create and manage company tenants.
- **Platform Billing**: Oversight of all subscriptions and MRR across the platform.
- **Cross-Company Monitoring**: Superadmins can view user lists across all companies for support and auditing.
- **System Security**: Manage global security policies and platform-wide webhooks.

---

## Troubleshooting & Support

- **Forgot Password**: Use the password reset controls on the login screen. In the MVP, reset tokens are surfaced directly for manual QA until email delivery is connected.
- **Data Not Loading**: Try refreshing the page. If the issue persists, ensure you are connected to the internet. If you see a "Network Error", contact your Superadmin to ensure the backend API is running.
- **Missing Features**: If you cannot see certain pages (like "Users" or "Campaigns"), it is likely because your account is set to the **Staff** role. Contact your Admin to request a role change if necessary.
