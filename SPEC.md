# BIRMINGHAM AV ENTERPRISE MARKETPLACE
## Master Build Specification for Claude Code

You are about to build a complete, production-ready enterprise ecommerce marketplace for **Birmingham AV** (BAV), a UK refurbished-PC retailer currently turning over £40M+ annually on eBay with 82K items sold, 98.4% positive feedback, and 13K followers. They have 20+ PC builders who each assemble units that need to be permanently tracked to their maker. You will replace their eBay dependency with a bespoke, custom, glass-morphism-forward ecommerce platform that looks and feels like it cost £500M to build.

**The only thing you should leave unwired is the final Stripe and PayPal API key insertion. Everything else ships live.**

Read this entire document before writing a single line of code. Do not skim. Every section matters.

---

## 1. MISSION

Build, end to end, a bespoke B2C marketplace at `birmingham-av.com` that replicates every useful eBay/Amazon feature (Product discovery, Cart, Checkout, Returns, Disputes, Live chat support, Order tracking, Reviews), then surpasses them through:

- Glass-morphism UI with Framer Motion physics-based micro-interactions
- Real-time inventory and build-queue sync via WebSocket
- AI-first customer support with Telegram escalation to the owner
- Builder-level RMA and ROI analytics, AI-flagged for anomalies
- White-first default theme with a dark-mode toggle in the header

This is not a template. This is not a Shopify store. Every pixel is bespoke. Every endpoint is wired. The UX must feel like a £500M engineering effort—considered motion, confident typography, and zero visible stitching between systems.

---

## 2. BRAND IDENTITY (DERIVED FROM THE OFFICIAL LOGO)

The official logo is a geometric "AV" monogram in kelly green and black, paired with the "BIRMINGHAM" wordmark in bold black. Use it as the single source of truth for colour and tone.

### Primary palette (locked)

```
Brand Green  #1EB53A   rgb(30, 181, 58)    Primary CTA, accent marks, live status
Brand Black  #0A0A0A   rgb(10, 10, 10)     Wordmark, body text, dark surfaces
Pure White   #FFFFFF   rgb(255,255,255)    Light mode canvas
```

### Extended palette (derived, for UI semantics)

```
Ink 900      #0A0A0A   Headlines (light mode)
Ink 700      #2B2E35   Body copy (light mode)
Ink 500      #6B7280   Captions, muted
Ink 300      #D4D4D8   Dividers
Canvas 50    #F9FAFB   Subtle surface (light mode)
Canvas 100   #F3F4F6   Cards (light mode)
Obsidian 950 #050505   Absolute black page (dark mode)
Obsidian 900 #0B0D12   Default card (dark mode)
Obsidian 800 #11141B   Raised card (dark mode)
Obsidian 700 #181C25   Hover (dark mode)
Line Dark    #222833   Borders (dark mode)
Green 600    #16A432   Hover state for CTAs
Green 400    #4CD265   Subtle highlights
Green 100    #E5F7EA   Positive chip backgrounds
Amber 500    #F0B849   Caution (RMA watch)
Ruby 500     #FF4D5E   Critical (RMA alert, error)
Steel 500    #4F91FF   Data/info accent
```

### Typography

```
Display:  Inter Display, 600–700, tight tracking (-0.025em on headlines)
Body:     Inter, 400–500
Mono:     JetBrains Mono (for SKUs, serials, data)
Fallback: system-ui, sans-serif
```

Inter is available from Google Fonts, self-host via `next/font`.

### Logo usage

- Place `logo.svg` at `/public/brand/logo.svg` and `/public/brand/logo-dark.svg` (recolour the wordmark to white/#F9FAFB for dark mode; keep the green "A" as-is in both modes).
- Minimum height 24px on mobile, 32px on desktop. Never recolour the green mark.
- Derive a favicon (32x32 + SVG + Apple touch 180x180) from the AV monogram only.

### Voice

Direct, confident, technically fluent. No emoji, no "journey", no "next-generation". Copy reads like a specialist shop that knows what they are doing. Examples:

- Hero: *Refurbished PCs, built by people who know them.*
- Sub: *Tested, warrantied, and shipped from Birmingham.*
- CTA: *Shop PCs* / *Browse bundles*

---

## 3. ASSET AND CATALOG INGESTION (FIRST CUT, BEFORE BUILD)

Before scaffolding the app, run a one-shot ingestion against the live BAV eBay store. This is step zero.

### 3.1 Source URLs

```
https://www.ebay.co.uk/str/birminghamav
https://www.ebay.com/str/birminghamav
```

Categories to enumerate (all present on the live store):
- All In One Pc
- Computers
- Gaming PC Bundles
- Laptops
- Monitors
- Projectors
- Projector Lenses
- Printers
- AV Switches
- Parts
- Hard Drive
- Power Supply / Chargers
- Network Equipment
- Other

### 3.2 Ingestion script

Create `scripts/ingest-ebay.ts`. It must:

1. Accept an env-driven strategy selector: `INGEST_PROVIDER=ebay_api | apify | serpapi | direct_html`.
2. Default to the official **eBay Browse API** (`/buy/browse/v1/item_summary/search` with `?seller_username=birminghamav`). Fall back to Apify's eBay Product Scraper or SerpApi if the Browse API is not credentialed.
3. For every listing, capture: `ebay_listing_id`, `title`, `subtitle`, `condition`, `price_gbp`, `currency`, `images[]` (all full-resolution), `category_path`, `item_specifics` (CPU, GPU, RAM, Storage, OS, Screen Size, Brand, Model), `description_html`, `seller_notes`, `shipping_gbp`, `return_policy`, `stock_qty` (1 if fixed-price and available).
4. Download all images to S3 (or `/public/product-images/{sku}/{n}.jpg` in dev) and rewrite URLs.
5. Write to `prisma.product.upsert` keyed on `ebay_listing_id`. Write the rich spec blob to MongoDB `product_catalog` keyed on `postgresProductId`.
6. Auto-map to an internal category by matching the eBay category path against a seeded `product_categories` table.
7. Generate a URL-safe `slug` from the title.
8. Assign a provisional `builder_id` using a round-robin placeholder until staff map them manually.
9. Log the whole run to `logs/ingest-{timestamp}.json` including any listings that failed to import.

Rate limit: 2 requests/second. Retry with exponential backoff. Idempotent: re-running the script must update existing products, not duplicate them.

### 3.3 Logo and branding ingestion

Fetch the current store banner from the eBay store page header and save for reference at `/public/brand/reference/`. The real logo is at `/public/brand/logo.svg` (provided; do not scrape it from eBay).

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Monorepo (Turborepo)

```
bav/
├── apps/
│   ├── web/               Next.js 14 (App Router) — customer storefront + admin
│   └── mobile/            React Native (Fabric) — builder scan-in app
├── packages/
│   ├── ui/                Shared components (Tailwind + NativeWind)
│   ├── lib/               Shared business logic, hooks, validation
│   ├── db/                Prisma client + Mongoose models
│   └── ai/                Anthropic Claude client, prompts, escalation logic
├── scripts/               ingest-ebay.ts, seed.ts, migrate.ts
├── infra/                 terraform for AWS EKS, EventBridge, Aurora, DocumentDB
└── docker-compose.yml     local dev: Postgres, Mongo, Redis, LocalStack
```

### 4.2 Stack (non-negotiable)

| Layer | Choice |
|---|---|
| Language | TypeScript strict everywhere (`"strict": true`) |
| Web framework | Next.js 14 App Router, Server Components by default |
| Data fetching | TanStack Query v5 for client mutations and polling |
| State | Zustand for local UI state; server state lives in TanStack Query |
| Styling | Tailwind CSS only. `className` is the one styling surface. No styled-components, no CSS modules |
| Animation (web) | Framer Motion (`motion`) + CSS `@starting-style` for view transitions |
| Mobile | React Native Fabric/JSI. NativeWind v4. Reanimated for animations |
| ORM | Prisma for Postgres |
| Documents | Mongoose for MongoDB |
| Auth | NextAuth with credentials + Google OAuth, bcrypt, JWT sessions |
| Payments | Stripe (primary) + PayPal (secondary). Scaffolding only; keys go in env |
| Search | Postgres `pg_trgm` + GIN for v1. Meilisearch hook stubbed for v2 |
| Realtime | WebSocket (`ws`) on a dedicated `/api/ws` Node runtime route |
| Queue | BullMQ on Redis for build dispatch, ingestion jobs, email sends |
| AI | Anthropic Claude via `@anthropic-ai/sdk` (`claude-opus-4-7` for support, `claude-sonnet-4-6` for RMA analysis) |
| Notifications | Resend for transactional email, `node-telegram-bot-api` for owner alerts |
| Infra | AWS EKS on Graviton, Aurora Postgres, DocumentDB, EventBridge, S3, CloudFront |
| Observability | OpenTelemetry, Sentry, CloudWatch |

### 4.3 Folder conventions (Next.js app)

```
apps/web/
├── app/
│   ├── (storefront)/           Public routes, shared layout with header/footer
│   │   ├── page.tsx            Home
│   │   ├── shop/
│   │   │   ├── page.tsx        Catalog (all products)
│   │   │   └── [slug]/page.tsx Category
│   │   ├── product/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── orders/[orderNumber]/page.tsx
│   │   ├── returns/new/page.tsx
│   │   └── account/page.tsx
│   ├── (admin)/                Auth-gated, staff only
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── builders/page.tsx   The builder roster
│   │   ├── orders/page.tsx
│   │   ├── returns/page.tsx
│   │   └── support/page.tsx
│   ├── api/                    Route handlers (see Section 9)
│   └── layout.tsx              Root layout, theme provider, fonts
├── components/
│   ├── ui/                     Primitives: Button, Input, Dialog, etc.
│   ├── storefront/             Hero, ProductCard, CartDrawer, etc.
│   └── admin/                  BuilderTable, RMAChart, etc.
├── lib/                        Business logic, fetchers, zod schemas
├── stores/                     Zustand stores (cart, ui)
├── types/                      Global types
└── tailwind.config.ts
```

**Hard rule:** no business logic in React components. Components consume hooks from `lib/`. Hooks consume fetchers from `lib/api/`. Fetchers talk to `/api/*` routes. API routes validate input with zod, call service functions in `lib/services/`, which read/write through Prisma or Mongoose.

---

## 5. DATABASE SCHEMAS

### 5.1 PostgreSQL (Aurora) via Prisma

Put the full schema in `packages/db/prisma/schema.prisma`. It must include these models with all fields, enums, relations, and indexes:

```
users (user_id, email, password_hash, role, first_name, last_name, phone,
       email_verified_at, mfa_enabled, last_login_at, timestamps, soft delete)
user_addresses (address_id, user_id FK, label, is_default, line_1/2,
                city, region, postcode, country_iso2)
warehouse_nodes (warehouse_node_id, node_code, location_name, address JSONB,
                 max_concurrent_builds, active_build_count, is_active)
builders (builder_id, builder_code, user_id FK, warehouse_node_id FK,
          display_name, legal_name, tier, status, joined_at, avatar_url, bio,
          total_units_built, total_units_sold, total_rma_count,
          rma_rate_rolling_90d, quality_score, avg_build_minutes,
          avg_response_hours, revenue_gbp_lifetime, margin_gbp_lifetime,
          flagged_by_ai, last_flag_reason, timestamps)
product_categories (category_id, slug, name, parent_id self-FK, sort_order)
products (product_id, sku, builder_id FK, category_id FK, title, subtitle,
          slug, condition_grade, price_gbp, cost_gbp, compare_at_gbp,
          margin_gbp (generated), warranty_months, shipping_weight_kg,
          is_active, is_featured, ebay_listing_id, ebay_sync_at,
          mongo_spec_id, timestamps)
product_inventory (product_id PK/FK, stock_qty, reserved_qty,
                   available_qty (generated), reorder_threshold, updated_at)
units (unit_id, serial_number UNIQUE, product_id FK, builder_id FK,
       warehouse_node_id FK, build_started_at, build_completed_at,
       qc_passed_at, qc_passed_by FK users, qc_notes, current_state,
       mongo_build_log_id, created_at)
orders (order_id, order_number UNIQUE, user_id FK, status, subtotal_gbp,
        shipping_gbp, tax_gbp, discount_gbp, total_gbp, currency,
        payment_method, payment_intent_id, payment_captured_at,
        shipping_address JSONB, billing_address JSONB, customer_notes,
        timestamps, queued_for_build_at, shipped_at, delivered_at,
        cancelled_at)
order_items (order_item_id, order_id FK, product_id FK, builder_id FK,
             unit_id FK (nullable until assigned), qty, price_per_unit_gbp,
             cost_per_unit_gbp, line_total_gbp (generated),
             line_margin_gbp (generated))
build_queue (build_queue_id, order_id FK, builder_id FK,
             warehouse_node_id FK, status, priority, items JSONB,
             estimated_minutes, started_at, completed_at, failure_reason)
returns (return_id, return_number UNIQUE, order_item_id FK, order_id FK,
         unit_id FK, builder_id FK, product_id FK, requested_by_user_id FK,
         reason, reason_details, status, refund_amount_gbp,
         restocking_fee_gbp, ai_severity, ai_flagged_pattern, ai_analysis JSONB,
         resolution_notes, timestamps, approved_at, refunded_at)
support_tickets (ticket_id, ticket_number UNIQUE, user_id FK, order_id FK,
                 product_id FK, subject, channel, status, ai_confidence,
                 ai_escalated_reason, assigned_staff_id FK, telegram_chat_id,
                 timestamps, resolved_at, sentiment_score)
support_messages (message_id, ticket_id FK, sender_type, sender_user_id FK,
                  body, tokens_in, tokens_out, model_id, attachments JSONB,
                  created_at)
builder_performance_snapshots (snapshot_id, builder_id FK, period, period_start,
                               period_end, units_built, units_sold, revenue_gbp,
                               cost_gbp, margin_gbp, roi_pct, rma_count, rma_rate,
                               avg_build_minutes, avg_qc_pass_rate, quality_score,
                               unique on (builder_id, period, period_start))
reviews (review_id, product_id FK, user_id FK, order_item_id FK, rating 1-5,
         title, body, verified_purchase BOOLEAN, helpful_count, created_at)
cart_sessions (cart_id, user_id FK nullable, session_token, items JSONB,
               subtotal_gbp, expires_at, timestamps)
discount_codes (code_id, code UNIQUE, type (percent/fixed), value, min_spend,
                max_uses, uses_count, starts_at, ends_at, is_active)
audit_log (audit_id BIGSERIAL, actor_user_id FK, actor_type, action, entity_type,
           entity_id, payload JSONB, ip_address INET, user_agent, created_at)
```

Enums: `user_role`, `builder_tier`, `builder_status`, `order_status`, `payment_method`, `build_status`, `rma_status`, `rma_reason`, `ticket_status`, `ticket_channel`.

Add all foreign-key indexes, plus these hot-path indexes:
- `builders(rma_rate_rolling_90d DESC)`, `(quality_score DESC)`, `(flagged_by_ai) WHERE flagged_by_ai = true`
- `products(builder_id)`, `(category_id)`, `(price_gbp)`, `(is_active)`, GIN on `title`
- `returns(builder_id)`, `(product_id)`, `(status)`, `(created_at DESC)`, `(ai_flagged_pattern) WHERE true`
- `orders(user_id)`, `(status)`, `(created_at DESC)`
- `support_tickets(status)`, `(created_at DESC)`

Add a trigger `set_updated_at()` and attach to every table with an `updated_at` column.

### 5.2 MongoDB (DocumentDB) via Mongoose

Put models in `packages/db/mongo/`:

**`product_catalog`** — the rich, nested product document. One per Postgres `products` row. Holds `specs.cpu{brand,family,model,cores,threads,baseClockGhz,boostClockGhz}`, `specs.gpu{brand,model,vramGb,rtx}`, `specs.memory{sizeGb,type,speedMhz,slotsUsed,slotsTotal}`, `specs.storage[]`, `specs.motherboard`, `specs.psu`, `specs.cooling`, `specs.case`, `specs.os`, `specs.ports`, `specs.networking`, `specs.dimensions`, `benchmarks{geekbench6Single/Multi, cinebenchR23Single/Multi, timespyGraphics, frameRates[]}`, `images[]`, `videos[]`, `manuals[]`, `tags[]`, `seo{metaTitle,metaDescription,keywords}`, `ebay{listingId,lastSyncedAt,rawTitle,rawPriceGbp}`.

**`build_event_log`** — one doc per builder scan event from the mobile app. Fields: `postgresUnitId`, `postgresBuilderId`, `postgresOrderId`, `eventType` (enum: build_started, component_scanned, photo_captured, qc_checklist_item, qc_passed, qc_failed, build_completed, packaging_sealed), `components[]{componentType,scannedSerial,scannedBarcode,partNumber,manufacturer,scannedAt,deviceId}`, `photos[]`, `qcItems[]`, `geo`, `builderDeviceId`, `clientVersion`, `createdAt`.

**`return_analysis`** — AI verdict on each RMA. Fields: `postgresReturnId`, `postgresBuilderId`, `postgresProductId`, `model`, `severity (0-1)`, `rootCauseGuess`, `categoryTags[]`, `builderRiskScore`, `patternFlags[]{patternCode,confidence,related[]}`, `recommendedAction`, `rationale`, `evidenceLinks[]`.

**`builder_quality_flags`** — AI-raised issues per builder. Fields: `postgresBuilderId`, `flagCode`, `severity (info/warn/critical)`, `message`, `evidence`, `raisedAt`, `acknowledgedAt`, `acknowledgedBy`, `resolvedAt`.

**`chat_transcripts`** — full message history + sentiment + escalation events, keyed to `postgresTicketId`.

Add compound indexes on `postgresBuilderId + createdAt` for `build_event_log` and `postgresBuilderId + raisedAt` for `builder_quality_flags`.

---

## 6. DESIGN SYSTEM AND THEME

### 6.1 Theme provider

Root layout wraps children in a `<ThemeProvider>` that:
- Reads `localStorage['bav-theme']` on mount (values: `light` | `dark` | `system`)
- Defaults to `light` if unset (white-first, explicit)
- Writes a `data-theme` attribute on `<html>` and a matching class for Tailwind
- Syncs with `prefers-color-scheme` when set to `system`

### 6.2 Theme toggle component

`components/ui/ThemeToggle.tsx`. Sits top-right in the storefront header. Three-state segmented control (Light / System / Dark) with a smooth Framer Motion transition on the slider indicator. No page reload. Transitions the colour scheme with a 240ms cross-fade using CSS custom properties.

### 6.3 tailwind.config.ts (full file)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green:    '#1EB53A',
          'green-600': '#16A432',
          'green-400': '#4CD265',
          'green-100': '#E5F7EA',
          black:    '#0A0A0A',
        },
        ink: {
          900: '#0A0A0A',
          700: '#2B2E35',
          500: '#6B7280',
          300: '#D4D4D8',
          100: '#F3F4F6',
          50:  '#F9FAFB',
        },
        obsidian: {
          950: '#050505',
          900: '#0B0D12',
          800: '#11141B',
          700: '#181C25',
          600: '#222833',
          500: '#323A48',
        },
        semantic: {
          positive: '#1EB53A',
          warning:  '#F0B849',
          critical: '#FF4D5E',
          info:     '#4F91FF',
        },
        tier: {
          probation: '#64748B',
          standard:  '#4F91FF',
          preferred: '#1EB53A',
          elite:     '#F0B849',
        },
      },
      fontFamily: {
        display: ['var(--font-inter-display)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '1.04', letterSpacing: '-0.03em',  fontWeight: '600' }],
        'h1':         ['40px', { lineHeight: '1.1',  letterSpacing: '-0.025em', fontWeight: '600' }],
        'h2':         ['28px', { lineHeight: '1.15', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'h3':         ['20px', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body':       ['15px', { lineHeight: '1.55' }],
        'small':      ['13px', { lineHeight: '1.5' }],
        'caption':    ['11px', { lineHeight: '1.4', letterSpacing: '0.04em', textTransform: 'uppercase' }],
        'data-lg':    ['32px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      borderRadius: { xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px' },
      boxShadow: {
        'glass-light': '0 8px 32px rgba(10, 10, 10, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glass-dark':  '0 24px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        'lift':        '0 8px 28px rgba(10, 10, 10, 0.08)',
        'ring-green':  '0 0 0 1px rgba(30, 181, 58, 0.35), 0 0 24px rgba(30, 181, 58, 0.18)',
      },
      backdropBlur: { glass: '20px', heavy: '32px' },
      transitionTimingFunction: { unfold: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionDuration: { 240: '240ms', 420: '420ms', 1200: '1200ms' },
      keyframes: {
        'fade-up':      { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-green':  { '0%': { boxShadow: '0 0 0 0 rgba(30, 181, 58, 0.5)' }, '100%': { boxShadow: '0 0 0 12px rgba(30, 181, 58, 0)' } },
        'shimmer':      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-up':     'fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-green': 'pulse-green 1.8s ease-out infinite',
        'shimmer':     'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
```

### 6.4 Glass morphism recipe

The "glass square" look the owner wants. One utility class combo, used throughout:

```tsx
// Light mode:
className="bg-white/70 backdrop-blur-glass border border-ink-300/60 shadow-glass-light rounded-lg"

// Dark mode variant (automatic via theme):
className="dark:bg-obsidian-900/70 dark:border-obsidian-500/60 dark:shadow-glass-dark"
```

Apply to: product cards, cart drawer, header on scroll, modal backgrounds, stat tiles, nav pills, filter panels. The effect must survive theme toggle instantly because `backdrop-blur` is independent of colour.

### 6.5 Motion rules

- Default ease: `cubic-bezier(0.16, 1, 0.3, 1)` (unfold)
- Hover scale on interactive cards: `1 -> 1.015` over 240ms
- Stagger reveals: 40ms between children on mount
- Page transitions: 420ms fade + 8px slide using Next.js `template.tsx` + `motion`
- Never bounce. No spring overshoot. Motion is refined, not playful.

---

## 7. CUSTOMER STOREFRONT (public-facing, white-first)

### 7.1 Home (`app/(storefront)/page.tsx`)

Stack from top to bottom:

1. **Sticky header** (72px): logo left, nav centre (Shop / Gaming / Laptops / Monitors / Bundles / Support), search icon + theme toggle + account + cart right. Glass-morphism on scroll past 40px.
2. **Hero** (full-viewport minus header): asymmetric 12-column layout.
   - Left 7 cols: display-xl headline *"Refurbished PCs, built by people who know them."*, subhead, two CTAs (*Shop PCs* primary green, *Gaming Bundles* secondary outline), tiny trust row ("82K sold · 98.4% positive · 12-month warranty · Free UK shipping").
   - Right 5 cols: a floating glass card showing a featured gaming PC with animated spec pills (CPU, GPU, RAM) that rotate every 4s with a Framer Motion `AnimatePresence` cross-fade.
   - Background: very subtle gradient mesh using the brand green at ~4% opacity, animated via CSS `@property` on a slow drift.
3. **Category grid** (six glass squares, 3x2 on desktop, 2x3 tablet, stacked mobile): Gaming PCs, Laptops, Monitors, Bundles, Peripherals, Parts. Each card has a category hero image, item count, hover lift + green underline sweep.
4. **Trending now** rail: horizontal scroll, 8 cards, snap points, momentum. Products pulled from `/api/products?sort=bestseller&limit=8`.
5. **Why Birmingham AV** trio: three glass cards with icons (12-month warranty, free UK shipping, 30-day returns). No stock-photo energy; custom SVG line icons in brand green.
6. **Builder spotlight**: rotating glass card featuring one verified builder (avatar, name, builds-to-date, quality score), pulled from `/api/builders/spotlight`. Humanises the brand.
7. **Recently viewed** (if session has history, else hide).
8. **Footer**: five-column on desktop, collapsed accordion on mobile. Company, Shop, Support, Legal, Newsletter. Logo + social icons at the bottom. Muted black on white, inverted in dark mode.

### 7.2 Shop / Category (`app/(storefront)/shop/page.tsx` and `shop/[slug]/page.tsx`)

Two-column layout: filters (sticky left, 280px) + results grid.

Filters:
- Price range slider (£0 – £5,000)
- Condition (Like New / Excellent / Very Good / Good)
- Category (if on `shop/`)
- CPU family, GPU family, RAM ≥, Storage ≥ (populated from a `/api/filters/aggregates` endpoint that reads from MongoDB)
- Builder (optional, dropdown of active builders)
- In-stock only toggle

Grid:
- 4 columns desktop, 3 tablet, 2 mobile
- Infinite scroll via Intersection Observer + TanStack Query `useInfiniteQuery`
- Each card: image carousel (hover cycles), title, spec line (CPU · GPU · RAM · SSD), condition chip, price, stock chip, "Add to cart" button that springs in on hover
- Sort dropdown: Relevance / Price low-high / Price high-low / Newest / Bestseller

### 7.3 Product detail (`app/(storefront)/product/[slug]/page.tsx`)

- Breadcrumb trail
- Gallery left (60%): main image + thumbnail rail, zoom on hover, keyboard arrow navigation, Framer Motion `layoutId` shared element transition from the card
- Info right (40%): title, subtitle, condition chip, price (with compare-at strikethrough if applicable), stock indicator, qty selector, primary CTA (*Add to cart* in brand green), secondary *Add to wishlist*
- Tabbed panel below: Specs (full table from MongoDB), Benchmarks (Chart.js bar chart of Cinebench / Geekbench / 3DMark), Warranty, Shipping, Returns, Reviews
- "Built by" card: the assigned builder, avatar, total builds, quality score, linked to a public builder profile
- Related products rail at the bottom

### 7.4 Cart drawer (slide-in from right, 480px wide)

Opens when cart icon clicked. Glass morphism. Line items with image, title, qty stepper, line total. Subtotal, shipping estimate, *Checkout* primary CTA.

### 7.5 Checkout (`app/(storefront)/checkout/page.tsx`)

Single-page, three-section accordion: Contact, Shipping, Payment. Left column form, right column order summary (sticky). Stripe Elements for card, PayPal button for alternative. On successful `payment_intent.succeeded` webhook, create the order, emit `bav.orders.paid` on EventBridge, and redirect to `/orders/{number}`.

### 7.6 Order detail (`app/(storefront)/orders/[orderNumber]/page.tsx`)

Status timeline (Paid → Queued → In Build → QC → Shipped → Delivered) with live updates via the WebSocket. Each order item shows which builder has been assigned and their current step. *Request a return* button per item once delivered.

### 7.7 Returns portal (`app/(storefront)/returns/new/page.tsx`)

Order picker, item picker, reason picker, details textarea, photo upload (to S3 via presigned URL). Submit creates a `returns` row and triggers the AI analysis pipeline.

### 7.8 Account (`app/(storefront)/account/page.tsx`)

Orders, returns, addresses, password, preferences (theme, email notifications, Telegram opt-in for order updates).

---

## 8. ADMIN DASHBOARD (auth-gated, staff only)

### 8.1 Routes and guards

Everything under `app/(admin)/` is protected. Middleware checks `session.user.role in ['support_staff', 'admin', 'super_admin']`. Builders land on `/builder/portal` (separate layout, scoped to their own data).

### 8.2 Pages

**`/admin/dashboard`** — KPI strip (revenue today/week/month, orders today, open tickets, flagged returns, active builds), activity feed (recent events from EventBridge), live build queue with builder progress bars.

**`/admin/builders`** — the builder roster table. Columns: builder, tier chip, units sold 90d, revenue, margin, ROI%, RMA rate (colour-graded), 14-day trend sparkline, status (healthy / review). Clicking a row opens a slide-over with: full performance history, list of their active builds, list of their returns, list of AI flags with ack/resolve actions, and a notes field. Totals strip above the table: total builders, total units 90d, total revenue 90d, total margin 90d, overall RMA rate, AI-flagged count. Refreshes every 60s via TanStack Query. This is where Micky (the owner) oversees his 20 builders.

**`/admin/orders`** — paginated table with search, status filter, builder filter, date range. Row action to view, update status, trigger refund (writes to Stripe), message the customer.

**`/admin/returns`** — list of RMAs, filterable by status and AI severity. Detail view shows the AI analysis from MongoDB, including the root-cause guess, pattern flags, and recommended action. Buttons to approve, reject, escalate.

**`/admin/support`** — inbox of tickets. Left pane: list sorted by last activity. Right pane: conversation thread with AI turns marked, human turns marked, product/order context sidebar. Staff can take over from the AI at any point (button *Take over* changes ticket status to `escalated_human` and notifies the customer).

**`/admin/products`** — CRUD interface for the catalog. Bulk actions (activate, deactivate, re-sync from eBay). The ingestion script (Section 3) is the initial fill, this is for ongoing edits.

---

## 9. API ENDPOINTS (full list, all must be implemented and wired)

### 9.1 Public

```
GET    /api/products                   List with filter + pagination
GET    /api/products/:slug             Product detail (joined Postgres + Mongo)
GET    /api/products/search            Full-text search with pg_trgm
GET    /api/categories                 Nested category tree
GET    /api/filters/aggregates         CPU/GPU/RAM buckets for filter UI
GET    /api/builders/spotlight         Rotating public-safe builder feature
GET    /api/builders/:code/public      Public builder profile
```

### 9.2 Cart and checkout

```
GET    /api/cart                       Current cart (cookie-based session or user)
POST   /api/cart/items                 Add item, reserves stock for 15 min
PATCH  /api/cart/items/:id             Update qty
DELETE /api/cart/items/:id             Remove
POST   /api/checkout/session           Create Stripe PaymentIntent
POST   /api/checkout/paypal/order      Create PayPal order
POST   /api/webhooks/stripe            Stripe webhook (signature verified)
POST   /api/webhooks/paypal            PayPal webhook
```

### 9.3 Auth

```
POST   /api/auth/register
POST   /api/auth/login                 (NextAuth credentials)
POST   /api/auth/logout
POST   /api/auth/password/request
POST   /api/auth/password/reset
POST   /api/auth/email/verify
GET    /api/auth/session               Current session
```

### 9.4 Orders and returns

```
GET    /api/orders                     User's own orders (paginated)
GET    /api/orders/:number             User's own order detail
POST   /api/returns                    Create RMA, triggers AI analysis
GET    /api/returns/:number            Return detail
```

### 9.5 Reviews

```
POST   /api/reviews                    Only allowed if verified purchase
GET    /api/products/:slug/reviews
POST   /api/reviews/:id/helpful
```

### 9.6 Support and AI chat

```
POST   /api/support/tickets            Open a ticket (web form or widget)
GET    /api/support/tickets/:number    User's own ticket detail
POST   /api/support/messages           Send user message, triggers AI turn
WS     /api/ws/support                 Full-duplex chat socket
```

### 9.7 Builder and admin

```
GET    /api/admin/builders/summary     Roster + aggregates (see sample response below)
GET    /api/admin/builders/:id         Detail (performance, units, RMAs, flags)
PATCH  /api/admin/builders/:id         Update tier, status, notes
GET    /api/admin/builders/:id/units   Units list
GET    /api/admin/returns              Filtered RMA list
PATCH  /api/admin/returns/:id          Approve/reject/escalate
GET    /api/admin/orders               Full orders list (staff view)
PATCH  /api/admin/orders/:id/status    Status transition
GET    /api/admin/dashboard/kpis       Top-of-dashboard numbers
GET    /api/admin/activity             Event feed from EventBridge tap
POST   /api/admin/builders/:id/flags/:flagId/ack
POST   /api/admin/builders/:id/flags/:flagId/resolve
```

### 9.8 Builder mobile app

```
POST   /api/builds/scan                Mobile scan-in submit (component events)
GET    /api/builds/queue               Builder's own queue
POST   /api/builds/qc/:id              Submit QC checklist
GET    /api/me/builder                 Builder profile for mobile app
```

### 9.9 Ingestion and ops

```
POST   /api/ops/ingest/ebay            Trigger re-ingest (admin only)
POST   /api/ops/snapshots/rebuild      Rebuild builder_performance_snapshots
GET    /api/ops/health                 Health check (DB, Redis, S3, Anthropic)
```

### 9.10 Sample response contract for the builder summary

```json
{
  "items": [
    {
      "builderId": "uuid",
      "builderCode": "BLD-004",
      "displayName": "Ashworth Systems",
      "avatarUrl": "https://...",
      "tier": "elite",
      "warehouseNodeCode": "BHM-HUB-A",
      "unitsBuilt90d": 312,
      "unitsSold90d": 298,
      "revenueGbp90d": 287400,
      "marginGbp90d": 94800,
      "roiPct90d": 34.6,
      "rmaRate90d": 0.0091,
      "rmaCount90d": 3,
      "qualityScore": 4.82,
      "avgBuildMinutes": 98,
      "avgResponseHours": 2.4,
      "trend14d": [4,5,6,5,7,8,6,9,7,8,10,9,8,11],
      "flagged": false,
      "flagReason": null,
      "updatedAt": "2026-04-17T12:00:00Z"
    }
  ],
  "totals": {
    "totalBuilders": 22,
    "totalUnitsSold": 4186,
    "totalRevenueGbp": 3410000,
    "totalMarginGbp": 986000,
    "overallRmaRate": 0.0274,
    "flaggedCount": 3
  }
}
```

All request and response bodies must be validated with zod schemas colocated in `lib/schemas/`.

---

## 10. WEBSOCKET AND AI SUPPORT

### 10.1 WebSocket server

Single Node runtime route at `app/api/ws/route.ts` using `ws`. Rooms:
- `ticket:{ticketId}` — customer + AI + staff
- `order:{orderId}` — status updates pushed to the customer
- `admin:activity` — real-time event feed for staff

Auth: first message must be `{ type: "auth", token: "jwt" }` or the socket closes.

Events from server:
```
{ type: "message", ticketId, message: {...} }
{ type: "typing",  ticketId, sender: "ai" | "staff" | "user" }
{ type: "status",  ticketId, status }
{ type: "escalated", ticketId, reason }
{ type: "order_status", orderId, status, at }
```

### 10.2 AI support agent

Model: `claude-opus-4-7`. Called from `packages/ai/support-agent.ts`.

System prompt (verbatim):

```
You are the Birmingham AV support assistant. You help customers with refurbished
PCs, laptops, and peripherals sold by Birmingham AV. Be direct, warm, and
technically fluent. You have tools to look up orders, products, and stock.

Rules:
1. Never invent order numbers, tracking numbers, specs, or policies. If you
   do not have the information, say so and offer to escalate.
2. Never promise refunds, replacements, or delivery dates on behalf of the
   company. You can say "I will raise this with the team" and escalate.
3. Escalate immediately to a human if the customer expresses frustration,
   mentions legal action, asks for a manager, reports a hardware failure that
   could be dangerous (smoke, burning smell, electrical issues), or the query
   involves a refund over £500.
4. Answer product spec questions confidently when you have retrieved the spec.
5. Keep replies under 120 words unless the customer explicitly asks for detail.
6. British English. No emoji.

When you need to escalate, call the `escalate_to_human` tool with a one-line
reason. The ticket will be routed to Telegram for the owner and the support
inbox for staff.
```

Tools exposed to the agent:
- `lookup_order(order_number)` → order summary + item list + builder
- `lookup_product(slug_or_sku)` → full spec and stock
- `lookup_user_orders(user_id)` → recent order list
- `escalate_to_human(reason, severity)` → flips ticket to `escalated_human`, fires Telegram webhook
- `check_stock(product_id)` → live stock level

### 10.3 Escalation wiring

When `escalate_to_human` fires:
1. Update `support_tickets.status = 'escalated_human'`, set `ai_escalated_reason`
2. Insert a system message into `support_messages`: "Escalated to human team"
3. Publish `bav.support.escalated` to EventBridge
4. Send a Telegram message to the owner via `TELEGRAM_OWNER_CHAT_ID` using `node-telegram-bot-api`. Payload: customer name, ticket number, reason, and a deep link to `/admin/support?ticket={number}`.
5. Send an email fallback to `support@birmingham-av.com` via Resend if Telegram fails.
6. The next staff turn in the thread (via admin UI) reopens the live WebSocket room and pushes the message to the customer.

### 10.4 Return analysis (separate AI pipeline)

Model: `claude-sonnet-4-6` (cheaper, structured output). Triggered by `bav.returns.created` on EventBridge. Reads the return details and the builder's recent 90-day history, then emits a `ReturnAnalysis` document (see schema in Section 5.2). If `severity > 0.7` or a pattern flag is raised, also inserts a `builder_quality_flags` document. The admin UI surfaces these in `/admin/returns` and on the builder slide-over in `/admin/builders`.

---

## 11. EVENT-DRIVEN BACKBONE

EventBridge bus: `bav-main`. Publishers are API route handlers and server actions; subscribers are Lambda-equivalent worker functions in `apps/web/lib/workers/` during development (moved to proper Lambdas in prod).

Events:
```
bav.orders.created           → reserve stock, send order confirmation email
bav.orders.paid              → enqueue build, notify assigned builder
bav.orders.shipped           → push WS update, email + Telegram if opted in
bav.orders.delivered         → open review prompt in account
bav.builds.completed         → update inventory, mark unit ready, snapshot event
bav.returns.created          → trigger AI analysis, notify admin
bav.returns.ai_flagged       → raise builder quality flag
bav.support.ticket_opened    → log, trigger first AI turn
bav.support.escalated        → Telegram + email
bav.catalog.product_synced   → invalidate relevant caches
bav.builders.snapshot_due    → nightly aggregator for builder_performance_snapshots
```

A nightly cron (EventBridge scheduled rule, local dev: a BullMQ repeatable job) recomputes `builder_performance_snapshots` for period=rolling_90d and updates the rolling fields on `builders`.

---

## 12. MOBILE APP (builder scan-in)

Single-screen-flow MVP in `apps/mobile/`:

- Login screen (email + password, JWT stored in secure storage)
- Queue screen (the builder's own `build_queue` list, pull-to-refresh)
- Scan-in screen (tap a queued build → walk through CPU → GPU → RAM → Storage → PSU → Motherboard via the native `HardwareScanner` module binding to the phone camera or an external Bluetooth scanner). Progress bar, animated via Reanimated. Submit posts to `POST /api/builds/scan` with the list of scanned components.
- QC checklist screen (tick items, capture photos, submit)
- Profile screen (stats, active flags, warehouse node)

Share all zod schemas, fetchers, and TanStack Query hooks from `packages/lib/`. NativeWind uses the same `tailwind.config.ts` from `packages/ui/` via the NativeWind v4 preset.

---

## 13. ENVIRONMENT VARIABLES (`.env.example`)

```
# Database
DATABASE_URL=postgresql://bav:bav@localhost:5432/bav
MONGO_URL=mongodb://localhost:27017/bav
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=change-me-generate-with-openssl
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=
CLAUDE_MODEL_SUPPORT=claude-opus-4-7
CLAUDE_MODEL_ANALYSIS=claude-sonnet-4-6

# Payments (leave blank, fill before launch)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Email + Telegram
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=

# eBay ingestion
EBAY_APP_ID=
EBAY_CERT_ID=
EBAY_DEV_ID=
INGEST_PROVIDER=ebay_api
APIFY_TOKEN=
SERPAPI_KEY=

# AWS (for infra and S3)
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_PRODUCT_IMAGES=bav-product-images
S3_BUCKET_RETURN_PHOTOS=bav-return-photos
CLOUDFRONT_DOMAIN=

# Observability
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=
```

---

## 14. DOCKER AND LOCAL DEV

`docker-compose.yml` spins up Postgres 16, MongoDB 7, Redis 7, LocalStack (for EventBridge + S3 emulation), and Mailhog (email preview).

`make bootstrap` runs: `pnpm install`, `pnpm db:migrate`, `pnpm db:seed` (creates 22 demo builders, 3 warehouse nodes, 60 demo products), `pnpm ingest:ebay` (pulls real BAV listings), `pnpm dev` (turborepo dev).

---

## 15. SEED DATA (run after schema migrations, before ingestion)

`scripts/seed.ts` must insert:

- 3 warehouse nodes: `BHM-HUB-A`, `BHM-HUB-B`, `BHM-HUB-C` with realistic Birmingham postcodes
- 22 builders across the three nodes, mix of tiers and statuses, realistic British names, realistic avatar URLs from `dicebear.com/api/initials/{name}.svg` or similar
- A handful of `product_categories` matching the eBay category list (Section 3.1)
- One super-admin user: `owner@birmingham-av.com` with a printed temporary password in the seed script output
- Three support staff users

The real product data fills in from the eBay ingestion script (Section 3.2), not the seed. The seed just makes the system usable before the ingestion runs.

---

## 16. ACCEPTANCE CRITERIA (how to verify you finished)

You are done when every one of these is true. Verify each before declaring the build complete.

1. `pnpm dev` starts the whole stack with no errors
2. Landing page at `http://localhost:3000` renders with BAV logo, green CTAs, white theme, glass hero card, and category grid
3. Theme toggle in the header flips light/dark instantly with no flash
4. `/shop` shows real BAV products pulled from the eBay ingestion, with real images and real prices
5. Search, category filter, price filter, CPU filter all work and narrow results
6. Adding a product to cart opens the slide-in drawer, stock is reserved in the DB, the cart persists across reloads
7. Checkout completes against a Stripe test key (insert key in `.env.local` to verify) and produces an `orders` row with status `paid`
8. The AI support widget floats bottom-right on every page; opening it creates a ticket, the AI responds via Claude, and escalation sends a Telegram message when triggered
9. Admin user signs in at `/admin`, sees the KPI strip, and the `/admin/builders` page shows all 22 seeded builders with live RMA rates and ROI
10. Clicking a builder opens the slide-over with full detail and any AI flags
11. Creating a return fires the AI analysis pipeline and writes a `return_analysis` MongoDB document within 10 seconds
12. The mobile app builds for iOS and Android (Expo dev client), the builder can log in, view their queue, and walk through the scan-in flow end to end
13. `bav.orders.paid` published to EventBridge triggers the builder notification worker and enqueues a build
14. WebSocket updates flow to the order detail page when status changes
15. All 50+ API endpoints in Section 9 are implemented and return valid zod-validated responses
16. `pnpm test` and `pnpm typecheck` both pass with zero errors
17. Lighthouse score on landing page: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
18. No em dashes in any copy anywhere (Micky's rule)

---

## 17. DO NOT

- Do not use Shopify, WooCommerce, Magento, Bagisto, Medusa, or any off-the-shelf ecommerce engine. This is bespoke.
- Do not use styled-components, emotion, or CSS modules. Tailwind `className` only.
- Do not use Material UI, Chakra, Ant Design, or shadcn defaults unmodified. Build components from primitives (Radix UI headless is fine for a11y).
- Do not use stock photos. All imagery comes from the eBay ingestion or custom SVGs.
- Do not write business logic in React components.
- Do not hardcode colour values. Every colour comes from `tailwind.config.ts`.
- Do not cut corners on type safety. `tsconfig strict: true` across every package.
- Do not leave any endpoint as a TODO. Everything in Section 9 ships working.
- Do not use em dashes in any user-facing copy. Use colons, commas, or sentence breaks instead.
- Do not log sensitive customer data (passwords, full card numbers, MFA secrets) to any sink.

---

## 18. STARTING ORDER

Execute in this sequence. Do not skip ahead.

1. Scaffold the Turborepo with the folder structure in Section 4.1
2. Add `tailwind.config.ts` (Section 6.3), global fonts, theme provider, and the `ThemeToggle` component
3. Set up Prisma + Mongoose with the schemas in Section 5; run migrations
4. Write the seed script (Section 15) and run it
5. Write `scripts/ingest-ebay.ts` (Section 3.2) and run it to populate real products
6. Build the storefront pages in order: home, shop, product detail, cart, checkout, account
7. Wire the public API endpoints (Section 9.1–9.5) and verify against the UI
8. Build the WebSocket server and AI support widget (Section 10)
9. Build the admin layout, builder roster, returns, orders, and support pages
10. Wire the admin API endpoints (Section 9.7)
11. Build the mobile app MVP
12. Write the event workers (Section 11)
13. Write end-to-end tests covering the happy paths (Playwright)
14. Run the acceptance checklist (Section 16)

When every item in Section 16 is green, the build is done. Hand back to Micky with:
- A live URL (localhost is fine for first cut)
- The super-admin credentials printed by the seed script
- A short list of any items deferred (Stripe/PayPal keys, production DNS, mail sender verification)

Ship it.
