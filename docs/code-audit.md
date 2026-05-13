# FlowRaze Security Audit

**Date:** 2026-05-13  
**Scope:** Full codebase — `apps/api`, `apps/web`, `prisma/schema.prisma`, `shared/types`

---

## Critical Issues

### 1. ~~No Rate Limiting on Auth Endpoints~~ ✅ FIXED
**File:** `apps/api/src/routes/auth.ts`  
Added `express-rate-limit` (5 attempts / 15 min) to `POST /login`, `POST /password-reset/request`, `POST /password-reset/confirm`.

---

### 2. ~~No CSRF Protection~~ ✅ FALSE POSITIVE
API uses Bearer token auth (`Authorization: Bearer <jwt>`), not cookies. Browsers don't automatically send Authorization headers, so CSRF does not apply. No fix needed.

---

### 3. ~~Missing Analytics Endpoints~~ ✅ FALSE POSITIVE
`apps/api/src/routes/analytics.ts` exists and is registered in `app.ts`. All four endpoints (`/funnel`, `/attribution`, `/forecast`, `/lead-velocity`) are implemented and protected.

---

### 4. ~~Missing `/users/lookup` Endpoint~~ ✅ FALSE POSITIVE
`GET /users/lookup` exists at `apps/api/src/routes/users.ts:162`, scoped to `req.companyId`.

---

### 5. ~~JWT Expiry Too Long~~ ✅ FIXED
**File:** `apps/api/src/routes/auth.ts`  
Changed from `'7d'` → `'24h'` on all three token-signing calls (login, register, accept-invite).

---

### 6. ~~Unprotected `/checkout/plans`~~ ✅ FIXED
**File:** `apps/api/src/routes/checkout.ts:33`  
Added `authenticate` middleware to `GET /checkout/plans`.

---

### 7. ~~Authorization Missing on Billing Update~~ ✅ FALSE POSITIVE
`PUT /billing/` calls `getBillingAccount(req.companyId!)` which fetches the record by `companyId` first, then updates by that record's `id`. Company isolation is already enforced.

---

## High Priority Issues

### 8. Privilege Escalation — Seat Limit Bypass via Superadmin
**File:** `apps/api/src/routes/users.ts:242`  
`ensureSeatAvailable()` is skipped for superadmins. A superadmin can create unlimited users, bypassing plan seat limits.

**Fix:** Enforce seat limits for all user creation regardless of role. Add a separate quota exemption flag if needed.

---

### 9. `managerId` Not Validated in Team Creation
**File:** `apps/api/src/routes/targets.ts:53-76`  
`POST /targets/teams` accepts `managerId` as a string but does not verify the user exists or belongs to `req.companyId`. An attacker can assign any user ID as manager.

**Fix:** Add `prisma.user.findFirstOrThrow({ where: { id: managerId, companyId: req.companyId } })` before team creation.

---

### 10. `actionConfig` Accepts Arbitrary JSON in Automations
**File:** `apps/api/src/routes/automations.ts:114`  
Update operations store unvalidated JSON in `actionConfig`. Only creation validates the config schema.

**Fix:** Apply `validateActionConfig()` on both create and update paths.

---

### 11. Support Ticket Assignee Not Verified as Company Member
**File:** `apps/api/src/routes/support.ts:162-169`  
`assertAssignableUserInCompany()` may not await correctly in all branches and doesn't verify the assignee's role matches company membership before assignment.

**Fix:** Ensure the function is awaited on all code paths; add explicit `companyId` check.

---

### 12. No Audit Logging on Sensitive Operations
No audit trail exists for:
- User role changes
- Billing updates
- API key creation/revocation
- Webhook modifications
- Superadmin actions

**Fix:** Add an `AuditLog` model to Prisma and write entries on all of the above operations.

---

### 13. Sensitive Data Exposed in Error Logs
**File:** `apps/api/src/middleware/errorHandler.ts:20`  
`console.error('Error:', err)` dumps full error objects which may contain PII or credentials.

**Fix:** Use structured logging (e.g., `pino`) and strip sensitive fields before logging.

---

### 14. Missing Timeout on External API Calls
**File:** `apps/api/src/routes/checkout.ts:162-168`  
`getTransactionStatus()` has no timeout. Network hangs will block the request indefinitely.

**Fix:** Add `AbortSignal.timeout(5000)` or equivalent on all external fetch calls.

---

## Medium Priority Issues

### 15. Email Format Not Validated on Backend
| File | Location |
|------|----------|
| `apps/api/src/routes/admin.ts:249` | `adminEmail` only checked as required string |
| `apps/api/src/routes/auth.ts` | Registration email |
| `apps/api/src/routes/leads.ts` | Lead email field |

Frontend validates email but backend does not. **Fix:** Add email regex or `validator` library check server-side.

---

### 16. Missing Pagination Enforcement
**File:** `apps/api/src/routes/support.ts:103`  
`take: 100` hardcoded with no client-controlled pagination. Can return large result sets.

**Fix:** Use `getPagination(req.query)` consistently with a max cap (e.g., 50).

---

### 17. Invite Token Expiry Not Checked
**File:** `apps/api/src/routes/auth.ts` (`/accept-invite`)  
The invite acceptance flow doesn't verify `inviteExpiresAt` is in the future.

**Fix:** Add `inviteExpiresAt: { gt: new Date() }` to the Prisma `findFirst` query.

---

### 18. Campaign Owner IDs Not Validated
**File:** `apps/api/src/routes/campaigns.ts`  
`ownerId` and `salesOwnerId` on campaign create/update are not verified to exist in `req.companyId`.

**Fix:** Add existence checks scoped to the company before saving.

---

### 19. Dashboard Targets Accessible to All Roles
**File:** `apps/api/src/routes/dashboard.ts:227`  
`GET /targets` returns team/company-wide targets without role restriction. Employees can see targets they shouldn't.

**Fix:** Add `requireAdmin()` or `requireManager()` middleware, or filter results by `req.userId`.

---

### 20. `pageUrl` in Support Tickets Not Validated
**File:** `apps/api/src/routes/support.ts`  
`pageUrl` field accepts any string. Should be validated as a URL.

**Fix:** Add URL format validation (e.g., `new URL(pageUrl)` wrapped in try/catch).

---

## Unprotected Routes Summary

| Route | Method | Auth | Notes |
|-------|--------|------|-------|
| `/auth/*` | POST | No | Intentional — public registration/login |
| `/checkout/plans` | GET | **No** | Should be authenticated |
| `/checkout/webhook` | POST | No (sig verified) | Correct — Stripe webhook |
| `/users/lookup` | GET | **Missing** | Endpoint doesn't exist |
| `/admin/*` | All | Yes | Superadmin only |
| `/support/*` | All | Yes | Auth + company member |
| `/automations/*` | All | Yes | Admin + company member |
| `/leads/*` | All | Yes | Auth required |
| `/deals/*` | All | Yes | Auth required |
| `/billing/` | PUT | Yes | **Missing companyId check** |

---

## Missing Input Validation Summary

| File | Endpoint | Issue |
|------|----------|-------|
| `auth.ts` | `/accept-invite` | No `inviteExpiresAt` check |
| `campaigns.ts` | POST/PUT | `ownerId`/`salesOwnerId` not verified in company |
| `admin.ts` | POST `/users` | No email format validation |
| `admin.ts` | PUT `/billing/:id` | No `amount > 0` validation |
| `support.ts` | POST | `pageUrl` not validated as URL |
| `targets.ts` | POST `/teams` | `managerId` not verified in company |
| `automations.ts` | PUT | `actionConfig` not schema-validated |

---

## Security Headers

**File:** `apps/api/src/app.ts`  
No security headers configured. Add `helmet` middleware:

```ts
import helmet from 'helmet';
app.use(helmet());
```

This sets: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, and a basic CSP.

---

## Action Checklist

### Immediate
- [x] Rate limit `/auth/login`, `/auth/password-reset/request`, `/auth/password-reset/confirm` — **DONE**
- [x] Analytics endpoints — already exist, false positive
- [x] `/users/lookup` — already exists, false positive
- [x] `PUT /billing/` companyId isolation — already enforced, false positive
- [x] JWT expiry `7d` → `24h` — **DONE**
- [x] `GET /checkout/plans` — added `authenticate` — **DONE**
- [ ] Add `managerId` existence check in team creation
- [ ] Add `helmet` middleware to `app.ts`

### High
- [ ] Reduce JWT expiry to 1h, implement refresh tokens
- [ ] Apply `validateActionConfig()` on automation updates
- [ ] Enforce seat limits for all users including superadmins
- [ ] Add `inviteExpiresAt > now` check in `/accept-invite`
- [ ] Add audit logging model and writes for sensitive operations
- [ ] Add timeouts to all external API calls

### Medium
- [ ] Validate email format on backend (all routes)
- [ ] Enforce pagination caps (max 50 items)
- [ ] Add role check on `GET /dashboard/targets`
- [ ] Validate `pageUrl` as URL in support tickets
- [ ] Validate campaign `ownerId`/`salesOwnerId` in company
- [ ] Fix support ticket assignee company membership check
- [ ] Replace `console.error` with structured logger
