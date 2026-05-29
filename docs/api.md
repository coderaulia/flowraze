# FlowRaze API Reference

Base URL: `http://localhost:3000` in development, or your configured API domain in production.

Authenticated endpoints require `Authorization: Bearer <token>`. API-key authentication is also supported with `X-API-Key` for company integration routes. Responses follow:

```json
{ "success": true, "data": {} }
```

Errors follow:

```json
{ "success": false, "error": "Message", "code": "OPTIONAL_CODE" }
```

## Tenancy And Roles

- Roles: `superadmin`, `admin`, `manager`, `employee`.
- Superadmin routes live under `/api/admin/*` and manage platform/company metadata.
- Company routes use the authenticated user's `companyId`; clients must not send `companyId` to choose another tenant.
- Critical tenant and role scoping is implemented for CRM reads, detail/update/delete paths, dashboards, team performance, exports, and search. Remaining edge-case hardening is tracked in [code-audit.md](code-audit.md).

## Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Login and return JWT + user |
| POST | `/api/auth/register` | Public | Register a user; self-serve users continue to onboarding |
| POST | `/api/auth/email-verification/request` | User | Send verification email/token |
| POST | `/api/auth/verify-email` | Public | Confirm email verification token |
| POST | `/api/auth/password-reset/request` | Public | Send password reset email/token |
| POST | `/api/auth/password-reset/confirm` | Public | Reset password with token |
| POST | `/api/auth/accept-invite` | Public | Accept company/platform invite and set password |

## Onboarding

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/onboarding/setup-company` | User without company | Create company, billing account, and promote the registering user to admin |

## Superadmin Platform

All routes below require `superadmin`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/overview` | Platform metrics |
| GET | `/api/admin/companies` | List/search companies |
| GET | `/api/admin/companies/:id` | Company detail |
| GET | `/api/admin/companies/:id/users` | Users for one company |
| POST | `/api/admin/companies` | Create company, billing account, and first admin |
| PUT | `/api/admin/companies/:id` | Update company name, slug, or active state |
| DELETE | `/api/admin/companies/:id` | Deactivate company |
| GET | `/api/admin/users` | Cross-company users |
| POST | `/api/admin/users` | Create platform/company user |
| PUT | `/api/admin/users/:id` | Update user |
| POST | `/api/admin/users/:id/resend-invite` | Resend invite |
| POST | `/api/admin/users/:id/reset-password-token` | Issue reset token/email |
| DELETE | `/api/admin/users/:id` | Deactivate/delete user according to route rules |
| POST | `/api/admin/users/invite-superadmin` | Invite a platform superadmin |
| GET | `/api/admin/billing` | Platform billing overview |
| GET | `/api/admin/billing/:companyId` | Company billing detail |
| PUT | `/api/admin/billing/:companyId` | Override company billing plan/status/seats |
| POST | `/api/admin/billing/:companyId/check-payment` | Record or update a pending manual payment check |
| POST | `/api/admin/billing/:companyId/mark-paid` | Mark manual payment/invoice paid and activate renewal |

## Users

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me` | User | Own profile |
| PUT | `/api/users/me` | User | Update own profile/password |
| GET | `/api/users/lookup` | User | User lookup; company-scoped for non-superadmins |
| GET | `/api/users` | Superadmin/Admin | List users; company-scoped for admins |
| GET | `/api/users/:id` | Superadmin/Admin | Get user |
| POST | `/api/users` | Superadmin/Admin | Create user |
| PUT | `/api/users/:id` | Superadmin/Admin | Update user |
| DELETE | `/api/users/:id` | Superadmin/Admin | Delete user, preserving last superadmin |
| POST | `/api/users/invite` | Superadmin/Admin | Invite user |
| POST | `/api/users/:id/resend-invite` | Superadmin/Admin | Resend invite |
| PUT | `/api/users/company` | Admin | Update workspace settings (e.g. `dealLabel`) |

## Leads

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/leads` | Company member | List leads |
| GET | `/api/leads/lookups` | Company member | Distinct lead source/company/service-type lookups |
| POST | `/api/leads/import` | Company member | Bulk import validated lead rows |
| GET | `/api/leads/:id` | Company member | Get lead detail |
| POST | `/api/leads` | Company member | Create lead |
| PUT | `/api/leads/:id` | Company member | Update lead |
| DELETE | `/api/leads/:id` | Company member | Delete lead |

Filter params: `search`, `status`, `source`, `ownerId`, `campaignId`, `createdFrom`, `createdTo`, `page`, `limit`.

## Deals

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/deals` | Company member | List deals |
| GET | `/api/deals/:id` | Company member | Get deal detail |
| POST | `/api/deals` | Company member | Create deal and project campaign |
| PUT | `/api/deals/:id` | Company member | Update deal or move stage |
| DELETE | `/api/deals/:id` | Company member | Delete deal |

Filter params: `search`, `pipelineStageId`, `status`, `ownerId`, `leadId`, `minValue`, `maxValue`, `createdFrom`, `createdTo`, `expectedCloseFrom`, `expectedCloseTo`, `page`, `limit`.

## Pipelines

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/pipelines` | Company member | List company pipelines and stages |
| POST | `/api/pipelines` | Admin | Create pipeline within plan limits |
| PUT | `/api/pipelines/:id` | Admin | Rename pipeline |
| DELETE | `/api/pipelines/:id` | Admin | Delete non-default empty pipeline |
| POST | `/api/pipelines/:id/stages` | Admin | Create pipeline stage |
| PUT | `/api/pipelines/:id/stages/:stageId` | Admin | Update stage name/order/color/won/lost flags |
| DELETE | `/api/pipelines/:id/stages/:stageId` | Admin | Delete unused stage |

## Campaigns

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/campaigns` | Company member | List campaigns |
| GET | `/api/campaigns/:id` | Company member | Get campaign detail |
| POST | `/api/campaigns` | Company member | Create campaign |
| PUT | `/api/campaigns/:id` | Company member | Update campaign |
| DELETE | `/api/campaigns/:id` | Company member | Delete campaign |

Filter params: `search`, `channel`, `minCost`, `maxCost`, `createdFrom`, `createdTo`, `startFrom`, `startTo`, `page`, `limit`.

## Activities

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/activities` | Company member | List activities |
| POST | `/api/activities` | Company member | Create activity (`note`, `call`, `follow_up`) |

Filter params: `leadId`, `type`, `createdBy`, `search`, `createdFrom`, `createdTo`, `page`, `limit`.

## Dashboard And Team Performance

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | Company member | Aggregated sales metrics |
| GET | `/api/dashboard/targets` | Company member | Target achievement and breakdowns |
| GET | `/api/team/performance` | User | Per-member performance stats |

Range params: `range=7d|30d|90d|12m|all`. Paginated team performance accepts `page` and `limit`.

## Sales Targets And Teams

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/targets` | Company member | List targets |
| POST | `/api/targets` | Admin/Manager | Create target |
| PUT | `/api/targets/:id` | Admin/Manager | Update target |
| DELETE | `/api/targets/:id` | Admin/Manager | Delete target |
| GET | `/api/targets/teams` | Company member | List sales teams |
| POST | `/api/targets/teams` | Admin/Manager | Create sales team |
| PUT | `/api/targets/teams/:id` | Admin/Manager | Update sales team |
| DELETE | `/api/targets/teams/:id` | Admin/Manager | Delete sales team |
| POST | `/api/targets/teams/:id/members` | Admin/Manager | Add team member |
| DELETE | `/api/targets/teams/:id/members/:userId` | Admin/Manager | Remove team member |

Target filters: `scope`, `period`, `year`, `quarter`, `month`, `teamId`, `userId`.

## Search

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/search?q=` | Company member | Search leads, deals, campaigns, and activities |

## Exports

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/exports/:entity.csv` | User | CSV export |
| GET | `/api/exports/:entity.pdf` | User | Branded multi-page PDF export |
| GET | `/api/exports/:entity?format=csv|pdf` | User | Alternate export format selector |

Supported entities: `leads`, `deals`, `campaigns`, `activities`, `team-performance`.

## Billing

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/billing` | Admin | Own company billing account |
| PUT | `/api/billing` | Admin | Update own company workspace/billing fields |

## Checkout And Subscription

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/checkout/config` | User | Midtrans client configuration |
| GET | `/api/checkout/plans` | User | Available checkout plans/prices |
| POST | `/api/checkout/create` | Admin | Create Midtrans Snap checkout session |
| POST | `/api/checkout/webhook` | Public signed webhook | Process Midtrans payment notification |
| GET | `/api/checkout/status/:orderId` | Admin | Check payment status |
| GET | `/api/checkout/history` | Admin | Payment history |
| GET | `/api/subscription` | Admin | Current subscription details |
| POST | `/api/subscription/cancel` | Admin | Cancel subscription immediately or at period end |
| POST | `/api/subscription/reactivate` | Admin | Reactivate scheduled cancellation |
| POST | `/api/subscription/downgrade` | Admin | Schedule downgrade |
| GET | `/api/subscription/invoices` | Admin | List invoices |
| GET | `/api/subscription/payments` | Admin | List payments |
| PUT | `/api/subscription/seats` | Admin | Update seat count |

## API Keys

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/api-keys` | Admin | List company API keys |
| POST | `/api/api-keys` | Admin | Create API key |
| DELETE | `/api/api-keys/:id` | Admin | Revoke API key |

## Webhooks

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/webhooks` | Admin | List company webhooks and recent deliveries |
| POST | `/api/webhooks` | Admin | Create webhook |
| PUT | `/api/webhooks/:id` | Admin | Update/pause webhook |
| POST | `/api/webhooks/:id/test` | Admin | Send test payload |
| POST | `/api/webhooks/:id/deliveries/:deliveryId/replay` | Admin | Replay a delivery |
| DELETE | `/api/webhooks/:id` | Admin | Delete webhook |

Webhook events currently dispatched: `lead_created`, `lead_updated`, `deal_created`, `deal_won`, `deal_lost`, `deal_stage_changed`, `activity_created`.

## Automations

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/automations` | Admin | List automation rules with recent runs |
| POST | `/api/automations` | Admin | Create automation rule |
| PUT | `/api/automations/:id` | Admin | Update/pause rule |
| POST | `/api/automations/:id/run` | Admin | Queue manual run |
| GET | `/api/automations/:id/runs` | Admin | List run history |
| DELETE | `/api/automations/:id` | Admin | Delete rule |

Triggers include manual, lead, deal, and activity events. Actions include activity creation, lead status updates, owner assignment, notifications, and webhook calls.

## Support

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/support` | Company member | List own tickets; admins see company tickets |
| POST | `/api/support` | Company member | Submit support or bug ticket |
| PUT | `/api/support/:id` | Admin | Triage, assign, or resolve ticket |

## Pagination

Paginated list endpoints accept `page` and `limit`. Responses include:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```
