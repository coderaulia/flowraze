# Implementation Plan: Growth Pivot

**Last updated:** 2026-05-27

**Context:** This plan replaces the previous multi-tenant rework status document. The engineering foundation is solid — multi-tenant isolation, role model, billing, pipelines, analytics, and automations are all shipped. The risk is now **positioning**, not engineering. FlowRaze is a Pipedrive clone in a WhatsApp-CRM market. This plan pivots the product toward a sellable shape for Indonesian SMB sales teams.

**Source:** `flowraze-growth-audit.md` — product growth audit and strategic direction.

---

## 1. Strategic Summary

| Dimension | Current state | Target state |
| --- | --- | --- |
| Market position | Generic CRM (Pipedrive clone) | WhatsApp-first sales tool for B2B service teams |
| Vertical | None (horizontal) | B2B service agencies, property agents, insurance/financial sales |
| Pricing model | Per-seat (Rp 149k-299k/user/mo) | Flat per-workspace (Rp 300k/mo Starter, Rp 800k/mo Growth) |
| Differentiator | None vs Qontak/HubSpot/Zoho | WhatsApp lead capture + conversation logging + flat pricing |
| GTM | Self-serve signup + marketing pages | Manual 1-to-1 sales, design partner onboarding, no public signup yet |
| Trial model | Free tier + 14-day trial (broken semantics) | 14-day trial only, no permanent free tier |

---

## 2. Phases

### Phase 1: WhatsApp Lead Capture & Logging (THE differentiator)

**Goal:** Make FlowRaze the place where WhatsApp sales conversations live alongside deal data. Even minimal is enough to stop being "just another CRM."

**Priority:** P0 — nothing else matters until this ships.

#### 2.1.0 Current Delivery Scope: Link-Only MVP

**Status:** Implemented on 2026-05-24 while the WhatsApp gateway choice is pending.

- Use the existing lead phone number to open a direct `wa.me/{phone}` chat from the leads table.
- Normalize Indonesian mobile formats such as `0812...`, `812...`, and `+62 812...` before opening WhatsApp.
- Do not build provider account storage, tokens, inbound webhooks, conversation history, or in-app message sending until a gateway is selected.

#### 2.1.1 Data Model

**Deferred provider-backed design:** Add this only after a gateway is selected and conversation capture is approved:

```prisma
model WhatsAppAccount {
  id          String   @id @default(cuid())
  companyId   String
  phoneNumber String
  displayName String?
  provider    WAProvider @default(unofficial)
  apiToken    String?    // encrypted; for cloud API or Fonnte/Wablas token
  webhookSecret String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company       Company        @relation(fields: [companyId], references: [id])
  conversations Conversation[]

  @@unique([companyId, phoneNumber])
}

enum WAProvider {
  unofficial   // Fonnte, Wablas, or similar local provider
  cloud_api    // Meta Cloud API (future)
}

model Conversation {
  id              String   @id @default(cuid())
  companyId       String
  leadId          String?
  waAccountId     String
  remotePhone     String   // customer's WA number
  lastMessageAt   DateTime?
  status          ConversationStatus @default(open)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  company   Company          @relation(fields: [companyId], references: [id])
  lead      Lead?            @relation(fields: [leadId], references: [id])
  waAccount WhatsAppAccount  @relation(fields: [waAccountId], references: [id])
  messages  Message[]

  @@unique([companyId, remotePhone, waAccountId])
  @@index([companyId, leadId])
  @@index([companyId, lastMessageAt])
}

enum ConversationStatus {
  open
  closed
  archived
}

model Message {
  id             String      @id @default(cuid())
  conversationId String
  direction      MessageDirection
  content        String
  mediaUrl       String?
  mediaType      String?     // image, video, document, audio
  sentAt         DateTime    @default(now())
  deliveredAt    DateTime?
  readAt         DateTime?
  externalId     String?     // provider message ID for dedup

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, sentAt])
}

enum MessageDirection {
  inbound
  outbound
}
```

Also add relation to Lead:
```prisma
model Lead {
  // ... existing fields
  whatsappPhone   String?   // normalized WA number for click-to-chat
  conversations   Conversation[]
}
```

#### 2.1.2 API Routes

**Deferred provider-backed design:** New route file: `apps/api/src/routes/whatsapp.ts`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/whatsapp/accounts` | List company WA accounts |
| POST | `/api/whatsapp/accounts` | Connect a WA account (admin only) |
| PUT | `/api/whatsapp/accounts/:id` | Update account settings |
| DELETE | `/api/whatsapp/accounts/:id` | Disconnect account |
| GET | `/api/whatsapp/conversations` | List conversations (filterable by lead, status) |
| GET | `/api/whatsapp/conversations/:id` | Get conversation with messages |
| POST | `/api/whatsapp/conversations/:id/messages` | Send a message (outbound) |
| POST | `/api/whatsapp/conversations/:id/link` | Link conversation to a lead |
| POST | `/api/whatsapp/webhook` | Inbound webhook from WA provider (no auth, signature verified) |

New route file: `apps/api/src/routes/templates.ts`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/templates` | List message templates |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

#### 2.1.3 Provider Strategy

**Decision pending:** Do not implement a gateway yet. The current MVP uses direct `wa.me` links only; revisit this section after selecting Fonnte, Wablas, Meta Cloud API, or another approved provider.

Candidate options after the decision include **Fonnte** or **Wablas** (Indonesian WA gateway providers, ~Rp 100–200k/mo):
- Simple HTTP API for sending messages
- Webhook for receiving inbound messages
- No Meta Business verification needed (faster to market)
- Upgrade path to Meta Cloud API later for scale/compliance

Create `apps/api/src/utils/wa-provider.ts` with a provider abstraction:
```typescript
interface WAProvider {
  sendMessage(phone: string, content: string, mediaUrl?: string): Promise<{ externalId: string }>;
  verifyWebhook(headers: Record<string, string>, body: unknown): boolean;
  parseInbound(body: unknown): InboundMessage;
}
```

#### 2.1.4 Frontend

| Component | Location | Description |
| --- | --- | --- |
| WA Settings | `pages/company/settings` (new tab) | Connect/manage WA accounts |
| Conversation Panel | `pages/company/conversations.tsx` | Inbox-style conversation list |
| Chat View | `components/chat-view.tsx` | Message thread with send box |
| Lead WA Button | `pages/company/leads.tsx` | Implemented for link-only MVP: "WhatsApp" opens `wa.me/{normalizedPhone}` |
| Lead WA History | Lead detail page | Conversation history tab |
| Template Picker | Chat view | Quick-reply templates for follow-ups |

#### 2.1.5 Acceptance Criteria

- [ ] Admin can connect a WA number via Fonnte/Wablas token
- [ ] Inbound WA messages create/update conversations via webhook
- [ ] Conversations can be linked to existing leads (manual or auto-match by phone)
- [ ] Users can send outbound messages from the app
- [ ] Lead detail shows conversation history
- [x] Click-to-WA button on lead rows opens `wa.me/{normalizedPhone}` without a gateway dependency
- [ ] Message templates can be created and used for quick replies
- [ ] All WA data is tenant-scoped (companyId)

---

### Phase 2: Pricing Model Pivot (Flat Per-Workspace)

**Goal:** Switch from per-seat to flat-per-workspace pricing. Undercut the model, not just the price.

**Priority:** P1 — do alongside or immediately after Phase 1.

#### 2.2.1 New Pricing Structure

| Tier | Price | Users | Key value |
| --- | --- | --- | --- |
| Starter | Rp 300k/mo (Rp 3jt/yr) | Up to 5 users | Leads, deals, WA capture, basic dashboard |
| Growth | Rp 800k/mo (Rp 8jt/yr) | Unlimited users | + Campaigns, team performance, targets, analytics |
| Custom | Contact sales | Unlimited | + API, automations, webhooks, white-label |

Annual pricing = ~17% discount (round to clean numbers in IDR).

#### 2.2.2 Backend Changes

1. **Update `PlanTier` enum:**
   - Remove `free` tier (no permanent free plan)
   - Rename: `starter` (was free), `growth` (stays), `custom` (absorbs pro)
   - Implemented: canceled or expired accounts remain on their selected tier with inactive subscription status; there is no hidden free plan

2. **Update `PLAN_ENTITLEMENTS`:**
   ```typescript
   const PLAN_ENTITLEMENTS: Record<PlanTier, EntitlementConfig> = {
     starter: {
       seats: 5,
       analytics: false,
       apiKeys: 0,
       automation: false,
       campaigns: false,
       exports: true,
       pipelines: 1,
       targets: false,
       teamPerformance: false,
       webhooks: 0,
     },
     growth: {
       seats: null, // unlimited
       analytics: true,
       apiKeys: 0,
       automation: false,
       campaigns: true,
       exports: true,
       pipelines: 3,
       targets: true,
       teamPerformance: true,
       webhooks: 3,
     },
     custom: {
       seats: null,
       analytics: true,
       apiKeys: Infinity,
       automation: true,
       campaigns: true,
       exports: true,
       pipelines: Infinity,
       targets: true,
       teamPerformance: true,
       webhooks: Infinity,
     },
   };
   ```
   - The link-only `wa.me` action uses an existing lead phone number and requires no provider entitlement or connected-account limit.

3. **Update `BillingAccount` defaults:**
   - New workspaces start with 14-day trial on `growth` entitlements
   - After trial: must pick Starter or Growth (no free fallback)
   - Remove seat-count billing math from checkout; replace with flat amount lookup

4. **Update `calculateAmount()` in `payment-provider.ts`:**
   ```typescript
   const PLAN_PRICES = {
     starter: { monthly: 300_000, annual: 3_000_000, label: 'Starter' },
     growth:  { monthly: 800_000, annual: 8_000_000, label: 'Growth' },
   };
   // No more seats * price calculation
   ```

5. **Payment methods:** Keep Midtrans Snap (supports its configured VA/bank transfer methods). Annual billing = one payment upfront.

#### 2.2.3 Frontend Changes

1. **Rewrite `pricing.tsx`:**
   - Two plans + custom (not four)
   - Flat pricing, no "/user/mo"
   - "Add your whole team, one price" messaging
   - Annual toggle shows yearly total with discount
   - Remove "Starter free forever" — replace with "14-day Growth trial"

2. **Update FAQ:**
   - Remove per-seat explanation
   - Add "Why flat pricing?" answer
   - Fix payment method copy (VA/bank transfer are supported)

3. **Update subscription/checkout pages:**
   - Remove seat-count inputs
   - Show flat monthly/annual price
   - Continue to use Midtrans Snap for the payment method choices configured on the merchant account

#### 2.2.4 Acceptance Criteria

- [x] Pricing page shows 2 tiers + custom with flat pricing
- [x] Checkout calculates flat amount (no seat multiplication)
- [x] New signups get 14-day trial with Growth features
- [x] After trial expiry: workspace is locked until payment (no free tier)
- [x] Checkout continues through Midtrans Snap, which supplies merchant-enabled payment methods
- [x] Annual billing option uses an upfront discounted workspace payment

---

### Phase 3: Product Surface Simplification

**Goal:** Hide complexity that doesn't help close the first 3 customers. Don't delete — just don't lead with it.

**Priority:** P2 — can be done incrementally.

#### 2.3.1 Hide from Default Navigation

Move these behind a "Power features" or settings toggle, or simply remove from sidebar until a customer asks:

| Feature | Current location | Action |
| --- | --- | --- |
| API Keys | Settings tab | Hide from Starter plan entirely; show only on Custom |
| Webhooks | Settings tab | Hide from Starter; limit on Growth |
| Automations | Sidebar nav item | Hide from Starter/Growth; show only on Custom |
| Multi-pipeline | Pipeline settings | Starter gets 1 pipeline; Growth gets 3 |
| Advanced analytics | Sidebar nav item | Hide from Starter; show on Growth+ |
| Superadmin platform | `/admin/*` | Keep but don't expose in marketing |

#### 2.3.2 Simplify Onboarding

Current onboarding creates company + billing + admin. Add:

1. **Vertical selection step:** "What does your team sell?" → Agency services / Property / Insurance / Other
2. **WA connection prompt:** "Connect your WhatsApp to start capturing leads" (skip-able)
3. **Import existing leads:** CSV upload or manual entry of first 5 leads
4. **Skip everything else** — no pipeline config, no team setup, no billing until trial ends

#### 2.3.3 Hide Marketing Pages (Temporarily)

The marketing site is premature for manual sales. Options:
- Keep `/pricing` but update copy
- Remove or gate `/solutions`, `/blog`, `/careers`, `/resources` behind a feature flag
- Landing page should be a simple "Book a demo" + value prop, not a full marketing site

**Recommendation:** Keep landing + pricing + login. Hide the rest until there are 5+ paying customers.

**Status (2026-05-27):** `/solutions`, `/blog`, `/careers`, `/resources` now redirect to `/` (landing page). `/about`, `/help`, `/privacy`, `/terms` remain accessible. `/pricing` kept.

---

### Phase 4: Vertical Wedge — B2B Service Agency Focus

**Goal:** Make the product feel purpose-built for B2B service agencies (digital marketing, IT consulting, creative agencies).

**Priority:** P2 — do after Phase 1 ships and first design partner is onboarded.

#### 2.4.1 Lead Model Enhancements

The `Lead` model already has `serviceType` — leverage it:

- Pre-populate `source` dropdown with agency-relevant options: "Referral", "WhatsApp", "LinkedIn", "Website form", "Event"
- Pre-populate `serviceType` with: "Web Development", "Digital Marketing", "SEO", "Branding", "IT Consulting", "Custom Software"
- Add `estimatedBudget` field (optional, for proposal-stage qualification)
- Add `projectTimeline` field (optional, "1-2 weeks", "1 month", "3+ months")

#### 2.4.2 Deal → Project Mapping

For agencies, a "deal" is really a "project proposal." Adjust language:

- UI label: "Deals" → "Projects" (or make configurable per workspace)
- Pipeline stages for agencies: "Inquiry" → "Discovery" → "Proposal Sent" → "Negotiation" → "Won" → "Lost"
- Default pipeline created during onboarding based on vertical selection

#### 2.4.3 Agency-Specific Dashboard Widgets

- **Proposal pipeline value:** Total value of deals in proposal/negotiation stages
- **Average deal cycle:** Days from lead creation to deal won
- **Revenue by service type:** Breakdown by `serviceType`
- **Client retention:** Repeat leads/deals from same company

#### 2.4.4 Acceptance Criteria

- [ ] Onboarding asks vertical and pre-configures pipeline stages
- [x] Lead form has agency-relevant source/serviceType defaults (fallback defaults when DB empty: Referral, WhatsApp, LinkedIn, Website form, Event; Web Development, Digital Marketing, SEO, Branding, IT Consulting, Custom Software)
- [x] Dashboard shows agency-relevant metrics (proposal pipeline value, avg deal cycle days, repeat client count, revenue by service type chart)
- [x] UI language can be "Projects" instead of "Deals" (workspace setting in Settings > Workspace; propagates to nav and Deals page header)

---

### Phase 5: Go-To-Market Execution

**Goal:** Get the first 3 paying customers through manual sales.

**Priority:** P1 (parallel with Phase 1 engineering).

#### 2.5.1 Customer Discovery (Week 1)

- Talk to 5 real sales teams in B2B service agencies
- Don't demo — ask "show me how you track deals today"
- Watch them open WhatsApp, spreadsheets, Notion
- Confirm/kill the vertical wedge before more code

#### 2.5.2 Design Partner (Week 2-3)

- Get 1 agency to use FlowRaze for free in exchange for weekly feedback
- Onboard their real data by hand (import leads, set up pipeline)
- Connect their WhatsApp number
- Weekly 30-min call: "What's working? What's missing?"

#### 2.5.3 First 3 Customers (Week 4-8)

- Sell 1-to-1 via WhatsApp/LinkedIn outreach to agency owners
- Offer: "Rp 300k/month, add your whole team, I'll set everything up for you"
- Manual onboarding for each customer
- Only after 3 companies use it weekly → re-enable self-serve billing

#### 2.5.4 Success Metrics

| Metric | Target | Timeframe |
| --- | --- | --- |
| Design partner onboarded | 1 | Week 2 |
| Weekly active users (design partner) | 3+ | Week 3 |
| Paying customers | 3 | Week 8 |
| Monthly recurring revenue | Rp 900k–2.4jt | Week 8 |
| WhatsApp messages logged/week | 50+ per customer | Week 4+ |

---

## 3. What NOT To Build (Yet)

These features exist in the codebase but should NOT be prioritized, marketed, or expanded until customer demand proves them:

| Feature | Status | Revisit when |
| --- | --- | --- |
| Automations engine | Built, hide from Starter/Growth | A customer asks for it |
| Multi-pipeline | Built, limit to Growth (3) | A customer needs >1 pipeline |
| Advanced analytics (funnel/attribution/forecast) | Built, Growth+ only | A customer asks for attribution |
| API keys & webhooks | Built, Custom only | A customer needs API access |
| Superadmin platform | Built, internal use only | Managing 10+ companies |
| Self-service Midtrans billing | Built, works | After 3 manual customers |
| Marketing pages (blog/careers/resources) | Built, premature | After product-market fit |
| White-label / custom domains | Not built | Enterprise customer requests it |
| SSO / SAML | Not built | Enterprise customer requests it |
| Native mobile app | Not built | After PMF, if mobile usage is high |
| Multi-touch attribution | Not built | After single-touch proves useful |
| Custom roles | Not built | After 10+ seat teams need granularity |

---

## 4. Customer-Facing Debt Status (Resolved 2026-05-24)

| Priority | Issue | Status |
| --- | --- | --- |
| HIGH | Trial semantics mismatch | Resolved: new workspaces receive Growth entitlements under `trialing`; expired or canceled access does not fall back to a permanent free tier. |
| HIGH | Pricing copy drift | Resolved: pricing and checkout use flat workspace pricing; FAQ describes Midtrans VA/bank-transfer capability. |
| HIGH | Plan tier naming | Resolved: active product tiers are Starter, Growth, and Custom, with a database enum migration from legacy tiers. |
| MEDIUM | Stale webhook event coverage | Resolved: customer webhook types and event selector expose `lead_updated`, `deal_stage_changed`, and `deal_lost`. |
| MEDIUM | Database indexes for new models | Deferred by scope: no WA account/conversation/message models are created for the current `wa.me` implementation; add indexes with the selected gateway schema. |
| LOW | Shared types drift | Resolved: shared automation action and event types are aligned to the implemented Prisma/backend surface. |

---

## 5. Implementation Timeline

| Week | Phase | Deliverable |
| --- | --- | --- |
| Pending gateway decision | Phase 1 (backend) | Deferred: Prisma models, provider abstraction, webhook endpoint, conversation/message CRUD |
| 1 | Phase 5.1 | Talk to 5 agency sales teams |
| 1 | Phase 1 (frontend) | Delivered: lead `wa.me` button. Deferred: conversation inbox, chat view, template picker |
| Delivered 2026-05-24 | Phase 2 (backend) | Flat pricing logic, Growth trial defaults, plan migration, and checkout changes |
| Delivered 2026-05-24 | Phase 2 (frontend) | Flat pricing page, updated checkout/subscription UI, and consistent tier copy |
| 3 | Phase 3 | Hide features from nav, simplify onboarding |
| 3 | Phase 5.2 | Onboard design partner |
| 4 | Phase 4 | Vertical customization (agency defaults, pipeline presets) |
| 4-8 | Phase 5.3 | Manual sales, iterate based on feedback |

---

## 6. Success Definition

FlowRaze is "sellable" when:

1. **A real agency team uses it daily** to track leads and log WhatsApp conversations
2. **3 companies pay Rp 300k+/month** without requiring constant hand-holding
3. **WhatsApp is the entry point** — leads come in via WA, conversations are logged, follow-ups are sent from the app
4. **The product feels purpose-built** for the vertical, not like a generic CRM with a WA plugin bolted on

---

## 7. Architecture Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| WA provider | Pending decision; `wa.me` links only for current MVP | Ships contact flow without storing credentials or committing to a provider prematurely |
| Pricing model | Flat per-workspace | Undercuts per-seat incumbents, simpler to explain, removes friction for adding team members |
| Free tier | Remove (14-day trial only) | Free tier trains non-payment; trial creates urgency |
| Feature gating | Hide, don't delete | Existing code stays; just remove from nav/marketing until demand proves it |
| Vertical | B2B service agencies first | Considered deal cycles, team-based selling, WhatsApp-heavy, budget for tools |
| GTM | Manual sales first | Validate before scaling; learn what matters before building self-serve |

---

## 8. Migration Notes (From Current State)

### Database Migration

1. Defer `WhatsAppAccount`, `Conversation`, and `Message` models until the gateway is selected
2. Use existing `Lead.phone` for `wa.me` links; add a dedicated normalized WA field only if gateway matching requires it
3. Keep link-only WhatsApp available from the lead phone action without provider-specific entitlement fields
4. Apply the included plan-tier migration mapping legacy `free` to `starter` and `pro` to `custom`

### Existing Customer Data

- No real customers yet → migration is safe
- Seed data is updated to reflect the Starter, Growth, and Custom tiers
- Demo WhatsApp conversations remain deferred until a gateway-backed conversation model is selected

### Environment Variables (After Gateway Selection)

```env
# Deferred: only required after a provider is approved
WA_PROVIDER=fonnte
WA_API_TOKEN=your-fonnte-token
WA_WEBHOOK_SECRET=your-webhook-verify-token
```

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| WA provider instability (unofficial API) | Medium | High | Abstract provider; have fallback to manual logging; upgrade to Cloud API when ready |
| No agency wants to pay Rp 300k/mo | Medium | High | Validate in Week 1 discovery; adjust price or vertical if needed |
| WhatsApp ToS enforcement on unofficial providers | Low | High | Build with Cloud API upgrade path; don't store messages that violate ToS |
| Over-engineering WA before validating demand | Medium | Medium | Ship link-only contact first; choose provider features after design partner feedback |
| Existing code complexity slows iteration | Low | Medium | Don't refactor what works; add new features alongside existing code |

---

## 10. Previous Implementation Status (Archived)

The multi-tenant rework documented in the previous version of this file is **complete**. All items marked "Done" in the old plan remain done. This new plan builds on that foundation rather than replacing it.

Key completed foundations this plan depends on:
- ✅ Multi-tenant data isolation with companyId scoping
- ✅ Four-role model (superadmin, admin, manager, employee)
- ✅ JWT + API key authentication
- ✅ Midtrans payment integration
- ✅ Pipeline and deal management
- ✅ Lead CRUD with import/export
- ✅ Dashboard and analytics
- ✅ Team performance and targets
- ✅ Automation engine
- ✅ Webhook infrastructure
- ✅ Support ticket system
- ✅ Comprehensive test suite (80 tests)
