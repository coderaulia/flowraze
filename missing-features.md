# FlowRaze - Missing Features & Roadmap

Based on the documentation, codebase, and current project status, the following features are currently missing and represent the upcoming development roadmap.

## 1. Authentication & Security
- **Full Authentication Flow**: Basic JWT login/register is implemented, but advanced flows like Email Verification and Password Reset are missing.
- **Roles Management**: Ability for Superadmins to promote Staff to Admins or demote them is missing. Currently, roles are somewhat static or manually seeded.
- **API Access Keys**: Superadmins cannot currently generate API keys for external integrations (Zapier, custom webhooks).

## 2. Global Functionality
- **Settings Page**: The Profile and Security settings page is currently just a placeholder and needs full implementation.
- **Global Search (Cross-Entity)**: Search is currently implemented only for Leads (`/leads?search=...`). A unified global search spanning Deals, Campaigns, and Activities is needed.
- **Table Pagination (Frontend)**: The API supports `page` and `limit` for list endpoints, but the frontend tables do not fully implement complete pagination controls across all views.
- **Mobile Responsiveness**: While a layout shell exists, further mobile responsive improvements are needed for complex views like the Kanban board and Dashboard.

## 3. Advanced Features
- **Data Export (CSV/PDF)**: The ability to export CRM data for external backups or accounting is currently missing.
- **Webhook Integrations**: No webhook infrastructure exists to trigger events on Deal Won, Lead Created, etc.
- **Advanced Filtering**: Filtering is basic; advanced combinations (e.g., filtering leads by source AND date AND status) are missing.
- **Team Performance UI/Data Integration**: The backend API for team performance exists (`/api/team/performance`), but real frontend integration and advanced UI displays are pending.

## 4. Multi-Tenant & SaaS Features
- **Billing System**: A multi-tenant subscription and billing system is planned but entirely missing.
