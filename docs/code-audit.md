# FlowRaze Security Audit

**Last updated:** 2026-05-29

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
- Security headers are configured via `helmet` middleware.
- Midtrans provider fetches use `AbortSignal.timeout(15_000)` to prevent indefinite hangs.
- Superadmin company-user creation enforces seat limits via `getCompanyEntitlements()`.
- Sales team `managerId` is validated on create and update (must be active admin/manager in company).
- Audit logging infrastructure exists (`AuditLog` model + `writeAuditLog()` utility) and is wired to sensitive admin operations.
- Shared `requireEmail`, `optionalEmail`, and `optionalUrl` validators exist in `request.ts`.
- Support ticket list uses standard pagination with metadata.
- Error handler uses sanitized structured logging (no raw error object dumps).

## Resolved Items

### ~~1. Superadmin Company-User Creation Can Bypass Seat Limits~~

**Status:** Fixed (2026-05-16)

`POST /api/admin/users` now calls `getCompanyEntitlements()` and checks active user count against the seat limit before creating a user. Moving users to a different company via `PUT /api/admin/users/:id` also enforces the target company's seat limit.

### ~~2. Sales Team Manager IDs Are Not Validated On Team Create/Update~~

**Status:** Fixed (2026-05-16)

`POST /targets/teams` and `PUT /targets/teams/:id` now validate that `managerId` references an active user in the same company with `admin` or `manager` role.

### ~~3. No Audit Logging For Sensitive Operations~~

**Status:** Fixed (2026-05-16)

`AuditLog` model added to Prisma schema with indexes on `(companyId, createdAt)`, `(actorId, createdAt)`, and `(resource, resourceId)`. `writeAuditLog()` utility writes structured entries from admin routes (user creation, company creation, billing mark-paid). Additional coverage can be added incrementally.

### ~~4. External Payment Calls Lack Request Timeouts~~

**Status:** Fixed (2026-05-16)

Midtrans Snap creation and transaction status fetches now use `AbortSignal.timeout(15_000)` (15 seconds).

### ~~5. Security Headers Are Not Configured~~

**Status:** Fixed (2026-05-16)

`helmet` middleware added to `app.ts` with `contentSecurityPolicy: false` (managed by frontend) and `crossOriginEmbedderPolicy: false` (needed for Snap.js embedding).

### ~~6. Backend Email And URL Validation Is Incomplete~~

**Status:** Fixed (2026-05-16)

Shared `requireEmail`, `optionalEmail`, and `optionalUrl` validators added to `request.ts`. Support ticket `pageUrl` now uses `optionalUrl` validation.

### ~~7. Support Ticket List Needs Standard Pagination~~

**Status:** Fixed (2026-05-16)

`GET /support` now uses `getPagination()` with the shared pagination utilities and returns pagination metadata.

### ~~8. Error Logging Can Leak Sensitive Context~~

**Status:** Fixed (2026-05-16)

Error handler now uses `sanitizeError()` which only logs name, message, status code, Prisma code, and stack (dev only). No raw error objects or request bodies are logged.

## Remaining Work

### Expand Audit Logging Coverage

Audit logging infrastructure is in place. Additional write points should be added incrementally:
- API key creation/revocation
- Webhook endpoint changes
- Billing plan/status overrides
- User role changes
- Company deactivation
- Support ticket assignment/resolution

### Expand Email/URL Validator Usage

The shared validators exist but are not yet applied to all routes that accept email or URL inputs. Apply `requireEmail`/`optionalEmail` to:
- `POST /api/admin/users` (email field)
- `POST /api/auth/register` (email field)
- `POST /api/leads` (email field)

### Additional Security Hardening

- Add CSRF protection for state-changing operations if cookie-based auth is added later.
- Consider adding request-ID correlation for structured logging.
- Add IP-based rate limiting for webhook replay endpoints.

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

- [x] Enforce seat limits or audited override semantics in superadmin company-user creation/moves.
- [x] Validate sales-team `managerId` on create and update.
- [x] Add audit logging for sensitive admin/company operations.
- [x] Add timeouts to Midtrans provider fetches.
- [x] Add security headers middleware.
- [x] Add shared backend email and URL validators.
- [x] Paginate support ticket list responses with shared pagination metadata.
- [x] Replace raw error logging with sanitized structured logging.
- [ ] Expand audit logging to API keys, webhooks, role changes, and company deactivation.
- [ ] Apply email/URL validators to remaining routes (admin user create, auth register, leads).
