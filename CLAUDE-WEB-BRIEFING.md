# Birmingham AV — Claude Web Briefing

Paste this file (or its contents) into the first message of every new Claude Web conversation. It locks in design tokens, utility classes, routes, data shapes, and voice so every produced artefact drops into the Next.js codebase without rework.

At the very bottom you'll tell Claude Web which of the 66 artefacts to produce that conversation.

---

## 1. Project context

**Birmingham AV** is a UK retailer of new and refurbished PCs, laptops, monitors, projectors, parts and network gear. 22 in-house builders assemble every custom machine. Currently selling on eBay at ~£40M annual turnover; we are replacing eBay with a bespoke storefront.

**Audience:** technically literate UK buyers. Gamers, creators, enthusiasts, small businesses, enterprise procurement.

**Aesthetic target:** Aesop × SSENSE × Bang & Olufsen × Mr Porter × Leica × Teenage Engineering × Hermès. Editorial. Restrained. Warm paper. Confident typography. Generous whitespace. Hairlines only.

**Hard constraints — NEVER produce:**
- Glassmorphism, backdrop-blur, translucent panels
- Animated / particle / immersive backgrounds, WebGL effects
- Gradient text, gradient buttons, glow effects, neon
- Emoji icons (Lucide or Heroicons only, used sparingly)
- More than one accent colour across the whole site
- Visual badge spam (multiple chips on every product tile)
- Drop shadows heavier than `0 1px 2px rgba(0,0,0,0.04)`
- SaaS-landing tropes (stat counters on homepage, testimonial carousels, logo bars)
- `rounded-xl`, `rounded-2xl`, `rounded-3xl`, or arbitrary radii above 2px
- Dark mode
- Em dashes are ALLOWED in this direction (editorial convention). Use them for section labels and in prose naturally.

---

## 2. Design tokens — use these exactly

```js
// Colour
const paper   = '#F7F5F2';                        // page surface
const paper2  = '#EDE9E3';                        // alt surface, gallery canvas
const ink     = '#17140F';                        // type + strokes (warm black)
const ink60   = 'rgba(23,20,15,0.60)';            // secondary text
const ink30   = 'rgba(23,20,15,0.30)';            // tertiary text / disabled
const ink10   = 'rgba(23,20,15,0.10)';            // hairlines
const green   = '#1EB53A';                        // brand accent — PULSE DOT ONLY, never for fills

// Typography
const display = { fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" };
const sans    = { fontFamily: "'Instrument Sans', system-ui, sans-serif" };
const mono    = { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums' };

// Italic swash (for the "one italic word per heading" signature)
// Apply via className="bav-italic" or inline { fontStyle: 'italic' }
```

**Font weights:**
- Fraunces: 300 for display (signature weight). Occasionally 400 for body large. Italic variants used.
- Instrument Sans: 400 / 500 / 600 only.
- JetBrains Mono: 400 / 500 only.

**Layout:**
- 12-column grid
- Max-width 1440px
- Horizontal gutters: 48px desktop, 20px mobile
- Vertical section padding: 128px desktop, 72px mobile minimum
- When in doubt, add more whitespace.

**Radii:** 0 default. 2px absolute maximum. Sharp rectangles are premium.

**Hairlines:** `1px solid rgba(23,20,15,0.10)` — used everywhere a divider would normally go.

**Shadows:** none. Remove any that creep in.

**Motion:**
- `.bav-fade` (1000ms fade + 8px y translate, cubic-bezier(0.16,1,0.3,1)) on hero mount only
- `.bav-underline` right-to-left sweep on link hover
- `.bav-hover-opa` 300ms opacity 1 → 0.6 on link/label hover
- Nothing else. No parallax. No scroll-linked effects.

---

## 3. Utility classes — already defined in globals.css

Reuse these in every artefact. Do NOT redeclare. Do NOT invent new ones without asking.

```css
/* Caps-tracked mono micro-label */
.bav-label {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* Animated right-to-left underline + arrow translate on hover */
.bav-underline {
  position: relative; display: inline-flex; align-items: center; gap: 10px;
  padding-bottom: 3px;
}
.bav-underline::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: 0;
  height: 1px; background: currentColor; transform-origin: right;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bav-underline:hover::after { transform-origin: left; }
.bav-underline .arrow { transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1); }
.bav-underline:hover .arrow { transform: translateX(6px); }

/* Hero mount fade */
.bav-fade { animation: bavFade 1000ms cubic-bezier(0.16, 1, 0.3, 1) backwards; }
@keyframes bavFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* Green pulse dot — the ONE place the brand green appears */
.bav-pulse { position: relative; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1EB53A; }
.bav-pulse::before {
  content: ''; position: absolute; inset: -5px; border-radius: 50%; background: #1EB53A;
  opacity: 0.35; animation: bavPulse 2.4s ease-out infinite;
}
@keyframes bavPulse { 0% { transform: scale(0.75); opacity: 0.5; } 100% { transform: scale(2.2); opacity: 0; } }

/* Warm paper canvas — used as gallery background, behind the №073 device */
.bav-canvas {
  background: linear-gradient(140deg, #EDE9E3 0%, #E3DED6 100%);
  position: relative; overflow: hidden;
}
.bav-canvas::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 32% 28%, rgba(255,255,255,0.7), transparent 55%);
  pointer-events: none;
}
.bav-canvas::after {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 72% 82%, rgba(23,20,15,0.09), transparent 60%);
  pointer-events: none;
}

/* Warm-black canvas — used for builder portrait placeholders */
.bav-ink-canvas {
  background: linear-gradient(140deg, #2a2520 0%, #17140F 85%);
  position: relative; overflow: hidden;
}
.bav-ink-canvas::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 28% 22%, rgba(255,255,255,0.14), transparent 50%);
  pointer-events: none;
}

/* Ink-filled rectangular CTA */
.bav-cta {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; border: 1px solid #17140F; color: #F7F5F2; background: #17140F;
  padding: 22px 44px; font-size: 13px; letter-spacing: 0.02em;
  cursor: pointer; transition: opacity 300ms;
  font-family: 'Instrument Sans', system-ui, sans-serif;
  text-transform: uppercase;
}
.bav-cta:hover { opacity: 0.88; }

/* Hairline outline secondary CTA */
.bav-cta-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; border: 1px solid rgba(23,20,15,0.10); color: #17140F; background: transparent;
  padding: 20px 44px; font-size: 13px; letter-spacing: 0.01em;
  cursor: pointer; transition: border-color 300ms;
  font-family: 'Instrument Sans', system-ui, sans-serif;
}
.bav-cta-secondary:hover { border-color: #17140F; }

/* Italic swash for Fraunces at display sizes */
.bav-italic { font-style: italic; font-variation-settings: 'opsz' 144; }

/* Generic link hover */
.bav-hover-opa { transition: opacity 300ms; }
.bav-hover-opa:hover { opacity: 0.6; }

/* Thumbnail selector */
.bav-thumb { cursor: pointer; transition: opacity 300ms; }
.bav-thumb:hover { opacity: 1 !important; }
```

---

## 4. Design signatures — carry across every artefact

1. **Italic swash on one word per display heading**
   - "Aegis *Ultra*"
   - "Computers, *considered*"
   - "Order to *doorstep*"
   - "Considered from the *socket*"
   - "Adjacent *builds*"

2. **№[build-number] gallery device** — instead of needing 213 unique product photos, every product has a unique build number rendered as huge Fraunces italic (clamp 200–420px) inside a `.bav-canvas` block. Format: `<span class="bav-italic">№</span>073`. Pulled from product.sku or a dedicated buildNumber field.

3. **Section labels** — `— The build`, `— Specification`, `— What happens next`, `— Also considered` (em dash + `.bav-label`). Used as the first element of major sections.

4. **Sticky right column on product detail** — info column is sticky at `top: 96px`.

5. **Two-column editorial layout** — 4-col label left, 8-col body right for section introductions. Gives the page rhythm like a magazine.

6. **Hairline-divided spec tables** — 1fr / 2fr grid, `border-top: 1px solid ink10` on every row, last row also has `border-bottom`.

7. **Build numbering threaded through the UI** — breadcrumb ("Build 073 / 213"), gallery ("№073"), card meta ("Build 073"), birth certificate. Coherent identity.

8. **Mono for anything numerical** — prices, SKUs, phone numbers, pagination ("01 / 37"), order numbers, dates in tables, tabular data.

9. **One green pulse dot in the nav or inline with "In stock"** — that's the entire surface area the brand green gets. Do not use it for buttons, chips, fills, underlines, or borders.

10. **Trust signals as editorial copy, never as badges** — "12 months · parts & labour", "30 days · no questions" inline in small grids, not chip-style.

---

## 5. Next.js routes

### Storefront (real paths, use in hrefs)
```
/                               home
/shop                           catalogue index
/shop/[slug]                    category page, slug = category.slug
                                (e.g. "gaming-pc-bundles", "laptops",
                                 "monitors", "all-in-one-pc",
                                 "network-equipment", "parts",
                                 "projectors", "projector-lenses",
                                 "printers", "av-switches",
                                 "hard-drive", "power-supply-chargers",
                                 "computers", "other")
/product/[slug]                 product detail, slug = product.slug
/builders                       roster masthead
/builders/[code]                builder profile, code = builder.builderCode
                                (e.g. "BLD-004")
/cart                           full cart page
/checkout                       single-page accordion checkout
/account                        dashboard
/account/orders                 orders list (new, replaces /orders)
/account/orders/[orderNumber]   order detail
/account/returns                returns list
/account/returns/[returnNumber] return detail
/account/addresses              addresses manager
/account/security               password, 2FA, passkeys
/account/notifications          email/push/Telegram prefs
/account/av-care                subscription warranty dashboard
/account/av-care/claim/new      submit a claim
/account/av-care/claim/[id]     claim detail + status timeline
/av-care                        AV Care marketing landing
/av-care/subscribe              plan picker + Stripe Checkout handoff
/returns/new                    start RMA flow (gated)
/support                        support hub
/help                           help centre index
/help/[slug]                    help article
/auth/login                     sign in
/auth/register                  create account
/auth/forgot                    forgot password
/auth/reset                     reset with token
```

### Content pages
```
/about                          editorial about page
/warehouses                     editorial — workshops / facilities
/careers                        jobs
/contact                        contact form + addresses
/journal                        (optional) editorial index
/journal/[slug]                 editorial article
```

### Legal pages
```
/terms                          terms & conditions
/privacy                        privacy policy
/cookies                        cookie policy
/modern-slavery                 modern slavery statement
/warranty                       warranty terms
/shipping                       shipping terms
/returns-policy                 returns policy
/accessibility                  accessibility statement
```

### Admin (staff only — prefix /admin)
```
/admin/dashboard
/admin/builders
/admin/orders
/admin/orders/[id]
/admin/returns
/admin/support
/admin/products
/admin/settings                 Profile / Security / Staff tabs
/admin/builder-portal           builder queue + scan + QC
```

**Routes that don't exist yet — use `#` or create them:**
- `/search` (global search results)
- `/wishlist` (if we're adding)

---

## 6. Prisma data shapes — mirror these exactly

Every artefact should put hardcoded demo data in a `const data = { ... }` block at the top of the component, using these field names. When the artefact ships to me, I swap that block for a real Prisma query and the component works unchanged.

### Product (Postgres)
```ts
{
  productId: string,                    // UUID
  sku: string,                          // e.g. "BAV-DEMO-0042"
  slug: string,                         // URL-safe, unique
  title: string,                        // "Aegis Ultra RTX 4090 Gaming PC"
  subtitle: string | null,              // "Ryzen 7 5800X · 32GB · 1TB NVMe"
  conditionGrade: 'New' | 'Like New' | 'Excellent' | 'Very Good' | 'Good',
  priceGbp: number,
  costGbp: number,
  compareAtGbp: number | null,          // for sale badging (show strikethrough)
  warrantyMonths: number,               // default 12
  shippingWeightKg: number | null,
  primaryImageUrl: string | null,
  imageUrls: string[],
  descriptionHtml: string | null,       // pre-sanitised HTML from AI
  isActive: boolean,
  isFeatured: boolean,
  ebayListingId: string | null,
  createdAt: Date,
  updatedAt: Date,

  // relations (populate when needed)
  builder: Builder,                     // see below
  category: { slug, name },
  inventory: { stockQty, reservedQty, reorderThreshold },
  specs: ProductSpecs,                  // from Mongo, see below
}
```

### ProductSpecs (Mongo `product_catalog`)
```ts
{
  cpu: {
    brand: string,                      // "Intel" | "AMD" | "Apple" | "NVIDIA"
    family: string,                     // "Core Ultra 9" | "Ryzen 9" | "M3" | "Threadripper"
    model: string,                      // "285K" | "9950X3D" | "M3 Ultra"
    cores: number,
    threads: number,
    baseClockGhz: number,
    boostClockGhz: number,
  } | null,
  gpu: {
    brand: string,                      // "NVIDIA" | "AMD" | "Intel"
    model: string,                      // "RTX 5090" | "RX 7900 XTX" | "Arc A770"
    vramGb: number,
    rtx: boolean,
  } | null,
  memory: {
    sizeGb: number,                     // 16 | 32 | 64 | 128 | 256
    type: string,                       // "DDR5" | "DDR4" | "LPDDR5X"
    speedMhz: number,
    slotsUsed: number,
    slotsTotal: number,
  } | null,
  storage: [{
    kind: 'ssd_nvme' | 'ssd_sata' | 'hdd' | 'optane',
    capacityGb: number,
    brand: string,
    model: string,
    interface: string,
  }],
  motherboard: { brand, model, socket, chipset, formFactor } | null,
  cooling: { type, brand, model, radiatorMm, fans } | null,
  case: { brand, model, formFactor, colour, windowed } | null,
  psu: { brand, model, wattage, rating, modular } | null,
  os: { name, version, edition, activated } | null,
  ports: Record<string, unknown>,
  networking: { wifi, bluetooth, ethernetGbps } | null,
  dimensions: { heightMm, widthMm, depthMm, weightKg } | null,
}
```

### Builder
```ts
{
  builderId: string,                    // UUID
  builderCode: string,                  // "BLD-004"
  displayName: string,                  // "Alfie Ashworth"
  legalName: string | null,
  tier: 'probation' | 'standard' | 'preferred' | 'elite',
  status: 'active' | 'review' | 'suspended' | 'offboarded',
  joinedAt: Date,
  avatarUrl: string | null,
  bio: string | null,                   // 2-3 sentences, British tech-shop voice
  specialities: string[],               // ["Gaming PCs", "Silent builds", "Water cooling"]
  yearsBuilding: number,
  favouriteBuild: string | null,        // one-line quote about their favourite rig
  qualityScore: number,                 // 0-5, Decimal in DB
  rmaRateRolling90d: number,            // 0-1, Decimal in DB
  totalUnitsBuilt: number,
  totalUnitsSold: number,
  avgBuildMinutes: number,
  avgResponseHours: number,
}
```

### Order
```ts
{
  orderId: string,
  orderNumber: string,                  // "BAV-260418-739201"
  userId: string,
  status: 'draft' | 'pending_payment' | 'paid' | 'queued' | 'in_build'
        | 'qc' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
  subtotalGbp: number,
  shippingGbp: number,
  taxGbp: number,
  discountGbp: number,
  totalGbp: number,
  currency: 'GBP',
  paymentMethod: 'stripe_card' | 'paypal' | 'manual' | null,
  paymentIntentId: string | null,
  paymentCapturedAt: Date | null,
  shippingAddress: {                    // JSON column
    line1: string, line2: string | null,
    city: string, region: string | null,
    postcode: string, countryIso2: string
  } | null,
  billingAddress: typeof shippingAddress,
  customerNotes: string | null,
  queuedForBuildAt: Date | null,
  shippedAt: Date | null,
  deliveredAt: Date | null,
  cancelledAt: Date | null,
  createdAt: Date,

  items: OrderItem[],
}
```

### OrderItem (a.k.a. OrderLine)
```ts
{
  orderItemId: string,
  orderId: string,
  productId: string,
  builderId: string,
  unitId: string | null,                // bound when a specific built unit is assigned
  qty: number,
  pricePerUnitGbp: number,
  costPerUnitGbp: number,

  // joined in when rendering
  product: { title, slug, primaryImageUrl, sku },
  builder: { displayName, builderCode, avatarUrl },
  unit: { serialNumber, currentState } | null,
}
```

### CartLine (client Zustand shape — this is what the cart drawer + page renders)
```ts
{
  productId: string,
  title: string,
  slug: string,
  pricePerUnitGbp: number,
  qty: number,
  imageUrl: string | null,
}
```

Server-side `CartSession` mirrors this inside a JSON `items` column. Don't worry about the server shape when building artefacts — just use the client shape.

### Return
```ts
{
  returnId: string,
  returnNumber: string,                 // "RMA-2604-1003"
  orderItemId, orderId, productId, builderId, requestedByUserId: string,
  reason: 'dead_on_arrival' | 'hardware_fault' | 'not_as_described'
        | 'damaged_in_transit' | 'changed_mind' | 'wrong_item' | 'other',
  reasonDetails: string | null,
  status: 'requested' | 'approved' | 'rejected' | 'in_transit'
        | 'received' | 'refunded' | 'resolved' | 'escalated',
  refundAmountGbp: number,
  restockingFeeGbp: number,
  aiSeverity: number | null,            // 0-1
  aiFlaggedPattern: string | null,
  resolutionNotes: string | null,
  approvedAt: Date | null,
  refundedAt: Date | null,
  createdAt: Date,
}
```

### User (customer + staff — discriminated by role)
```ts
{
  userId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  phone: string | null,
  avatarUrl: string | null,
  bio: string | null,
  role: 'customer' | 'builder' | 'support_staff' | 'admin' | 'super_admin',
  mfaEnabled: boolean,
  emailVerifiedAt: Date | null,
}
```

### SupportTicket
```ts
{
  ticketId, ticketNumber: string,       // "TKT-2604-50001"
  userId: string,
  orderId: string | null,
  productId: string | null,
  subject: string,
  channel: 'web_widget' | 'email' | 'telegram' | 'phone',
  status: 'open' | 'ai_handling' | 'escalated_human'
        | 'awaiting_customer' | 'resolved' | 'closed',
  aiConfidence: number | null,
  sentimentScore: number | null,
  resolvedAt: Date | null,
  createdAt: Date,
  messages: SupportMessage[],
}
```

### WebauthnCredential (for passkey UI)
```ts
{
  credentialId: string,                 // base64url
  userId: string,
  nickname: string | null,              // "MacBook Touch ID", "iPhone 15 Pro"
  deviceType: 'single_device' | 'multi_device',
  backedUp: boolean,
  lastUsedAt: Date | null,
  createdAt: Date,
}
```

### AvCareSubscription (subscription warranty, per-account billing)
```ts
{
  subscriptionId: string,
  userId: string,                       // one active subscription per user
  tier: 'essential' | 'plus',
  status: 'trialing' | 'active' | 'past_due'
        | 'paused' | 'cancelled' | 'expired',
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  monthlyPriceGbp: number,              // tier-dependent, see below
  claimExcessGbp: 100,                  // locked at £100 per claim, both tiers
  trialEndsAt: Date | null,             // null once trial converts
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  startedAt: Date,
  cancelledAt: Date | null,
  coveredProductIds: string[],          // all products on this account (per-account billing)
  createdAt: Date,
  updatedAt: Date,
}
```

Tier pricing (placeholders — confirm at Stripe setup):
- `essential`: £14.99/mo · parts & labour · in-workshop repair · standard turnaround
- `plus`: £29.99/mo · parts & labour · courier collection · priority turnaround · single loan unit during repair

### AvCareClaim (one claim = one unit sent in for repair)
```ts
{
  claimId: string,
  claimNumber: string,                  // e.g. "AVC-000127"
  subscriptionId: string,
  userId: string,
  productId: string,                    // the unit being claimed on
  unitId: string | null,                // serial-specific Unit if registered
  reason: 'hardware_fault' | 'performance_degradation'
        | 'cosmetic_damage' | 'accidental'
        | 'other',
  description: string,
  photoUrls: string[],                  // uploaded to our storage
  status: 'submitted' | 'assessing'
        | 'awaiting_excess_payment'
        | 'awaiting_unit'
        | 'in_repair' | 'in_qc'
        | 'returning' | 'resolved'
        | 'rejected',
  excessPaidAt: Date | null,
  excessStripePaymentIntentId: string | null,
  aiAssessmentSummary: string | null,   // Claude-generated triage note
  aiConfidence: number | null,
  assignedBuilderId: string | null,
  repairStartedAt: Date | null,
  repairCompletedAt: Date | null,
  shippedBackAt: Date | null,
  resolvedAt: Date | null,
  rejectionReason: string | null,
  createdAt: Date,
  updatedAt: Date,
  messages: SupportMessage[],           // reuses SupportMessage schema
}
```

### Component (inventory — one physical part)
```ts
{
  componentId: string,
  componentTypeId: string,
  manufacturer: string | null,          // "NVIDIA", "Samsung", "Corsair"
  model: string | null,                 // "RTX 5090 Founders", "990 Pro 2TB"
  serialNumber: string | null,
  conditionGrade: string | null,        // 'New' | 'Like New' | 'Excellent' | 'Very Good' | 'Good'
  costGbp: number | null,
  supplier: string | null,
  notes: string | null,
  currentLocation: string | null,       // "bin A3" | "workbench 2" | "dispatched"
  boundToUnitId: string | null,         // null until bound to a build
  receivedAt: Date,
  qrCodes: QrCode[],                    // usually one sticker per component
  type: ComponentType,
  movements: InventoryMovement[],
}
```

### ComponentType (taxonomy)
```ts
{
  componentTypeId: string,
  code: string,                         // 'cpu' | 'gpu' | 'ram' | 'ssd' | 'hdd' | 'psu' | 'chassis' | 'mobo' | 'cooler' | 'fan' | 'cable' | 'other'
  label: string,                        // "CPU", "Graphics card", etc
}
```

### QrCode (one printed sticker)
```ts
{
  qrId: string,                         // "BAV-INV-000001" — printed on the sticker
  batchId: string,
  componentId: string | null,           // null until first scan claims the sticker
  claimedAt: Date | null,
  createdAt: Date,
}
```

### QrBatch (a printed run of stickers)
```ts
{
  batchId: string,
  prefix: string,                       // "BAV-INV"
  startNumber: number,
  count: number,                        // 200 stickers per batch typically
  pdfUrl: string | null,                // generated PDF ready to send to printer
  printedAt: Date,
  createdBy: string | null,             // userId of the admin who generated it
}
```

### InventoryMovement (audit trail — every scan event)
```ts
{
  movementId: string,
  componentId: string,
  qrId: string,
  action: 'registered' | 'moved' | 'bound_to_build' | 'unbound' | 'written_off' | 'returned_to_stock',
  fromLocation: string | null,
  toLocation: string | null,
  actorId: string | null,               // who scanned
  notes: string | null,
  occurredAt: Date,
}
```

### Review (updated — adds photos + admin moderation + verified purchase)
```ts
{
  reviewId: string,
  productId: string,
  userId: string,
  orderItemId: string | null,           // set when review is linked to an actual purchase line
  rating: number,                       // 1-5 integer
  title: string | null,
  body: string,
  photoUrls: string[],                  // up to 5 photo URLs
  verifiedPurchase: boolean,            // true when linked to orderItem and user matches
  adminStatus: 'pending' | 'approved' | 'rejected' | 'flagged',
  adminModeratedBy: string | null,
  adminModeratedAt: Date | null,
  helpfulCount: number,                 // "N people found this helpful"
  createdAt: Date,
}
```

---

## 7. Shop page filter facets — what's actually indexed

Design the filter sidebar around these. Do NOT invent facets that aren't here.

### Postgres-indexed (fast, primary)
| Facet | Source | UI |
|---|---|---|
| Category | `products.categoryId → product_categories.slug` | checkbox list, 14 options |
| Price range | `products.priceGbp` (indexed) | 2-handle slider, £0-£15,000 |
| Condition | `products.conditionGrade` | pill list: `New`, `Like New`, `Excellent`, `Very Good`, `Good` |
| Builder | `products.builderId → builders.builderCode + displayName + tier` | 22 rows, searchable |
| In stock | `product_inventory.stockQty > 0` | toggle |
| On sale | `products.compareAtGbp IS NOT NULL` | toggle |
| Featured | `products.isFeatured` | toggle |
| Warranty | `products.warrantyMonths` | pill list: 12 / 24 / 36 |

### Mongo-indexed (slightly slower, secondary "Specifications" drawer)
| Facet | Source | UI |
|---|---|---|
| CPU brand | `specs.cpu.brand` | Intel / AMD / Apple / NVIDIA |
| CPU family | `specs.cpu.family` | Ryzen 9 / Core Ultra 9 / Threadripper / Xeon W / M3 |
| GPU brand | `specs.gpu.brand` | NVIDIA / AMD / Intel Arc |
| GPU model | `specs.gpu.model` | RTX 5090 / 4080 / 4070 Ti / RX 7900 / etc |
| RTX | `specs.gpu.rtx` | toggle |
| GPU VRAM | `specs.gpu.vramGb` | 8 / 12 / 16 / 24 / 32+ |
| RAM capacity | `specs.memory.sizeGb` | 16 / 32 / 64 / 128 / 256+ |
| RAM type | `specs.memory.type` | DDR4 / DDR5 / LPDDR5X |
| Storage | `specs.storage[0].capacityGb` | 500GB / 1TB / 2TB / 4TB+ |
| OS | `specs.os.name` | Windows 11 / macOS / Linux |

### Do NOT promise
- Socket (unreliably populated)
- Case form factor
- Fan count, noise level, power draw
- Global "brand" (Dell / HP / Lenovo) — we'd have to infer from title

### Sort options
`Relevance` / `Newest` / `Price low-high` / `Price high-low` / `Bestseller`

### Pagination
24 per page default, mono `01 / 37` style, prev/next hairline arrows.

---

## 8. The 66 artefacts — full inventory

Batch these into claude.ai conversations of 8-10 each. Mark each conversation "Birmingham AV — batch [N]".

### P0 — Storefront core (12)
1. **Nav + Footer shared shell** — 60px sticky nav (wordmark left, 4 links centre, Search / Account / Cart right). Footer with columns, payment method line as text, copyright, Mickai™ line.
2. **Homepage** — one Fraunces display headline ("Computers, *considered*."), one subhead, one link. 3 category tiles with large photography. "From the workshop" section with 2-3 builder stories. One editorial journal teaser. NO stat counters, NO testimonial carousel, NO logo bar.
3. **Shop index `/shop`** — filter sidebar + 3-col grid at 1440px (2 tablet, 1 mobile). 4:5 imagery using `.bav-canvas` with `№[number]` device. Product name + price only. Out-of-stock-only micro-label. Pagination `01 / 37`.
4. **Category `/shop/[slug]`** — same component, plus a hero block at the top with category name in Fraunces + one-sentence editorial intro.
5. **Product detail `/product/[slug]`** — the reference artefact at `birmingham-av-product.jsx`. Already done; use verbatim.
6. **Cart drawer** (slides from right on add-to-cart) — 3-line quick view per item, subtotal, two CTAs ("View cart" secondary, "Checkout" primary). Inset-x-4 on mobile.
7. **Cart page `/cart`** — full quantity controls, promo code input, shipping estimate, trust row (warranty / shipping / returns), "Also considered" rail.
8. **Checkout `/checkout`** — single-page accordion: Contact → Shipping → Payment → Review. Each completed section collapses to a summary with "Edit" link. Sticky right column with order summary. Payment options: Card (Stripe Elements placeholder), PayPal, Apple Pay, Google Pay, Klarna, Clearpay, Invoice/BACS.
9. **Order confirmation** — shown after checkout success. Fraunces "Thank you" headline, order number in mono, shipping info, "Continue shopping" + "Track order" links.
10. **Builders `/builders`** — editorial masthead grid. 3-col desktop / 2 mobile. Portrait (`.bav-ink-canvas` placeholder) + name (Fraunces) + role + one-line bio + "Builds: […]".
11. **Builder profile `/builders/[code]`** — long-form editorial. Large portrait left, name + tier + years + specialities right, bio paragraph, stats block (units built, quality score), favourite build quote, "Products by [name]" rail.
12. **Sign in `/auth/login`** — two-column: editorial left with brand line + small copy, right with login form. Email + password, "Sign in with passkey" secondary, "Create account" / "Forgot password" links.

### Shared account layout (applies to artefacts 13–20 and P3 account-scoped artefacts 50–52)

Every `/account/*` route shares the same layout shell. Establish it on the first account artefact produced (13), then fence it as shell and reuse verbatim across all subsequent account artefacts — same rules as Nav + Footer.

**Desktop (≥900px):**
- Sticky left sidebar, **240px wide**, hairline right border (`1px solid ${ink10}`).
- Sidebar starts 32px below the nav's 60px sticky row, scrolls independently if content exceeds viewport.
- Top of sidebar: `.bav-label` ink60 reading **"— Account"**.
- Nav links stacked vertically, 14px Instrument Sans, 16px line-height, `gap: 22px`. Active link is plain ink; inactive is ink60 with `.bav-hover-opa`.
- Fixed link order: **Dashboard · Orders · Returns · Addresses · AV Care · Security · Notifications**.
- Below a hairline divider at the bottom: "Sign out" link in `.bav-label` ink30 → ink60 on hover.

**Mobile (<900px):**
- Sidebar collapses to a horizontal scrollable **tab bar** directly below the main nav, sticky at top: 60px.
- Same link labels, same order. Active tab has a `2px` ink underline. Inactive tabs are ink60.
- Tab bar scrolls horizontally when it overflows; no hamburger, no disclosure menu.
- 12px right-padding on the last tab so it doesn't crash against the viewport edge.

**Main content column:**
- Flex-1, `max-width: 880px`, `padding: 48px`.
- Mobile: `padding: 32px 24px`.
- First child of main column is always an `h1` in Fraunces 300, `clamp(32px, 3.5vw, 48px)`, unique per page (e.g. "Orders.", "Your addresses.", "Security.").

**AV Care link badge:**
- When `session.user.avCareSubscription?.status === 'trialing'`, append a green pulse dot after the "AV Care" label in the sidebar.
- When status is `past_due`, append the red dot (same dot geometry, `#B94040`).

### P1 — Account + support (12)
13. **Account dashboard `/account`** — "Welcome, [first name]" in Fraunces, tile grid: Orders, Returns, Addresses, Notifications, Security, Sign out.
14. **Orders list `/account/orders`** — table: order number (mono), date, items preview, total, status, action.
15. **Order detail `/account/orders/[orderNumber]`** — status timeline (Paid → Queued → In build → QC → Shipped → Delivered), items with builder credits, addresses, invoice download, RMA start per item.
16. **Returns new `/returns/new`** — order picker, item picker, reason radio, detail textarea, photo upload. Editorial layout, not forms-heavy.
17. **Return detail `/account/returns/[returnNumber]`** — status, reason, refund amount, AI analysis summary, conversation thread.
18. **Addresses `/account/addresses`** — list + edit drawer + add new form.
19. **Security `/account/security`** — password change, 2FA TOTP enroll/disable, passkeys list + enroll + rename + remove.
20. **Notifications `/account/notifications`** — toggles for email, push, Telegram opt-in.
21. **Help centre index `/help`** — search bar, category tiles, contact CTA.
22. **Help article `/help/[slug]`** — editorial long-form with related articles sidebar.
23. **Support hub `/support`** — "Start a chat" CTA (opens floating widget), common issues, contact form.
24. **Support chat widget** — floats bottom-right. AI + human turns differentiated, typing indicator, escalation banner.

### P1 — Content + legal (5)
25. **Editorial template** — reusable. Large Fraunces headline, hero media slot, editorial body with pull-quote support, image gallery support, byline + date optional. Used for `/about`, `/warehouses`, `/careers`, `/contact`, `/journal/[slug]`.
26. **Legal template** — reusable. Sticky TOC sidebar, numbered clause system, last-updated banner, dense type, hairline dividers. Used for `/terms`, `/privacy`, `/cookies`, `/modern-slavery`, `/warranty`, `/shipping`, `/returns-policy`, `/accessibility`.
27. **404 page** — editorial restraint. Fraunces "Not found", one line, one link home.
28. **500 / error pages** — same treatment.
29. **Cookie consent banner** — bottom sheet, "Accept all / Manage / Reject" with granular toggles, paper bg, hairline border.

### P1 — Forms + micro-states (4)
30. **Register `/auth/register`** — email + password + name, Google OAuth option, same layout as sign in.
31. **Forgot password / reset** — minimal single-column forms.
32. **Empty states** — empty cart, empty order list, empty returns, zero search results.
33. **Loading skeletons** — product grid, product detail, order timeline (`.bav-canvas` blocks as shimmer replacements).

### P2 — Admin (staff only) (13)
34. **Admin login** — redirects to `/admin/dashboard` if role is staff.
35. **Admin dashboard `/admin/dashboard`** — KPI strip (revenue today / week / month, orders, flagged returns, open tickets, active builds), activity feed, live build queue.
36. **Builders roster `/admin/builders`** — table with tier chip, units sold 90d, revenue, margin, ROI, RMA rate (colour-graded), 14d trend sparkline. Row click → slide-over.
37. **Builder detail slide-over** — performance history, active builds, returns, AI flags with ack/resolve.
38. **Orders `/admin/orders`** — filterable table, row click to detail.
39. **Order detail (admin)** — full view with status transition buttons, refund button, assign builder, customer message.
40. **Returns `/admin/returns`** — queue with AI severity column, detail view with AI analysis + approve/reject/escalate.
41. **Support inbox `/admin/support`** — two-pane: ticket list left sorted by last activity, conversation right with AI turns marked + "Take over" button.
42. **Products `/admin/products`** — CRUD table, bulk activate/deactivate, "Re-sync from eBay" button.
43. **Settings `/admin/settings`** — Profile / Security / Staff tabs (already built — just needs visual restyle to match tokens).
44. **Builder portal `/admin/builder-portal`** — builder's view of their queue, start build, scan components, QC checklist, mark complete. Mobile-first.
45. **Warehouse QR scan** — mobile scanner UI for stock-take. Big scan target, component type + qty entry on scan, reconcile report.
46. **Reports / BI** — funnel analysis, cohorts, LTV, builder performance charts.

### P3 — AV Care subscription warranty (6)
Shared product decisions locked in chat:
- Name: **AV Care**.
- Two tiers: `essential` and `plus`. Do not invent a third.
- Claim excess: **£100 per claim**, both tiers. Same number everywhere.
- Billing: **per account**, not per product. One subscription covers every BAV product registered to that user.
- Free trial: **yes**. Assume 30 days at signup unless I override.
- Voice: editorial, factual. No "peace of mind" / "worry-free" / "protect your investment" phrasing. Say what it covers and what it costs.

47. **AV Care marketing page `/av-care`** — editorial landing. Fraunces headline ("Keep it running, *indefinitely*." or similar — Claude Web's call, italic swash on one word). One paragraph explaining what AV Care is: a monthly subscription that covers parts and labour across every BAV product registered to your account, with a flat £100 excess per claim. Two tier cards side by side (use Artefact 48 component). Three-step claim process with №01 / №02 / №03 Fraunces italic numerals. "Read the terms →" underline link to `/warranty` (legal). No testimonials, no badges, no star ratings.
48. **AV Care tier card (shared component)** — hairline-bordered panel. Tier name in Fraunces 32 (italic on the tier word: "Essential" plain, "*Plus*" italic swash to differentiate). Monthly price in mono-28 (`£14.99 /mo` format — space before `/mo`). Feature list as hairline-divided rows, each with a thin ✓ stroke (no filled tick). CTA: primary `.bav-cta` "Start free trial" on the tier being promoted, `.bav-cta-secondary` "Choose Essential / Plus" on the other. Disabled state when user already has that tier active. Re-used on `/av-care`, `/av-care/subscribe`, `/account/av-care`.
49. **Subscribe flow `/av-care/subscribe`** — two-column. Left: both tier cards (A48) side by side with the "Start free trial" on whichever the user clicked from marketing pre-selected. Right: sticky summary panel showing "Your coverage: N products" with a scrollable list of the products registered to the account, then a "Continue with [tier]" primary CTA that hands off to Stripe Checkout. Below the CTA: micro-copy — "First 30 days free. Then [tier price]/mo. Cancel anytime. £100 excess per claim."
50. **Account → AV Care section `/account/av-care`** — dashboard block. Header: current plan name in Fraunces + status badge (`Trialing — 14 days left` / `Active` / `Cancelling on [date]` / etc). Next invoice date + amount in mono. "Switch plan" underline link → opens Artefact 48 with the other tier as the active CTA. "Cancel subscription" as a `.bav-label` ink30 → ink60 hover link, below everything. Below that: **Claims history** table (claim number mono, date, product title, status chip, action link). Empty state: "No claims yet. Nothing to worry about." in Fraunces italic. Also: "Products covered" collapsible list showing registered products.
51. **Claim submission `/account/av-care/claim/new`** — single-page form, editorial. Step 1: unit picker — scrollable list of user's registered products with №buildNumber canvas thumbnails; click to select. Step 2: reason radios (hairline square pattern from shop filters) — Hardware fault / Performance / Cosmetic / Accidental / Other. Step 3: description textarea + photo upload (max 5, drag-and-drop). Summary panel on right: "£100 excess will be charged on acceptance. Repair turnaround: [tier-dependent]. Loan unit: Plus only." Primary CTA "Submit claim" submits then routes to Artefact 52 with status `submitted`.
52. **Claim detail `/account/av-care/claim/[id]`** — two-column. Left: status timeline (Submitted → Assessing → Excess paid → Unit received → In repair → In QC → Returning → Resolved). Each step is a hairline row with mono date on the right once reached, ink30 when pending. AI assessment summary panel below the timeline (when status = `assessing` or later): "Our assessment:" in `.bav-label`, then Claude-generated prose, then confidence score in mono. Right: unit card with №buildNumber thumbnail, product title, serial, builder credit, original purchase date. Message thread below (reuses SupportMessage thread UI from support widget). At the bottom: `Pay £100 excess →` CTA visible only when status = `awaiting_excess_payment`.

### P5 — Inventory + QR system (6)
Hamzah buys physical QR stickers or prints from the app, sticks them on incoming components, scans to register. During builds, components are scanned to bind them to a Unit.

Voice: functional, workshop-facing. Less editorial than storefront — this is a tool, not a shop window. Still uses the design tokens and `.bav-*` utilities, but copy is direct: "Scan a QR to register a component", not "Bring each part into the story."

53. **Inventory dashboard `/admin/inventory`** — admin shell. Four KPI tiles across the top: Components in stock / Low-stock alerts / Scans today / Unassigned QR codes. Below: two columns — **Recent movements** (timeline of scan events, action + component + who + when) + **Low-stock alerts** (component types below threshold). Both rendered as hairline-divided tables in mono. CTAs: `Generate QR batch →`, `Import components →`, `Bulk export (CSV) →`.
54. **QR generation `/admin/inventory/qr-generate`** — single form. Inputs: prefix (default `BAV-INV`), start number (auto-suggested next available), count (1-500). Preview panel on the right shows a 3×3 mini grid of the first 9 stickers as they'll print. Primary CTA "Generate and download PDF". After generation: shows batch ID in mono, download link, "Start another batch" secondary link.
55. **Component register `/admin/inventory/register/[qrId]`** — single-column form reached by scanning an unclaimed QR on mobile. If the QR is unclaimed, show this form; if claimed, redirect to detail (artefact 56). Form fields: component type (dropdown, 12 options from `ComponentType.code`), manufacturer (text), model (text), serial number (text, optional), condition (pill selector: New / Like New / Excellent / Very Good / Good), cost (mono-inputted), supplier (text), initial location (text — "bin A3"). Photo upload (1 photo, optional). Primary CTA "Register component". Confirmation: "{qrId} registered. Scan the next QR to continue."
56. **Component detail `/admin/inventory/[qrId]`** — two-column. Left: component specs (hairline-divided rows — type, manufacturer, model, serial, condition, cost, supplier, received date, current location). **Movement history** table below with every scan event. Right sticky: status card (green pulse dot if in stock, amber if at workbench, ink30 if dispatched/bound), "Move location" CTA, "Bind to build" CTA, "Write off" CTA as `.bav-label` ink30 destructive link at the bottom.
57. **Bulk import `/admin/inventory/import`** — two-stage flow. Stage 1: drag-and-drop CSV upload area with a link to download a template CSV. Stage 2: preview table showing first 20 rows parsed, column mapping dropdowns (map CSV columns to Component fields), validation errors highlighted in row-level red (`#B94040`). Primary CTA "Import {N} components". Success state: "Imported {N}. {M} skipped. Download error report →". Support both pre-existing-QR mode (CSV includes qrId column) and unclaimed-pool mode (CSV includes no qrId, app allocates from the next unclaimed batch).
58. **Inventory search `/admin/inventory/search`** — full catalogue search. Left sidebar: filters (component type multiselect, location multiselect, condition pills, stock status, date range). Main: search input at top + results grid (2-col at desktop, 1-col mobile) of component cards — each shows qrId in mono, type + model, location, cost. Click any card → artefact 56. Empty state: "No components match. Try removing a filter." Pagination: 48 per page, mono `01 / 12`.

### P4 — Commerce essentials (4)
Missing pieces for a production e-commerce site. Search, reviews, journal index, and VAT invoicing.

59. **Search results `/search`** — global search across products, help articles, builders, journal. Top: search input (pre-filled with query), result count + sort dropdown. Below: **Products** section (grid of tiles, same pattern as shop listing, max 8 then "See all products →") + **Articles** section (list of help article links with excerpts, max 5) + **Builders** section (row of 4 builder portrait cards) + **Journal** section (long-form teaser cards). Empty state: "No matches for '{query}'. Try a simpler term or browse the [catalogue](shop) / [help centre](help)." Each section heading uses `.bav-label`.
60. **Product reviews** — TWO pieces in one artefact. Part A: `<ReviewSubmissionForm>` reached from a post-delivery email link `/product/{slug}/review?orderItem={id}`. Editorial form: "— Leave a review" label, Fraunces "How did it turn out?", star selector (5 thin outlined stars, filled on select), title field (optional), body textarea, photo upload (up to 5). Verified-purchase badge: `.bav-label` ink30 "Verified purchase · Built by {builder.displayName}". Submit routes to moderation queue. Part B: `<ReviewsList>` shown on `/product/[slug]` below the specification section — each review in a grid of `180px 1fr` (same pattern as MessageBlock from A17): left column has rating + date + verified badge + reviewer first name, right column has title + body + photos + "Helpful ({n})" link. Empty state shows when product has 0 reviews: "No reviews yet. Be the first →" linking to submission form.
61. **Journal index `/journal`** — editorial list of all articles. Title in Fraunces: "The *journal*." Eyebrow: "— Writing from the workshop". Below: list of articles (not a grid — a single column list, editorial register). Each article row: date (mono-11 ink30), title (Fraunces 32), dek (16px ink60 2-line clamp), read time (mono-11 ink30). Separated by hairlines. 10 per page. "Older pieces →" pagination.
62. **VAT invoice template** — printable PDF invoice rendered from order data, accessed via `/account/orders/[orderNumber]/invoice` and emailed on order. Layout (A4 portrait): top-right Birmingham AV wordmark + address + VAT number. Top-left: "INVOICE" in Fraunces 40, invoice number (matches order number) in mono, issue date. Below: billing address left, shipping address right. Line items table: SKU mono-11 / description / qty / unit price ex VAT / total ex VAT. Below: VAT summary (subtotal ex VAT, VAT 20%, total inc VAT) in a 2-col right-aligned block. Footer: payment method + timestamp, Birmingham AV Ltd registered company number, "Thank you for your order." in Fraunces italic small. No colour — pure hairlines + tokens + typography. Must be static HTML that renders well via Puppeteer/React PDF.

### P6 — Email templates (4)
Shared shells for all transactional emails. Email clients (especially Outlook + Gmail) have CSS limits — these templates use tables, inlined hex colours, web-safe Georgia fallback for Fraunces. Claude Code converts each of these into `@react-email/components` after the design lands.

63. **Email: Transactional shell** — base template used by every email. Fenced between `// --- EMAIL SHELL START ---` / `// --- EMAIL SHELL END ---`. 640px max width. Header: wordmark in Fraunces 26 (Georgia fallback), centered, above a 1px hairline. Body slot. Footer: company address + VAT number + unsubscribe link, all in mono-11 ink60 separated by hairlines. Props: `{ preheader, children, footerNote? }`. Preheader is hidden text at the top for inbox preview.
64. **Email: Order receipt block** — shared block used in order confirmation, dispatched, delivered emails. Line items table with mini №buildNumber canvas (32×40), title + subtitle, qty + line total. Subtotal / shipping / total rows. Status indicator at top ("Order placed", "Your order has shipped", "Delivered") with a mono eyebrow. Uses Transactional shell (A63). Props: `{ status, orderNumber, items, subtotal, shipping, total, trackingLink? }`.
65. **Email: Status timeline block** — 5-step hairline grid used in build progress emails and AV Care claim updates. Steps shown as stacked rows (email clients break multi-col grids): mono step number, step name, status (pending / current / done with `.bav-pulse` dot only on current), description. Takes any array of step objects, highlights `currentStepIndex`. Used by dispatched-notice, claim status changes, return progress.
66. **Email: Editorial notification block** — long-form email body for trial-ending, back-in-stock, journal-new-article, welcome. Centred single-column, 560px max, Fraunces headline (with italic swash word), subhead, one paragraph, single `.bav-cta` button. Uses Transactional shell (A63). Props: `{ headline, italicWord, subhead, body, cta?: { label, href } }`.

---

## 9. Output format requirements

Every artefact must:

1. **Single default-exported React functional component.** No TypeScript — plain JSX.
2. **Imports limited to `react`.** No npm packages. No icon libraries. Draw any icons inline as SVG.
3. **No Tailwind classes.** This is the pre-integration artefact. Claude Code will convert to Tailwind during port. Use inline styles + a scoped `<style>` block at the top for utilities / keyframes.
4. **Top of file — paste the tokens block verbatim.** Use the exact variable names (`paper`, `paper2`, `ink`, `ink60`, `ink30`, `ink10`, `green`, `display`, `sans`, `mono`).
5. **Hardcoded demo data goes in a `const data = { ... }` block** at the top of the component. Use the exact Prisma field names from Section 6.
6. **Real Next.js route hrefs** from Section 5.
7. **Reuse the `.bav-*` utility classes** from Section 3 — don't redeclare them.
8. **No em dashes banned.** Em dashes are part of the editorial voice in this direction.
9. **British English spelling** throughout. "catalogue", "organisation", "colour", "behaviour".
10. **Voice discipline**: no "experience", no "unlock", no "elevate", no "journey", no "passionate", no exclamation marks. Specific technical detail. One sentence of context. Sentence lengths vary.

### Skeleton every artefact should start from

```jsx
import React, { useState } from 'react';

export default function BirminghamAV[ArtefactName]() {
  // ---- tokens ----
  const paper  = '#F7F5F2';
  const paper2 = '#EDE9E3';
  const ink    = '#17140F';
  const ink60  = 'rgba(23,20,15,0.60)';
  const ink30  = 'rgba(23,20,15,0.30)';
  const ink10  = 'rgba(23,20,15,0.10)';
  const green  = '#1EB53A';

  const display = { fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" };
  const sans    = { fontFamily: "'Instrument Sans', system-ui, sans-serif" };
  const mono    = { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums' };

  // ---- demo data (Claude Code swaps for Prisma query) ----
  const data = {
    // match Prisma field names exactly — see briefing Section 6
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; }
        body { margin: 0; }
        /* paste .bav-* utility classes as declared in briefing Section 3 */
      `}</style>

      <div style={{ background: paper, color: ink, ...sans, minHeight: '100vh' }}>
        {/* artefact content */}
      </div>
    </>
  );
}
```

---

## 10. Voice + copy conventions

- **Never marketing-speak.** "Every Aegis Ultra begins with the same question: what does this machine need to do, quietly, for the next five years?" — that's the voice. Not "Experience unparalleled gaming power."
- **Sentences vary in length.** One very long sentence establishes rhythm, one 4-word sentence lands. Never all-medium.
- **Specific over superlative.** "Runs at 42°C under load" beats "blazingly cool". "24-hour stress test with benchmarks on your birth certificate" beats "rigorous QA".
- **British understatement.** We don't "obsess" over builds. We "take time with them". We don't "hand-craft" — we "build by hand". We don't "love our customers" — we "stand behind what we ship".
- **No cringe verbs.** Avoid: unlock, unleash, elevate, empower, transform, revolutionise, reimagine, disrupt, seamless, experience, journey, passion.
- **British terminology.** "Post", not "mail". "Ship", not "deliver" (noun). "Postcode", not "zip code". "Trainers", not "sneakers".

---

## 11. Putting it all together — sample first message to Claude Web

Copy everything above into a new claude.ai conversation, then add at the bottom:

> **Task this conversation:** produce artefacts **1, 2, 3, 4** from Section 8.
>
> - Artefact 1: shared `<Nav />` and `<Footer />` components (two exports in one file or stack side by side for review).
> - Artefact 2: Homepage as `BirminghamAVHomepage`.
> - Artefact 3: Shop listing with filters as `BirminghamAVShop`.
> - Artefact 4: Category page as `BirminghamAVCategory` — mostly the same as Shop listing with a hero block.
>
> Produce each as a separate complete JSX file. Between each, pause so I can save them. Keep voice and tokens identical across all four. The product detail reference artefact is `birmingham-av-product.jsx`; match its quality bar.

---

## 12. When each artefact ships to me

Drop the JSX file into `C:\Users\user\Downloads\` with a predictable name (e.g. `birmingham-av-homepage.jsx`). Tell me the filename. For each file I will:

1. Install the shared tokens + utility classes in `globals.css` + `tailwind.config.ts` (first drop only).
2. Port the JSX into the correct Next.js App Router path.
3. Swap the `const data = {...}` demo block for real Prisma queries from `apps/web/lib/services/*`.
4. Wire client state (cart Zustand, auth cookies, form submission, search).
5. Hook any dynamic routes (category slug, product slug, builder code, order number).
6. Replace inline styles with Tailwind classes matching the token scale.
7. Delete the old component being superseded.
8. Typecheck, build, commit per artefact.

---

## 13. Reusable templates — paste verbatim

Two shared shells were produced in Batch 5. Any future artefact whose route appears in the "used by" list below MUST use the matching template — not reinvent one.

**Both templates are shipped as separate project-knowledge files:**
- `editorial-template.jsx` — from artefact 25 · fenced between `// --- TEMPLATE START ---` / `// --- TEMPLATE END ---` · 201 lines inclusive of markers · **shipped md5** `a73c7ac313a41402bbb78011893611e9`
- `legal-template.jsx` — from artefact 26 · fenced between `// --- TEMPLATE START ---` / `// --- TEMPLATE END ---` · 230 lines inclusive of markers · **shipped md5** `4ad0b277ea9e769742f09c5e0750f93e`

### When to use which

| Template | Applies to routes |
|---|---|
| `editorial-template.jsx` (`EditorialTemplate` + `BAV_TOKENS` + `BAVEditorialStyles`) | `/about`, `/warehouses`, `/careers`, `/contact`, `/journal/[slug]`, plus artefact 47 (`/av-care` marketing) |
| `legal-template.jsx` (`LegalTemplate`) | `/terms`, `/privacy`, `/cookies`, `/modern-slavery`, `/warranty`, `/shipping`, `/returns-policy`, `/accessibility` |

### How to use in a new artefact

1. Open the corresponding template file from project knowledge.
2. Copy the fenced block (everything between `// --- TEMPLATE START ---` and `// --- TEMPLATE END ---` inclusive of those two marker lines) **byte-for-byte** — same whitespace, same blank lines, same JSX comments, same inline-style formatting.
3. Paste that fenced block into the new artefact at the top (below the SHELL block if the artefact has a Nav + Footer).
4. In the new artefact's default-exported component, construct the route-specific `content` object and return `<EditorialTemplate {...content} />` or `<LegalTemplate {...content} />`.
5. **Before shipping**, md5 the fenced block in your new artefact. It must match the shipped hash above. If it doesn't, your paste drifted — retry.

### What you do NOT do

- Do not edit the template bodies. If the template needs a change, that's a separate artefact (a new numbered version), not an in-place fork.
- Do not redefine `BAV_TOKENS`, `BAVEditorialStyles`, `EditorialTemplate`, or `LegalTemplate` in a consuming artefact. Use the names the template exports.
- Do not rename the `.bav-*` utility classes or add new variants inside a template-consuming artefact. Template owns them.

### For Claude Code (port reference)

At port time I'll extract each template once into `apps/web/components/editorial/EditorialTemplate.tsx` and `apps/web/components/editorial/LegalTemplate.tsx`, then each consuming route imports by name. The inlined duplication in artefacts is build-time only — in production, single module per template, reused across all pages.

---

## 14. SEO conventions — page metadata format

Every consuming artefact that sets `<title>` / meta description / OG tags follows this format. Editorial voice on the *visible page* — keyword-rich voice in the `<title>` tag (browser tab + search results). Both live together; Google reads the title, users read the H1.

### Title format
`{Primary keyword} — {Secondary + modifier signals} | Birmingham AV`

Cap at **62 characters**. Keep the `| Birmingham AV` suffix present on every page.

**Examples:**
- Product: `Framework Laptop 16 — Refurbished Laptop UK, 12-Month Warranty | Birmingham AV`
- Category: `Refurbished Laptops UK — 120 Builds, 12-Month Warranty | Birmingham AV`
- Shop: `New & Refurbished PCs UK — Custom Built, Warrantied | Birmingham AV`
- Builder profile: `Alfie Ashworth — Elite PC Builder | Birmingham AV`
- AV Care: `AV Care — Monthly Warranty for Your PC, £14.99/mo | Birmingham AV`

### Description format
150-160 chars. Action-oriented. Include: condition signal, warranty length, UK delivery, "built by" where relevant.

**Examples:**
- Product: `Framework Laptop 16, refurbished and bench-tested by Dev Deol at Birmingham AV. £1,899 · 12-month warranty · Free UK delivery over £500. Order today.`
- Category: `Shop 120 refurbished laptops with 12-month warranty. Each unit battery-checked, display-calibrated, and hand-tested in Birmingham. Free UK delivery over £500.`

### Category → keyword map (for Claude Code's use at port)
Every category slug maps to a primary keyword + modifier. This lives in `apps/web/lib/seo/metadata.ts` as `CATEGORY_KEYWORDS`. Full table:

| slug | primary keyword | modifier |
|---|---|---|
| gaming-pc-bundles | Gaming PCs UK | RTX 5090 + 5080 Builds |
| computers | Workstation PCs UK | Custom Built + Refurbished |
| all-in-one-pc | All-in-One PCs UK | iMac + HP + Lenovo |
| laptops | Refurbished Laptops UK | New + Certified |
| monitors | Refurbished Monitors UK | 4K + OLED + 5K |
| projectors | Projectors UK | Home Cinema + Commercial |
| projector-lenses | Projector Lenses UK | Short Throw + Ultra-Wide |
| printers | Printers UK | Laser + Inkjet |
| av-switches | AV Switches UK | HDMI + Matrix |
| parts | PC Parts UK | GPUs + CPUs + RAM |
| hard-drive | Hard Drives UK | SSD + NVMe + HDD |
| power-supply-chargers | Power Supplies UK | Chargers + PSUs |
| network-equipment | Network Equipment UK | Switches + Routers + Firewalls |
| other | Refurbished Tech UK | Peripherals + Adaptors |

### JSON-LD schema
Every page type ships with structured data via components at `@/components/seo/`:

- **Product page:** `<ProductSchema>` + `<BreadcrumbSchema>`
- **Category page:** `<BreadcrumbSchema>`
- **Homepage:** `<OrganizationSchema>`
- **Builder profile:** `<PersonSchema>` (or `ProfilePage`)
- **Help article:** `<FAQSchema>` or `<Article>`
- **Journal article:** `<Article>` with author, datePublished

Artefacts do not render these directly. Claude Code adds them at port time from the data the artefact already displays. The artefact just needs to *have* the data visible.

### Sitemap + robots
Handled automatically by Claude Code at port time — artefacts don't need to think about them.

### Voice discipline rule
SEO-optimised titles live in `generateMetadata`. The H1 on the rendered page stays editorial (`"Laptops, refined."`). Don't conflate the two — Google and humans read different strings.

---

## End of briefing

Everything Claude Web needs to produce consistent, premium, drop-in-ready artefacts is above. Nothing else is required from me. If something is missing, flag it and I'll update this file.

*Birmingham AV · v0.3.0 · Prepared for Claude Web handoff · Sections 13-14 + P4/P5/P6 added 2026-04-19*
