# FlowRaze — Product Growth Audit & Direction

> Context brief for a coding session. Project = multi-tenant CRM/sales-ops SaaS (React + Express + Prisma + Postgres). Target = Indonesian SMB sales teams. Goal = real paying customers.

---

## 1. Verdict

FlowRaze is **strong engineering aimed at the wrong product shape for Indonesia.** Not slop in execution — at risk of being slop in *positioning*, which is just as fatal.

**Killer finding:** The CRMs that win in Indonesia (Mekari Qontak, Barantum) are **WhatsApp-first omnichannel platforms**, not sales-pipeline tools. Indonesian SMBs run sales *out of WhatsApp*, not a Kanban board. FlowRaze has leads, deals, pipelines, automations, billing, analytics — and **zero WhatsApp.** It's a Pipedrive clone in a WhatsApp-CRM market. That's the redundancy risk, and it's real.

**Fix is positioning, not a rewrite.**

---

## 2. Strategic Direction

- Cannot win "generic CRM" on features or price (Qontak ~Rp400k/user/mo; HubSpot/Zoho have free tiers).
- Win by being **sharper for one buyer** than a horizontal platform bothers to be.
- **Pick a vertical wedge** with considered, multi-touch deal cycles where a real pipeline + targets + team performance matter (where Qontak's chat-blast model is overkill):
  - B2B service agencies (digital / marketing / IT consultancies)
  - Property agents
  - Insurance / financial sales teams
- **The one feature that creates the wedge: WhatsApp lead capture + logging.** Without it, there is no reason to switch.

---

## 3. MVP — Cut, Don't Add

The project is **over-built**. Most of the "done" list is now a liability (more to maintain, nothing to differentiate).

**Keep (the spine):**
- Auth + onboarding
- Leads
- Deals + one pipeline
- Activities
- Revenue dashboard
- Team performance
- Targets
- Multi-tenant scoping
- CSV import/export

**Add (the ONE differentiator):**
- **WhatsApp lead capture + logging** — log WA conversations against a lead, click-to-WA from a lead card, basic templated follow-up. Even minimal is enough to stop being "just another CRM."

**Cut / hide for now (turn back on only when a customer asks):**
- API keys & webhooks
- Automations engine
- Multi-pipeline
- Advanced analytics (funnel / attribution / forecast / lead velocity)
- Superadmin platform tooling
- Self-service Midtrans billing

Rule: don't delete — just don't *lead* with them. Sell these manually until demand is proven.

---

## 4. How To Start (Go-To-Market)

1. **Talk to 5 real sales teams this week** in the chosen vertical. Don't demo — ask "show me how you track deals today" and watch them open WhatsApp. Confirm/kill the wedge before more code.
2. **Get 1 design partner** — free use in exchange for weekly feedback; onboard their real data by hand.
3. **No self-serve signup yet.** Marketing/pricing pages are premature. Sell 1-to-1, onboard manually, learn.
4. Only after ~3 companies use it weekly do you re-enable billing/automations/API as real selling points.

---

## 5. Monetization (match local reality)

- **Flat per-workspace pricing, NOT per-seat.** Undercut the model, not just price.
  - ~Rp300–500k/month for up to ~5 users
  - ~Rp800k–1.2jt/month for unlimited
  - "Add your whole team, one price" = real differentiator vs per-seat incumbents.
- **Annual upfront + discount.** SMBs prefer one yearly payment; fixes cash flow + churn.
- **Bank transfer / Virtual Account, not cards-only.** Midtrans already supports this — keep it.
- **Free trial, NOT free tier.** 14-day trial → human conversation. A permanent free tier trains non-payment.
- **Fix pricing copy first:** resolve the trial/plan-name mismatch (Performance vs Growth vs Pro) before any customer sees it. Sloppy pricing reads as an untrustworthy vendor.

---

## 6. Bottom Line

Engineering is genuinely strong and ahead of most solo projects. The *only* real risk is being a generic CRM in a WhatsApp-CRM market.

**Do this:** add a WhatsApp wedge → narrow to one vertical → sell manually to the first 3 customers → price flat-per-workspace with annual bank-transfer billing. That turns it into a real business.
