import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();
import crypto from 'node:crypto';
import { prisma } from './prisma';
import { connectMongo, disconnectMongo } from './mongo';
import { ProductCatalog } from './mongo/product-catalog';

/**
 * eBay ingestion - see SPEC.md section 3.
 *
 * Strategies (selected by INGEST_PROVIDER):
 *   - ebay_api:    official Browse API (preferred)
 *   - apify:       Apify eBay Product Scraper actor
 *   - serpapi:     SerpApi eBay engine
 *   - direct_html: last resort cheerio-based scrape
 *
 * Idempotent: keyed on ebay_listing_id. Re-runs update rather than duplicate.
 * Rate limit: 2 req/s. Retries with exponential backoff.
 */

type EbayListing = {
  ebayListingId: string;
  title: string;
  subtitle?: string;
  condition?: string;
  priceGbp: number;
  currency: string;
  images: string[];
  categoryPath: string[];
  itemSpecifics: Record<string, string>;
  descriptionHtml?: string;
  sellerNotes?: string;
  shippingGbp?: number;
  returnPolicy?: string;
  stockQty: number;
};

type IngestProvider = 'ebay_api' | 'apify' | 'serpapi' | 'direct_html';

// ------------- Provider dispatch -------------

async function fetchListings(provider: IngestProvider): Promise<EbayListing[]> {
  switch (provider) {
    case 'ebay_api':
      return fetchViaEbayApi();
    case 'apify':
      return fetchViaApify();
    case 'serpapi':
      return fetchViaSerpApi();
    case 'direct_html':
      return fetchViaDirectHtml();
  }
}

// ------------- eBay Browse API -------------

async function getEbayAccessToken(): Promise<string> {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) {
    throw new Error('EBAY_APP_ID / EBAY_CERT_ID missing - set them or switch INGEST_PROVIDER');
  }
  const creds = Buffer.from(`${appId}:${certId}`).toString('base64');
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${creds}`,
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });
  if (!res.ok) throw new Error(`eBay token failed: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

async function fetchViaEbayApi(): Promise<EbayListing[]> {
  const token = await getEbayAccessToken();
  const all: EbayListing[] = [];
  const limit = 200;
  let offset = 0;
  const seller = process.env.EBAY_SELLER_USERNAME ?? 'midlandsav';
  for (;;) {
    const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
    url.searchParams.set('filter', `sellers:{${seller}}`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    const res = await fetchWithRetry(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
      },
    });
    const j = (await res.json()) as {
      itemSummaries?: Array<Record<string, unknown>>;
      total?: number;
      next?: string;
    };
    const items = j.itemSummaries ?? [];
    for (const raw of items) all.push(normaliseFromBrowse(raw));
    if (!j.next || items.length < limit) break;
    offset += limit;
    await sleep(500);
  }
  return all;
}

function normaliseFromBrowse(raw: Record<string, unknown>): EbayListing {
  const price = (raw.price as { value?: string; currency?: string } | undefined) ?? {};
  const images =
    (raw.image as { imageUrl?: string } | undefined)?.imageUrl !== undefined
      ? [(raw.image as { imageUrl: string }).imageUrl]
      : [];
  const additional = (raw.additionalImages as Array<{ imageUrl?: string }> | undefined) ?? [];
  for (const a of additional) if (a.imageUrl) images.push(a.imageUrl);
  const categories = (raw.categories as Array<{ categoryName?: string }> | undefined) ?? [];
  return {
    ebayListingId: String(raw.itemId ?? raw.legacyItemId ?? crypto.randomUUID()),
    title: String(raw.title ?? 'Untitled'),
    subtitle: (raw.subtitle as string | undefined) ?? undefined,
    condition: (raw.condition as string | undefined) ?? undefined,
    priceGbp: price.value ? Number(price.value) : 0,
    currency: price.currency ?? 'GBP',
    images,
    categoryPath: categories.map((c) => c.categoryName ?? '').filter(Boolean),
    itemSpecifics: {},
    descriptionHtml: (raw.shortDescription as string | undefined) ?? undefined,
    stockQty: 1,
  };
}

// ------------- Apify fallback -------------

async function fetchViaApify(): Promise<EbayListing[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN missing');
  const run = await fetch(`https://api.apify.com/v2/acts/dtrungtin~ebay-items-scraper/run-sync-get-dataset-items?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url: 'https://www.ebay.co.uk/str/birminghamav' }],
      maxItems: 2000,
    }),
  });
  if (!run.ok) throw new Error(`Apify run failed: ${run.status}`);
  const items = (await run.json()) as Array<Record<string, unknown>>;
  return items.map(normaliseFromApify);
}

function normaliseFromApify(raw: Record<string, unknown>): EbayListing {
  return {
    ebayListingId: String(raw.itemId ?? raw.id ?? raw.url ?? crypto.randomUUID()),
    title: String(raw.title ?? 'Untitled'),
    priceGbp: Number(raw.price ?? 0),
    currency: String(raw.currency ?? 'GBP'),
    images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
    categoryPath: Array.isArray(raw.categories) ? (raw.categories as string[]) : [],
    itemSpecifics: (raw.itemSpecifics as Record<string, string>) ?? {},
    condition: (raw.condition as string | undefined) ?? undefined,
    descriptionHtml: (raw.description as string | undefined) ?? undefined,
    stockQty: Number(raw.stock ?? 1),
  };
}

// ------------- SerpApi fallback -------------

async function fetchViaSerpApi(): Promise<EbayListing[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error('SERPAPI_KEY missing');
  const res = await fetchWithRetry(
    `https://serpapi.com/search.json?engine=ebay&ebay_domain=ebay.co.uk&_ssn=birminghamav&api_key=${key}&_ipg=200`,
  );
  const j = (await res.json()) as { organic_results?: Array<Record<string, unknown>> };
  const items = j.organic_results ?? [];
  return items.map((raw) => ({
    ebayListingId: String(raw.item_id ?? raw.link ?? crypto.randomUUID()),
    title: String(raw.title ?? 'Untitled'),
    priceGbp: Number((raw.price as { extracted?: number } | undefined)?.extracted ?? 0),
    currency: 'GBP',
    images: (raw.thumbnail as string | undefined) ? [raw.thumbnail as string] : [],
    categoryPath: [],
    itemSpecifics: {},
    condition: (raw.condition as string | undefined) ?? undefined,
    stockQty: 1,
  }));
}

// ------------- direct_html (last resort) -------------

async function fetchViaDirectHtml(): Promise<EbayListing[]> {
  throw new Error(
    'direct_html ingestion is a last resort; configure EBAY_APP_ID/EBAY_CERT_ID or APIFY_TOKEN/SERPAPI_KEY instead.',
  );
}

// ------------- Utilities -------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || res.status >= 500) {
        await sleep(2 ** attempt * 500);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      await sleep(2 ** attempt * 500);
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function mapCategory(path: string[]): string {
  const joined = path.join(' / ').toLowerCase();
  if (joined.includes('laptop')) return 'laptops';
  if (joined.includes('gaming') && joined.includes('bundle')) return 'gaming-pc-bundles';
  if (joined.includes('all-in-one')) return 'all-in-one-pc';
  if (joined.includes('monitor')) return 'monitors';
  if (joined.includes('projector') && joined.includes('lens')) return 'projector-lenses';
  if (joined.includes('projector')) return 'projectors';
  if (joined.includes('printer')) return 'printers';
  if (joined.includes('switch')) return 'av-switches';
  if (joined.includes('hard drive') || joined.includes('ssd')) return 'hard-drive';
  if (joined.includes('power') || joined.includes('charger')) return 'power-supply-chargers';
  if (joined.includes('network')) return 'network-equipment';
  if (joined.includes('part')) return 'parts';
  if (joined.includes('computer') || joined.includes('desktop')) return 'computers';
  return 'other';
}

// ------------- Main -------------

async function main() {
  const started = Date.now();
  const provider = (process.env.INGEST_PROVIDER as IngestProvider | undefined) ?? 'ebay_api';
  console.log(`==> eBay ingestion via ${provider}`);

  await connectMongo();
  const categories = await prisma.productCategory.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c.categoryId] as const));
  const builders = await prisma.builder.findMany({ where: { status: 'active' }, orderBy: { builderCode: 'asc' } });
  if (builders.length === 0) throw new Error('Run seed first: pnpm db:seed');

  const listings = await fetchListings(provider);
  console.log(`==> Fetched ${listings.length} listings`);

  const failures: Array<{ ebayListingId: string; error: string }> = [];
  let upserted = 0;

  for (let i = 0; i < listings.length; i += 1) {
    const l = listings[i];
    if (!l) continue;
    try {
      const catSlug = mapCategory(l.categoryPath);
      const categoryId = catBySlug.get(catSlug) ?? catBySlug.get('other');
      if (!categoryId) throw new Error('no category');

      const builder = builders[i % builders.length];
      if (!builder) throw new Error('no builder');
      const slug = `${slugify(l.title)}-${l.ebayListingId.slice(-6)}`;
      const sku = `BAV-${l.ebayListingId}`;

      const product = await prisma.product.upsert({
        where: { ebayListingId: l.ebayListingId },
        update: {
          title: l.title,
          subtitle: l.subtitle ?? null,
          priceGbp: l.priceGbp,
          conditionGrade: l.condition ?? 'Refurbished',
          ebaySyncAt: new Date(),
        },
        create: {
          sku,
          slug,
          builderId: builder.builderId,
          categoryId,
          title: l.title,
          subtitle: l.subtitle ?? null,
          conditionGrade: l.condition ?? 'Refurbished',
          priceGbp: l.priceGbp,
          warrantyMonths: 12,
          ebayListingId: l.ebayListingId,
          ebaySyncAt: new Date(),
          isActive: true,
          inventory: {
            create: { stockQty: l.stockQty ?? 1 },
          },
        },
      });

      await ProductCatalog.findOneAndUpdate(
        { postgresProductId: product.productId },
        {
          $set: {
            sku,
            slug,
            images: l.images.map((url, n) => ({ url, alt: l.title, isPrimary: n === 0 })),
            tags: Object.values(l.itemSpecifics),
            ebay: {
              listingId: l.ebayListingId,
              lastSyncedAt: new Date(),
              rawTitle: l.title,
              rawPriceGbp: l.priceGbp,
            },
          },
        },
        { upsert: true, new: true },
      );

      upserted += 1;
      if (i % 25 === 0) await sleep(500); // rate-limit friendly
    } catch (err) {
      failures.push({ ebayListingId: l.ebayListingId, error: String(err) });
    }
  }

  const logDir = path.join(process.cwd(), 'logs');
  await mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, `ingest-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(
    logPath,
    JSON.stringify({ provider, total: listings.length, upserted, failures, elapsedMs: Date.now() - started }, null, 2),
  );
  console.log(`==> Upserted ${upserted} / ${listings.length}. Failures: ${failures.length}. Log: ${logPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await disconnectMongo();
  });
