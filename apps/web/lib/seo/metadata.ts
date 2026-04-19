/**
 * SEO metadata helpers — title and description builders for product,
 * category, and builder pages.
 *
 * The aim: keyword-rich, UK-localised, readable, and strictly under
 * Google's crawl caps (62 char titles, 160 char descriptions).
 *
 * Birmingham AV sells on eBay today; when we land on our own domain we
 * need every title to carry (a) the model, (b) a primary search-intent
 * keyword, (c) a trust signal (warranty / UK), and (d) the brand. This
 * module owns that pattern so pages stay consistent.
 */

export const BRAND = 'Birmingham AV' as const;
export const MAX_TITLE = 62;
export const MAX_DESCRIPTION = 160;
export const MIN_DESCRIPTION = 140;

/**
 * Product-family keyword dictionary. Each entry drives both the category
 * landing page and the derived product title modifier.
 *
 * - `primary`  is the head keyword ("Refurbished Laptops UK").
 * - `modifier` is a trailing angle that keeps titles from looking robotic.
 * - `singular` is the product-page noun ("Refurbished Laptop UK").
 *
 * Covers the 14 category slugs defined in the briefing.
 */
export interface CategoryKeyword {
  primary: string;
  modifier: string;
  singular: string;
}

export const CATEGORY_KEYWORDS: Record<string, CategoryKeyword> = {
  'gaming-pc-bundles': {
    primary: 'Gaming PCs UK',
    modifier: 'RTX 5090 and 5080 Builds',
    singular: 'Gaming PC UK',
  },
  computers: {
    primary: 'Custom PCs UK',
    modifier: 'Workstation Builds, 12-Month Warranty',
    singular: 'Custom PC UK',
  },
  'all-in-one-pc': {
    primary: 'Refurbished All-in-One PCs UK',
    modifier: 'Bench-Tested, 12-Month Warranty',
    singular: 'Refurbished All-in-One PC UK',
  },
  laptops: {
    primary: 'Refurbished Laptops UK',
    modifier: 'New and Certified',
    singular: 'Refurbished Laptop UK',
  },
  monitors: {
    primary: 'Refurbished Monitors UK',
    modifier: 'Calibrated, 12-Month Warranty',
    singular: 'Refurbished Monitor UK',
  },
  projectors: {
    primary: 'Refurbished Projectors UK',
    modifier: 'Lamp-Checked, 12-Month Warranty',
    singular: 'Refurbished Projector UK',
  },
  'projector-lenses': {
    primary: 'Projector Lenses UK',
    modifier: 'Matched Throw Ratios, Warrantied',
    singular: 'Projector Lens UK',
  },
  printers: {
    primary: 'Refurbished Printers UK',
    modifier: 'Calibrated, 12-Month Warranty',
    singular: 'Refurbished Printer UK',
  },
  'av-switches': {
    primary: 'AV Switches UK',
    modifier: 'HDMI Matrix, Port-Tested',
    singular: 'AV Switch UK',
  },
  parts: {
    primary: 'PC Parts UK',
    modifier: 'Tested GPUs, CPUs and PSUs',
    singular: 'PC Part UK',
  },
  'hard-drive': {
    primary: 'Refurbished Hard Drives UK',
    modifier: 'SMART-Checked, Surface-Scanned',
    singular: 'Refurbished Hard Drive UK',
  },
  'power-supply-chargers': {
    primary: 'Power Supplies and Chargers UK',
    modifier: 'Load-Tested, Warrantied',
    singular: 'Power Supply UK',
  },
  'network-equipment': {
    primary: 'Refurbished Network Equipment UK',
    modifier: 'Enterprise Switches and Routers',
    singular: 'Refurbished Network Equipment UK',
  },
  other: {
    primary: 'Refurbished Tech UK',
    modifier: 'Bench-Tested, 12-Month Warranty',
    singular: 'Refurbished Tech UK',
  },
};

/**
 * Default if a category slug is absent from the map.
 */
const CATEGORY_FALLBACK: CategoryKeyword = {
  primary: 'Refurbished Tech UK',
  modifier: 'Bench-Tested, 12-Month Warranty',
  singular: 'Refurbished Tech UK',
};

export function categoryKeyword(slug: string): CategoryKeyword {
  return CATEGORY_KEYWORDS[slug] ?? CATEGORY_FALLBACK;
}

// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

/**
 * Clip a title so the final rendered string (including " | Birmingham AV")
 * stays under MAX_TITLE. Prefers trimming the middle modifier first, then
 * the leading noun. Never clips `| Birmingham AV` itself.
 */
function clampTitle(main: string, suffix: string = ` | ${BRAND}`): string {
  const target = MAX_TITLE - suffix.length;
  if (main.length <= target) return `${main}${suffix}`;
  const clipped = main.slice(0, target - 1).replace(/[\s,\-—]+$/, '');
  return `${clipped}${suffix}`;
}

function clampDescription(text: string): string {
  if (text.length <= MAX_DESCRIPTION) return text;
  const clipped = text.slice(0, MAX_DESCRIPTION - 1).replace(/[\s,\-—.]+$/, '');
  return `${clipped}.`;
}

// ----------------------------------------------------------------------------
// Product-level helpers
// ----------------------------------------------------------------------------

export interface SeoProduct {
  title: string;
  subtitle?: string | null;
  conditionGrade: string;
  warrantyMonths: number;
  priceGbp: number;
  builderDisplayName?: string | null;
  categorySlug: string;
  inStock?: boolean;
}

/**
 * Does this condition grade qualify for free UK delivery messaging?
 * Today every product >£99 ships free; we hard-code the threshold here
 * so the helper stays self-contained.
 */
function qualifiesForFreeDelivery(priceGbp: number): boolean {
  return priceGbp >= 99;
}

function isNewCondition(conditionGrade: string): boolean {
  return /^(brand\s*)?new$/i.test(conditionGrade.trim());
}

/**
 * "Framework Laptop 16 (2025) — Refurbished Laptop UK, 12-Month Warranty"
 */
export function buildProductTitle(product: SeoProduct): string {
  const kw = categoryKeyword(product.categorySlug);
  const singular = isNewCondition(product.conditionGrade)
    ? kw.singular.replace(/^Refurbished\s+/i, '')
    : kw.singular;

  const main = `${product.title} — ${singular}, ${product.warrantyMonths}-Month Warranty`;
  return clampTitle(main);
}

/**
 * 140–160 chars, action-oriented, keyword-dense. Includes condition,
 * warranty, builder credit, and optional free-delivery line.
 */
export function buildProductDescription(product: SeoProduct): string {
  const kw = categoryKeyword(product.categorySlug);
  const condition = isNewCondition(product.conditionGrade)
    ? 'Brand new'
    : `${product.conditionGrade} refurbished`;

  const builder = product.builderDisplayName
    ? `, built by ${product.builderDisplayName}`
    : '';
  const delivery = qualifiesForFreeDelivery(product.priceGbp)
    ? ' Free UK delivery.'
    : '';

  const base = `Buy the ${product.title} — ${condition}${builder}. ${product.warrantyMonths}-month ${BRAND} warranty, hand-assembled in the UK.${delivery} Shop ${kw.primary} today.`;
  return clampDescription(base);
}

// ----------------------------------------------------------------------------
// Category-level helpers
// ----------------------------------------------------------------------------

export interface SeoCategory {
  slug: string;
  name: string;
}

/**
 * Category title. Accepts an optional build count; when omitted the title
 * stays brandy without misrepresenting stock depth.
 *
 * "Refurbished Laptops UK — 120 Builds, 12-Month Warranty | Birmingham AV"
 */
export function buildCategoryTitle(category: SeoCategory, count?: number): string {
  const kw = categoryKeyword(category.slug);
  const countPart = typeof count === 'number' && count > 0 ? `${count} Builds, ` : '';
  const main = `${kw.primary} — ${countPart}12-Month Warranty`;
  return clampTitle(main);
}

/**
 * Category description — optimised for rich-snippet eligibility and
 * keyword density without reading like keyword stuffing.
 */
export function buildCategoryDescription(category: SeoCategory, count?: number): string {
  const kw = categoryKeyword(category.slug);
  const intro =
    typeof count === 'number' && count > 0
      ? `Shop ${count} ${kw.primary}`
      : `Shop ${kw.primary}`;
  const base = `${intro} at ${BRAND}. ${kw.modifier}, hand-assembled in the UK, 12-month warranty on every build. Free UK delivery over £99.`;
  return clampDescription(base);
}

/**
 * Alias — /shop (no category filter).
 */
export function buildShopTitle(count?: number): string {
  const countPart = typeof count === 'number' && count > 0 ? `${count} Builds, ` : '';
  const main = `Shop Every Build — ${countPart}Refurbished PCs, Laptops and AV Kit UK`;
  return clampTitle(main);
}

export function buildShopDescription(count?: number): string {
  const base =
    typeof count === 'number' && count > 0
      ? `Browse ${count} hand-assembled builds at ${BRAND} — refurbished PCs, laptops, monitors, projectors and network kit, all warrantied for 12 months. Free UK delivery over £99.`
      : `Browse every hand-assembled build at ${BRAND} — refurbished PCs, laptops, monitors, projectors and network kit, all warrantied for 12 months. Free UK delivery over £99.`;
  return clampDescription(base);
}

// ----------------------------------------------------------------------------
// Builder-level helpers
// ----------------------------------------------------------------------------

export interface SeoBuilder {
  displayName: string;
  builderCode: string;
  tier: string;
  specialities?: string[];
  yearsBuilding?: number;
}

/**
 * "Jordan Malik — Elite PC Builder at Birmingham AV"
 */
export function buildBuilderTitle(builder: SeoBuilder): string {
  const tierLabel = capitaliseTier(builder.tier);
  const main = `${builder.displayName} — ${tierLabel} PC Builder at ${BRAND}`;
  return clampTitle(main);
}

export function buildBuilderDescription(builder: SeoBuilder): string {
  const tierLabel = capitaliseTier(builder.tier);
  const years =
    typeof builder.yearsBuilding === 'number' && builder.yearsBuilding > 0
      ? `${builder.yearsBuilding} years`
      : 'years';
  const specialities =
    builder.specialities && builder.specialities.length > 0
      ? ` Specialises in ${builder.specialities.slice(0, 3).join(', ').toLowerCase()}.`
      : '';

  const base = `${builder.displayName} is a ${tierLabel} PC builder at ${BRAND}, hand-assembling new and refurbished machines in the UK for ${years}.${specialities} See every build signed ${builder.builderCode}.`;
  return clampDescription(base);
}

function capitaliseTier(tier: string): string {
  const t = tier.trim().toLowerCase();
  if (!t) return 'Staff';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
