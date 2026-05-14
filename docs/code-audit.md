# FlowRaze Security Audit

**Last updated:** 2026-05-14

**Scope:** `apps/api`, `apps/web`, `prisma/schema.prisma`, `shared/types`

This audit has been reconciled against the current codebase. Resolved false positives and completed fixes were removed from the open checklist so this file stays useful as an active security queue.

## Current Status Snapshot

- Auth rate limiting exists on login and password-reset endpoints.
- `/api/checkout/plans` is authenticated.
- `/api/users/lookup` exists and is tenant-scoped.
- `/api/analytics/{funnel,attribution,forecast,lead-velocity}` exists and is authenticated/company-scoped.
- Invite acceptance checks `inviteExpiresAt > now`.
- Campaign create/update validates `ownerId` and `salesOwnerId` inside the company.
- Automation create and update both validate `actionConfig`.
- Support ticket assignment verifies the assignee is an active admin or manager in the same company.
- `/api/dashboard/targets` applies role-aware scope checks for manager/team and employee/individual access.

## High Priority Findings

### 1. Superadmin Company-User Creation Can Bypass Seat Limits

**File:** `apps/api/src/routes/admin.ts`

**Evidence:** `POST /api/admin/users` creates a company user directly after checking the company and duplicate email. Unlike company-admin create/invite flows in `apps/api/src/routes/users.ts`, it does not call `ensureSeatAvailable()` or the entitlement engine.

**Fix:** Enforce company seat limits when superadmins create or move users into a company, or require an explicit platform override path that is audited.

### 2. Sales Team Manager IDs Are Not Validated On Team Create/Update

**File:** `apps/api/src/routes/targets.ts`

**Evidence:** `POST /targets/teams` and `PUT /targets/teams/:id` accept `managerId` strings and save them without first confirming the user exists, belongs to `req.companyId`, is active, and is allowed to manage a team.

**Fix:** Add a shared `assertTeamManagerInCompany()` check before create/update and add route tests for cross-company and inactive-manager rejection.

### 3. No Audit Logging For Sensitive Operations

No persisted audit trail exists for user role/company changes, billing overrides, API-key creation/revocation, webhook changes, support assignment/resolution, or superadmin actions.

**Fix:** Add an `AuditLog` model and write structured entries from sensitive admin/company routes.

### 4. External Payment Calls Lack Request Timeouts

**File:** `apps/api/src/utils/payment-provider.ts`

**Evidence:** Midtrans Snap creation and transaction status fetches call `fetch()` without an abort signal. Network hangs can hold API requests open indefinitely.

**Fix:** Wrap provider fetches with `AbortController`/`AbortSignal.timeout()` and return a clear provider-timeout error.

## Medium Priority Findings

### 5. Security Headers Are Not Configured

**File:** `apps/api/src/app.ts`

**Evidence:** The Express app configures CORS and JSON parsing, but no `helmet` or equivalent security-header middleware.

**Fix:** Add security headers middleware and test at least the common response headers.

### 6. Backend Email And URL Validation Is Incomplete

**Files:** `apps/api/src/routes/admin.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/routes/leads.ts`, `apps/api/src/routes/support.ts`

Backend routes still rely mostly on required string checks for emails, and support tickets accept `pageUrl` as any trimmed string.

**Fix:** Add shared `optionalEmail`, `requiredEmail`, and `optionalUrl` request validators, then use them consistently.

### 7. Support Ticket List Needs Standard Pagination

**File:** `apps/api/src/routes/support.ts`

**Evidence:** `GET /support` returns at most 100 rows via hardcoded `take: 100`, unlike other list routes using `getPagination()`.

**Fix:** Use the shared pagination utilities with a max cap and return pagination metadata.

### 8. Error Logging Can Leak Sensitive Context

**File:** `apps/api/src/middleware/errorHandler.ts`

**Evidence:** `console.error('Error:', err)` logs full error objects.

**Fix:** Replace with structured sanitized logging that strips request bodies, secrets, tokens, credentials, and provider payloads.

## Current Public/Unauthenticated Routes

| Route | Method | Status |
| --- | --- | --- |
| `/api/auth/login` | POST | Public by design; rate-limited |
| `/api/auth/register` | POST | Public by design |
| `/api/auth/email-verification/request` | POST | Authenticated |
| `/api/auth/verify-email` | POST | Public by design |
| `/api/auth/password-reset/request` | POST | Public by design; rate-limited |
| `/api/auth/password-reset/confirm` | POST | Public by design; rate-limited |
| `/api/auth/accept-invite` | POST | Public by design; hashed expiring invite token required |
| `/api/checkout/webhook` | POST | Public by design; Midtrans signature verified |
| `/api/health` | GET | Public health check |

## Action Checklist

- [ ] Enforce seat limits or audited override semantics in superadmin company-user creation/moves.
- [ ] Validate sales-team `managerId` on create and update.
- [ ] Add audit logging for sensitive admin/company operations.
- [ ] Add timeouts to Midtrans provider fetches.
- [ ] Add security headers middleware.
- [ ] Add shared backend email and URL validators.
- [ ] Paginate support ticket list responses with shared pagination metadata.
- [ ] Replace raw error logging with sanitized structured logging.
