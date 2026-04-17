# Birmingham AV Enterprise Marketplace

Bespoke ecommerce platform for Birmingham AV. See `SPEC.md` for the authoritative build specification.

## Stack

Next.js 14 App Router / TypeScript strict / Tailwind / Framer Motion / Prisma (Postgres) / Mongoose (MongoDB) / Redis (BullMQ) / Anthropic Claude / Stripe + PayPal / AWS EventBridge, S3, EKS

---

## Deploy for the client walkthrough (Vercel, 15 min)

The fastest path to a shareable URL. All free tier, no credit card.

### 1. Push to GitHub

```bash
cd "/c/Users/user/Birmingham AV"
git init && git add . && git commit -m "BAV v0.1.0 initial"
gh repo create birmingham-av --private --source=. --push
```

### 2. Create managed DBs (5 min)

Open three tabs, free tier on each:

| Service | URL | Copy the... |
|---|---|---|
| Neon (Postgres) | [neon.tech](https://neon.tech) | `postgres://...` connection string |
| MongoDB Atlas M0 | [cloud.mongodb.com](https://cloud.mongodb.com) | `mongodb+srv://...` SRV URL |
| Upstash (Redis) | [console.upstash.com](https://console.upstash.com) | `redis://...` URL |

### 3. Seed the DBs from your laptop (one-off)

```bash
export DATABASE_URL="postgres://...neon..."
export MONGO_URL="mongodb+srv://...atlas..."
pnpm install
pnpm db:generate
pnpm db:push          # applies the schema directly (no migration files)
pnpm db:seed          # 35 products, 22 builders, 15 orders, 4 RMAs, 3 tickets
```

Seed output prints the super-admin temp password. Save it.

### 4. Deploy to Vercel

- Go to [vercel.com/new](https://vercel.com/new) → Import the GitHub repo
- **Framework:** Next.js (auto-detected)
- **Root Directory:** leave at repo root (`vercel.json` handles the monorepo)
- **Environment variables:** paste:
  - `DATABASE_URL` (Neon)
  - `MONGO_URL` (Atlas)
  - `REDIS_URL` (Upstash)
  - `NEXTAUTH_SECRET` = `openssl rand -base64 32`
  - `NEXTAUTH_URL` = your Vercel URL (set after first deploy)
  - `BAV_DEMO_MODE=true` (opens admin without login for the walkthrough)
  - `ANTHROPIC_API_KEY` (optional: enables live support chat)
- Deploy. Takes ~2 min.

Share the `birmingham-av.vercel.app` URL.

### What the client sees

- Landing page with brand palette, glass hero, animated spec rotator, theme toggle
- `/shop` — 35 seeded products across all 14 categories with images
- `/product/aegis-ultra-...` — full product detail with specs table, "built by" card
- `/cart` and `/checkout` — working cart, Stripe checkout shows a clear "configure key" hint
- `/admin/dashboard` — live KPIs (revenue, orders, returns, open tickets)
- `/admin/builders` — the 22 builders with colour-graded RMA rates, ROI, tier chips
- `/admin/orders`, `/admin/returns`, `/admin/support`, `/admin/products` — populated tables
- Support widget bottom-right on every page

---

## Local dev (full stack in Docker)

```bash
cp .env.example .env.local
make bootstrap        # installs, boots Docker, migrates, seeds
make dev              # http://localhost:3000
```

## Monorepo layout

```
apps/
  web/        Next.js 14 storefront + admin
  mobile/     React Native builder scan-in (scaffold only)
packages/
  ui/         Shared Tailwind preset
  lib/        Zod schemas, formatters, shared types
  db/         Prisma client, Mongoose models, seed + ingest scripts
  ai/         Anthropic Claude clients + prompts
```

## Commands

```bash
pnpm dev                 # all apps in parallel
pnpm build               # production build
pnpm typecheck           # tsc across the monorepo
pnpm lint                # eslint + prettier

pnpm db:migrate          # Prisma migrate
pnpm db:generate         # Prisma client
pnpm db:push             # Push schema without migration files
pnpm db:studio           # Prisma Studio
pnpm db:seed             # Fill demo data (35 products, 15 orders, 4 RMAs, 3 tickets)
pnpm ingest:ebay         # Replace demo data with real eBay listings (needs creds)
```

## Secrets for full production

Fill in `.env.local` / Vercel project settings:

- `ANTHROPIC_API_KEY` (AI support chat + RMA analysis)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_CHAT_ID`
- `EBAY_APP_ID`, `EBAY_CERT_ID`, `EBAY_DEV_ID` (or `APIFY_TOKEN` / `SERPAPI_KEY` fallback)
- `AWS_*` for S3 + EventBridge
- `BAV_DEMO_MODE` — leave unset in real prod so admin requires auth

## Hard rules (from SPEC.md §17)

- Bespoke only. No Shopify / Woo / Medusa / shadcn defaults.
- Tailwind `className` only. No styled-components / CSS modules.
- `tsconfig strict: true` everywhere.
- No business logic in React components.
- No em dashes in user-facing copy. Use colons, commas, or sentence breaks.
- Every colour from `tailwind.config.ts` brand tokens.
