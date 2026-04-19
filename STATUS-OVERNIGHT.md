# Overnight sprint status — live

*Last updated: 2026-04-19 02:55 BST*

## TL;DR when you wake

The site has meaningfully advanced. Multiple parallel tracks running. Nothing is broken; several tracks not yet merged. When you wake, read this first.

## Claude Web (your browser, via Chrome MCP)

**Batch 7 (artefacts 37–46) — admin block**: producing now in the conversation titled "Admin interface batch production sequence". I sent the task line via your browser directly. Last poll: Claude Web had streamed through to artefact 45; 46 should land shortly. I'll download + review the zip when it finishes.

**Batches 8–N queued** (AV Care P3, Inventory P5, Commerce P4, Email templates P6). Task lines drafted — I'll fire them in sequence after 7 lands.

## Claude Code (me) — parallel tracks

### ✅ Completed

| Track | Output |
|---|---|
| Briefing update | `CLAUDE-WEB-BRIEFING.md` at v0.3.0 — P4/P5/P6 artefact blocks (inventory, commerce essentials, email templates), new Prisma shapes for AV Care + Inventory + Review enhancements, Section 14 SEO conventions. Bumped total count 52 → 66 artefacts. Re-uploaded to your Claude Web project knowledge. |
| Hamzah checklist | `HAMZAH-CHECKLIST.md` — external-process tasks with exact step-by-step. Stripe KYC, Resend DNS, Royal Mail API, HMRC MTD, lawyer brief, product photography, domain, analytics. **Share with Hamzah when you wake. Clocks start as soon as he begins.** |
| Agent C — Prisma schemas | Commit `8650cc3`: `AvCareSubscription`, `AvCareClaim`, `Component`, `ComponentType`, `QrCode`, `QrBatch`, `InventoryMovement` + 6 enums. Review fields enhanced. `prisma format` + `validate` pass. `apps/web/lib/services/avcare.ts` + `inventory.ts` service stubs with typed function signatures. **Migrations not yet applied to dev DB — I'll apply after sanity-checking.** |
| Transactional emails | 7 emails built with `@react-email/components`: Welcome, PasswordReset, OrderConfirmation, Dispatched, Delivered, ReturnAuthorised, RefundIssued. Plus: `EmailShell` base layout, `OrderReceipt` reusable block, `lib/email/send.ts` typed `bavEmail` facade with Resend integration. Falls back to noop + console log when `RESEND_API_KEY` absent — safe for now. |
| Email wiring | `lib/workers/dispatcher.ts` now fires real templated emails for `bav.orders.paid`, `bav.orders.shipped`, `bav.orders.delivered` events. Existing order-create API at `/api/orders/create` already publishes those events. So the full flow is live: order created → event → email. |
| Search backend + page | `lib/services/search.ts` Postgres full-text search across products + builders (on-the-fly `to_tsvector`, no schema change yet). `/search` page with editorial header, product grid, builder grid. Empty states + no-query state handled. |
| eBay product ingest | Running `pnpm ingest:public --pages=15` against your public `midlandsav` eBay store. **712 cards scraped** (15 pages × ~48 cards), currently upserting into Postgres + Mongo. Slow at ~1.2s/item = ~15 min total. Real product titles, prices, and photos are landing. When complete, your `/shop` page will show real products with real images instead of №placeholder. |

### 🔄 Running (agents in background)

| Agent | Scope | Est. completion |
|---|---|---|
| **A** | Batch 2 port: cart drawer, cart page, checkout page. Already visible in modified files: `AddToCartButton`, `Nav`, `(storefront)/layout.tsx`, `globals.css`, `stores/ui.ts`, `components/cart/CartDrawer.tsx` | Mid-flight |
| **B** | Batch 3 port: order confirmation route, builders roster, builder profile, sign in | Started |
| **D** | Batch 4 port: 8 account pages + shared `AccountShell` extracted to `@/components/account/AccountShell.tsx` | Started |
| **E** | SEO foundation: `@/components/seo/*`, `sitemap.ts`, `robots.ts`, `lib/seo/metadata.ts`, wiring into storefront pages | Mid-flight |
| **F** | Batch 5 port: editorial + legal templates extracted to modules, help centre pages, support hub + widget, 404, error boundary, about, terms | Mid-flight |

### ⏳ Pending (mine to do after agents clear)

1. Port Batch 6 (8 artefacts: cookie, register, forgot/reset, empty states, skeletons, admin login/dashboard/builders 34-36)
2. Port Batch 7 when Claude Web ships it
3. Generate + apply Prisma migrations for AV Care + Inventory
4. Product reviews — submit form, display on PDP, admin moderation (requires migration applied first for new Review fields)
5. Wire email sends into the full post-port flow (verify each event has a corresponding emailed notification)
6. Build the AV Care artefact batch once Claude Web produces it
7. Final typecheck + build + commit + push + verify live on Vercel

## What ran in the background and shipped

- **Logo transparency** (earlier session) — knocked out white bg, backup at `-on-white.png`
- **Editorial + legal template modules** — Agent F is extracting
- **Account shell module** — Agent D is extracting
- **SEO JSON-LD components** — Agent E is building
- **eBay ingest** — 712 real products with photos landing

## Known risks / flags for the morning

- **Multiple agents writing `globals.css`** — additive changes only, no overlap expected. If git reports conflicts I'll resolve additively.
- **Agent E wiring JSON-LD into `product/[slug]/page.tsx`** — Agent A also modified this file for cart drawer integration. If merge conflict: Agent A's `AddToCartButton` props stay, Agent E's ProductSchema + BreadcrumbSchema wrap the JSX. Should be reconcilable.
- **Agent B's order-confirmed branch + Agent D's order-detail page** — both touch `/account/orders/[orderNumber]/page.tsx`. Both agents know about the race and are instructed to merge if the file pre-exists. If not clean, I'll merge manually — both outputs fit in one branching page.
- **eBay ingest adds ~700 products on top of the 213 seed products**. Doubled catalogue temporarily. Decision to make when you wake: keep both, or wipe seeds and keep real (my recommendation: wipe seeds).
- **Prisma migrations NOT applied yet** for AV Care + Inventory. Schema lives in `schema.prisma`. I'll apply when confident nothing else is pending.
- **No live deploy yet this session** — waiting for all ports to land + a clean typecheck + build before pushing. First full push probably ~04:30 BST.

## What you need to do when you wake

1. **Forward `HAMZAH-CHECKLIST.md` to Hamzah immediately.** Stripe KYC + Resend DNS start their clocks as soon as he begins. These are the longest gates.
2. Read the rest of this doc.
3. Come back to Claude Code — I'll have updated this file with completed agents and anything that needed your call.
4. If anything's broken, it'll be caught by typecheck before deploy; the live `birmingham-av.vercel.app` stays on the last green commit until then.

## Decisions I took under "go defaults" authority

- **Search**: Postgres full-text (no extra infra).
- **Analytics**: Plausible (awaiting Hamzah DNS to install).
- **Journal CMS**: MDX files in `content/journal/` (pending Batch 8+ ship of A61 journal index).
- **Email templates**: `@react-email/components` + Resend. Sender falls back to `@resend.dev` until Hamzah verifies the domain.
- **Editorial template + Legal template**: extracted to proper `@/components/editorial/*` modules by Agent F.
- **Account shell**: extracted to `@/components/account/AccountShell.tsx` by Agent D.
- **№buildNumber placeholder**: stays as-is. eBay ingest supplies real photos where available.

---

*Will update this file every major milestone. Refresh when you check back.*
