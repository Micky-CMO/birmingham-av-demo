# Overnight sprint — final wrap

*Last updated: 2026-04-19 03:40 BST · Consolidation complete, pushed to origin*

## TL;DR

Everything landed. **45+ feature commits pushed to `origin/main`** → Vercel auto-deploy. The 66-artefact inventory is complete for 52 of 66 (P0 through P3 AV Care); 14 remain in the briefing (P4 Commerce, P5 Inventory, P6 Email templates) for a future batch. Typecheck clean. Build clean. Real product data landing from eBay ingest.

## What's shipped

### Claude Web artefact batches (designed + ported)

| Batch | Artefacts | Scope | Status |
|---|---|---|---|
| 1 | 1-5 | Shell, homepage, shop, category, product | Ported (prior session) |
| 2 | 6-8 | Cart drawer, cart page, checkout | Ported (Agent A) |
| 3 | 9-12 | Order confirmed, builders roster, builder profile, sign in | Ported (Agent B) |
| 4 | 13-20 | 8 account pages + AccountShell extraction | Ported (Agent D) |
| 5 | 21-28 | Help index, help article, support hub, chat widget, editorial template, legal template, 404, error | Ported (Agent F) |
| 6 | 29-36 | Cookie banner, register, forgot/reset, empty states, skeletons, admin login/dashboard/builders | Ported (Agent I + me for cookie) |
| 7 | 37-46 | Admin block (builder slide-over, orders, order detail, returns, support inbox, products, settings, builder portal, QR scan, reports) | Ported (Agent G) |
| 8 | 47-52 | AV Care P3 (marketing, tier card, subscribe, account, claim new, claim detail) | Ported (Agent H) |
| remaining | 53-66 | P4 commerce (search, reviews, journal index, VAT invoice), P5 inventory (6 artefacts), P6 email templates (4 artefacts) | Designed in briefing — not yet produced by Claude Web |

### Claude Code (me) — backend + infrastructure

- ✅ **Briefing updated to v0.3.0** — `CLAUDE-WEB-BRIEFING.md` with Section 13 (reusable fenced templates), Section 14 (SEO conventions), P4/P5/P6 artefact blocks, Prisma shapes for all new models.
- ✅ **Hamzah checklist** — `HAMZAH-CHECKLIST.md` with step-by-step for Stripe KYC, Resend DNS, Royal Mail API, HMRC MTD, lawyer brief, photography, domain, analytics. **Forward to Hamzah now — those clocks need to start.**
- ✅ **Prisma schemas** — AV Care + Inventory + Review enhancements added to `packages/db/prisma/schema.prisma`. `prisma db push` ran successfully; new tables live in Neon dev DB.
- ✅ **Transactional emails** — 7 templates (Welcome, PasswordReset, OrderConfirmation, Dispatched, Delivered, ReturnAuthorised, RefundIssued) plus shared `EmailShell` + `OrderReceipt` primitives + `bavEmail` typed send facade. Wired into event dispatcher so `bav.orders.paid / shipped / delivered` events auto-fire the right email. Graceful noop fallback when `RESEND_API_KEY` absent.
- ✅ **Search backend** — `lib/services/search.ts` with Postgres on-the-fly `to_tsvector` across products + builders. `/search` page live. No extra infra (Meilisearch etc.) needed yet.
- ✅ **SEO foundation** — JSON-LD components (ProductSchema, OrganizationSchema, BreadcrumbSchema, FAQSchema), dynamic `sitemap.xml` and `robots.txt`, keyword-rich metadata helpers with `CATEGORY_KEYWORDS` map for all 14 categories. Wired into homepage, shop, category, product pages.
- ✅ **Logo** — knocked out white background; renders on paper as intended.
- ✅ **Real product ingest** — `pnpm ingest:public` scraping `midlandsav` eBay store: 712 products collected. Upsert still in progress (~290/712 when last checked). Real titles + prices + photos landing.
- ✅ **All 45+ commits pushed to `origin/main`** → Vercel picks them up automatically.

### Infrastructure decisions taken (under your "go defaults" authority)

- **Search**: Postgres FTS (free, fast enough for the current catalogue size).
- **Analytics**: Plausible (pending DNS; £9/mo).
- **Journal CMS**: MDX files in `content/journal/` (pending when we have copy).
- **Rate limiting**: Upstash Redis (already in stack).
- **Email provider**: Resend (already installed). Sender falls back to `@resend.dev` until Hamzah verifies the domain.
- **Stripe**: test mode wiring in place. Live keys swap in when Hamzah's KYC clears.
- **Product images**: №buildNumber placeholder as fallback; eBay ingest supplies real photos where available; launch-quality studio photography deferred to Hamzah's photographer.

## Known TODOs remaining (non-blocking for demo / launch prep)

These are flagged for the next sprint, not emergencies:

- **Stripe Checkout Session creation** for AV Care subscribe and one-off payment — currently returns `{ checkoutUrl: null }` with a TODO, UI shows "coming soon". Unblocks when Stripe live KYC clears.
- **Pay-excess Stripe PaymentIntent** route for AV Care claim flow.
- **Photo upload to blob storage** on claim submission — currently captures filenames only.
- **Claim message reply** endpoint — `ReplySection` UI acknowledges locally only.
- **AV Care plan-switch** endpoint.
- **Google OAuth** start route — returns 501 stub.
- **Password reset** — route validates shape; real signed-token rotation is a TODO.
- **Admin dashboard range toggle** — visual only; wires into KPI endpoint when it accepts a range param.
- **Product reviews** (artefact 60) — design exists in briefing but not yet produced by Claude Web; DB schema in place (`photoUrls`, `verifiedPurchase`, `adminStatus`). Build when Claude Web ships it.
- **P5 Inventory** (6 artefacts 53-58) — designed in briefing, Claude Web hasn't produced. Prisma schema is already in place; services stubs exist at `lib/services/inventory.ts`.
- **P6 Email templates** (4 shared artefacts 63-66) — I built 7 concrete emails already using `@react-email/components` without waiting for the design artefacts; Claude Web's template artefacts can be folded in later if the design needs tightening.

## What you need to do when you wake

1. **Forward `HAMZAH-CHECKLIST.md` to Hamzah.** The Stripe KYC + Resend DNS clocks start as soon as he begins — don't leave this waiting.
2. **Check `birmingham-av.vercel.app`** — the latest Vercel deploy should be live. Expected behavior:
   - Homepage, shop, category, product, cart, checkout flow works with test Stripe cards (once STRIPE_SECRET_KEY is in env)
   - Account section (dashboard, orders, returns, addresses, security, notifications, AV Care) with shared AccountShell
   - AV Care marketing + subscribe + claim flow (UI only; subscribe CTA returns "coming soon" until Stripe KYC)
   - Help centre, support hub + chat widget, 404, error pages
   - Admin dashboard + builders + orders + returns + support + products + settings + builder portal + QR scan + reports
   - `/search` global search across products + builders
   - Cookie consent bottom-sheet shows on first visit, persists in localStorage
3. **Run `pnpm dev` locally** to verify everything renders as expected. I left the dev server running in the background.
4. **eBay ingest**: let it finish. Then decide: wipe the 213 seed demo products, or keep both (live real + demo seed). My recommendation: wipe seeds, keep real.
5. **Product reviews + P5 Inventory + P6 Emails**: decide when to push Claude Web to produce those final 14 artefacts. None block today's demo.

## Vercel deploy verification

Once the push completes its build:
- https://birmingham-av.vercel.app — homepage with Fraunces "Computers, *considered*."
- https://birmingham-av.vercel.app/shop — catalogue with real + demo products
- https://birmingham-av.vercel.app/product/[any-real-slug] — product detail with ProductSchema JSON-LD
- https://birmingham-av.vercel.app/av-care — AV Care marketing with tier cards
- https://birmingham-av.vercel.app/account — dashboard with AV Care tile
- https://birmingham-av.vercel.app/admin/dashboard — admin KPIs (auth-gated)
- https://birmingham-av.vercel.app/search?q=laptop — search results
- https://birmingham-av.vercel.app/sitemap.xml — generated sitemap
- https://birmingham-av.vercel.app/robots.txt — robots rules

## Environment variables still missing (your env-var setup job on Vercel)

These are flagged in the Hamzah checklist. Until set, the code runs in dev mode with noop fallbacks — no crashes, no real sends.

- `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `RESEND_REPLY_TO`
- `NEXT_PUBLIC_VAT_NUMBER` (for Organization schema + VAT invoices)
- `ROYAL_MAIL_API_KEY` + `ROYAL_MAIL_ACCOUNT_NUMBER` (when contract clears)
- `HMRC_CLIENT_ID` + `HMRC_CLIENT_SECRET` + `HMRC_SERVER_TOKEN` (when developer app approved)
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (for analytics)

---

*Sprint complete. Handing back.*
