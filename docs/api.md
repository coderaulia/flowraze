# FlowRaze API Reference

Base URL: `http://localhost:3000` (development) or your configured API domain in production.

All authenticated endpoints require a `Authorization: Bearer <token>` header. Superadmin-only endpoints additionally enforce the `superadmin` role. API keys may authenticate requests using the `X-API-Key` header instead.

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | — | Login, returns JWT |
| POST | /api/auth/register | — | Register new account |
| POST | /api/auth/email-verification/request | User | Request email verification token |
| POST | /api/auth/verify-email | — | Confirm email verification |
| POST | /api/auth/password-reset/request | — | Request password reset token |
| POST | /api/auth/password-reset/confirm | — | Confirm password reset |

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/users/me | User | Get own profile |
| PUT | /api/users/me | User | Update own profile |
| GET | /api/users | Superadmin | List all users |
| GET | /api/users/:id | Superadmin | Get user by ID |
| POST | /api/users | Superadmin | Create user |
| PUT | /api/users/:id | Superadmin | Update user |
| DELETE | /api/users/:id | Superadmin | Delete user (preserves last superadmin) |

## Leads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/leads | User | List leads |
| GET | /api/leads/:id | User | Get lead by ID |
| POST | /api/leads | User | Create lead |
| PUT | /api/leads/:id | User | Update lead |
| DELETE | /api/leads/:id | User | Delete lead |

**Filter params:** `search`, `status`, `source`, `assignedTo`, `createdFrom`, `createdTo`

## Deals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/deals | User | List deals |
| GET | /api/deals/:id | User | Get deal by ID |
| POST | /api/deals | User | Create deal |
| PUT | /api/deals/:id | User | Update deal / move stage |
| DELETE | /api/deals/:id | User | Delete deal |

**Filter params:** `search`, `stage`, `status`, `assignedTo`, `valueMin`, `valueMax`, `createdFrom`, `createdTo`

## Campaigns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/campaigns | User | List campaigns |
| GET | /api/campaigns/:id | User | Get campaign by ID |
| POST | /api/campaigns | User | Create campaign |
| PUT | /api/campaigns/:id | User | Update campaign |
| DELETE | /api/campaigns/:id | User | Delete campaign |

**Filter params:** `search`, `status`, `channel`, `createdFrom`, `createdTo`

## Activities

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/activities | User | List activities |
| POST | /api/activities | User | Create activity (type: `note`, `call`, `follow_up`) |

**Filter params:** `leadId`, `type`, `createdBy`, `search`, `createdFrom`, `createdTo`

## Dashboard & Team

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/dashboard | User | Aggregated sales metrics |
| GET | /api/team/performance | User | Per-member performance stats |

## Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/search?q= | User | Cross-entity search across leads, deals, campaigns, and activities |

## Exports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/exports/:entity.csv | User | CSV export |
| GET | /api/exports/:entity.pdf | User | PDF export |

Supported entities: `leads`, `deals`, `campaigns`, `activities`, `team`. Accepts the same filter params as the corresponding list endpoint. Omit `page`/`limit` to export the full filtered dataset.

## API Keys

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/api-keys | Superadmin | List API keys |
| POST | /api/api-keys | Superadmin | Create API key |
| DELETE | /api/api-keys/:id | Superadmin | Revoke API key |

## Billing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/billing | User | Get workspace billing state |
| PUT | /api/billing | Superadmin | Update billing state |

## Webhooks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/webhooks | Superadmin | List webhooks |
| POST | /api/webhooks | Superadmin | Create webhook |
| PUT | /api/webhooks/:id | Superadmin | Update / pause webhook |
| DELETE | /api/webhooks/:id | Superadmin | Delete webhook |
| POST | /api/webhooks/:id/test | Superadmin | Send test payload to webhook URL |

Webhook events dispatched: `lead_created`, `lead_updated`, `deal_created`, `deal_updated`, `deal_won`, `activity_created`.

## Pagination

List endpoints accept `page` (default 1) and `limit` (default 20) query params. When present, responses include pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```
