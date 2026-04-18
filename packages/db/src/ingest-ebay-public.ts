import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();
import * as cheerio from 'cheerio';
import { prisma } from './prisma';
import { connectMongo, disconnectMongo } from './mongo';
import { ProductCatalog } from './mongo/product-catalog';

/**
 * PUBLIC eBay store scraper. No credentials required.
 *
 * Pulls live listing data from https://www.ebay.co.uk/str/<seller> and inserts
 * into Postgres + MongoDB. For each listing card we capture title, price,
 * image URL, and the deep link. Descriptions are fetched on a second pass if
 * the FETCH_DETAILS env var is set (much slower, ~1 req/s per item).
 *
 * Usage:
 *   pnpm ingest:public                                # cards only, all pages
 *   pnpm ingest:public --pages=10                     # first 10 pages
 *   FETCH_DETAILS=1 pnpm ingest:public --pages=2      # also pull descriptions
 *
 * Idempotent on the eBay item ID extracted from the listing URL.
 * Rate-limited to 1 req/1.2s on listing pages.
 *
 * NOTE: Public scraping is fine for one-off demos; for production traffic, switch
 * to the Browse API (set INGEST_PROVIDER=ebay_api with EBAY_APP_ID + EBAY_CERT_ID).
 */

const SELLER = process.env.EBAY_SELLER_USERNAME ?? 'midlandsav';
const STORE_BASE = `https://www.ebay.co.uk/str/${SELLER}`;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

type Card = {
  ebayItemId: string;
  title: string;
  priceGbp: number;
  imageUrl: string;
  itemUrl: string;
  description?: string;
  condition?: string;
  itemSpecifics?: Record<string, string>;
  extraImages?: string[];
};

function parseArg(name: string, fallback?: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Persistent cookie jar - eBay serves a 37KB "splash" gate on cold requests.
// We warm it up once (which sets session cookies), then re-use those cookies
// on every subsequent call to get the real ~870KB pages.
const COOKIE_JAR = path.resolve(process.cwd(), '.ebay-cookies.txt');
let jarWarmedAt = 0;
const JAR_TTL = 45 * 60 * 1000; // 45 min

// Safe-resume guard: if eBay starts throttling/fingerprinting us, the cookie-jar
// warm step returns quickly but produces no usable cookies (next fetchHtml
// then sees a short/splash response). After N consecutive warm attempts that
// yield no usable jar, bail out cleanly instead of hammering their edge.
let jarWarmFailStreak = 0;
const JAR_WARM_MAX_FAILS = 3;
class EbayThrottledError extends Error {
  constructor() {
    super('eBay throttling us, try again in 15 min');
    this.name = 'EbayThrottledError';
  }
}

async function warmCookieJar(): Promise<void> {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const { stat } = await import('node:fs/promises');
  const execP = promisify(exec);
  const cmd = `curl -s -L -c '${COOKIE_JAR}' -A '${UA}' -H 'Accept-Language: en-GB,en;q=0.9' 'https://www.ebay.co.uk/' -o /dev/null --max-time 20 && curl -s -L -c '${COOKIE_JAR}' -b '${COOKIE_JAR}' -A '${UA}' -H 'Accept-Language: en-GB,en;q=0.9' 'https://www.ebay.co.uk/str/${SELLER}' -o /dev/null --max-time 25`;
  let warmOk = false;
  try {
    await execP(`bash -c "${cmd.replace(/"/g, '\\"')}"`);
    // Consider the warm a success only if the jar file actually grew beyond a
    // trivial size - curl can exit 0 with an empty/near-empty jar when eBay
    // serves the splash gate without setting session cookies.
    const s = await stat(COOKIE_JAR).catch(() => null);
    warmOk = !!s && s.size > 512;
  } catch {
    warmOk = false;
  }
  jarWarmedAt = Date.now();
  if (warmOk) {
    jarWarmFailStreak = 0;
  } else {
    jarWarmFailStreak += 1;
    if (jarWarmFailStreak >= JAR_WARM_MAX_FAILS) {
      throw new EbayThrottledError();
    }
  }
}

async function fetchHtml(url: string, attempt = 1): Promise<string> {
  if (Date.now() - jarWarmedAt > JAR_TTL) await warmCookieJar();

  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execP = promisify(exec);
  const bashCmd = `curl -s -L -b '${COOKIE_JAR}' -c '${COOKIE_JAR}' --max-time 25 -A '${UA}' -H 'Accept-Language: en-GB,en;q=0.9' '${url}'`;
  try {
    const { stdout } = await execP(`bash -c "${bashCmd.replace(/"/g, '\\"')}"`, {
      maxBuffer: 32 * 1024 * 1024,
      encoding: 'utf8',
    });
    const isListing = url.includes('/str/');
    const minSize = isListing ? 80_000 : 40_000;
    if (!stdout || stdout.length < minSize) {
      // Splash page - refresh jar and retry once immediately
      if (attempt === 1) {
        jarWarmedAt = 0;
        await warmCookieJar();
      }
      throw new Error(`short response ${stdout.length} bytes`);
    }
    return stdout;
  } catch (err) {
    // Throttle signal - don't swallow, propagate so main() can abort cleanly.
    if (err instanceof EbayThrottledError) throw err;
    if (attempt >= 4) throw err;
    await sleep(2 ** attempt * 800);
    return fetchHtml(url, attempt + 1);
  }
}

function priceToNumber(s: string): number {
  // "£1,100.00" → 1100, "£99.99" → 99.99, "£99.99 to £199.99" → 99.99 (low end)
  const m = s.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function extractItemId(url: string): string | null {
  const m = url.match(/\/itm\/(\d+)/);
  return m ? m[1] ?? null : null;
}

function slugify(title: string, id: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90) + `-${id.slice(-6)}`
  );
}

function inferCategorySlug(title: string): string {
  const t = title.toLowerCase();
  if (/(gaming pc|gaming desktop|gaming bundle|rtx|geforce|radeon|rx \d{4})/.test(t)) return 'gaming-pc-bundles';
  if (/laptop|notebook|macbook|elitebook|thinkpad|latitude|inspiron/.test(t)) return 'laptops';
  if (/all in one|aio|imac/.test(t)) return 'all-in-one-pc';
  if (/monitor|display|screen/.test(t)) return 'monitors';
  if (/projector lens/.test(t)) return 'projector-lenses';
  if (/projector/.test(t)) return 'projectors';
  if (/printer|laserjet|deskjet|inkjet/.test(t)) return 'printers';
  if (/hdmi switch|av switch|video switcher/.test(t)) return 'av-switches';
  if (/(ssd|hdd|nvme|hard drive|hard disk)/.test(t)) return 'hard-drive';
  if (/(power supply|psu|charger|adaptor|adapter)/.test(t)) return 'power-supply-chargers';
  if (/(router|switch|access point|nas|wifi|wireless)/.test(t)) return 'network-equipment';
  if (/cpu|gpu|ram|memory|motherboard|case|cooler/.test(t)) return 'parts';
  if (/desktop|pc|optiplex|elitedesk|thinkcentre/.test(t)) return 'computers';
  return 'other';
}

function inferCondition(title: string): string {
  const t = title.toLowerCase();
  if (/brand new|sealed/.test(t)) return 'New';
  if (/like new|grade a/.test(t)) return 'Like New';
  if (/excellent|grade b/.test(t)) return 'Excellent';
  if (/refurb/.test(t)) return 'Refurbished';
  return 'Refurbished';
}

// --- Listing page (cards) parser ---

function parseStorePage(html: string): Card[] {
  const $ = cheerio.load(html);
  const cards: Card[] = [];
  $('.str-item-card.StoreFrontItemCard').each((_, el) => {
    const $el = $(el);
    const title = $el.find('.str-item-card__property-title').text().trim();
    const priceText = $el.find('.str-item-card__property-displayPrice').text().trim();
    const itemUrl = $el.find('a').attr('href') ?? '';
    const itemId = extractItemId(itemUrl);
    const img = $el.find('img').attr('src') ?? $el.find('img').attr('data-src') ?? '';
    if (!title || !itemId || !priceText) return;
    cards.push({
      ebayItemId: itemId,
      title,
      priceGbp: priceToNumber(priceText),
      imageUrl: img.replace('s-l300', 's-l800'), // upgrade to higher res
      itemUrl: itemUrl.split('?')[0] ?? itemUrl,
    });
  });
  return cards;
}

// --- Item detail page parser (for descriptions + extra images + specifics) ---

function parseItemPage(html: string): Pick<Card, 'description' | 'condition' | 'itemSpecifics' | 'extraImages'> {
  const $ = cheerio.load(html);

  // Description: eBay loads via iframe. Try inline first, then meta description.
  const inline = $('#desc_div, [data-testid="x-item-description-child"]').text().trim();
  const meta = $('meta[name="description"]').attr('content') ?? '';
  const description = inline.length > 60 ? inline : meta;

  // Item specifics: <dl>/<dt>/<dd> grid on the listing
  const itemSpecifics: Record<string, string> = {};
  $('div.ux-layout-section-evo__item .ux-labels-values').each((_, el) => {
    const k = $(el).find('.ux-labels-values__labels').text().trim().replace(/:$/, '');
    const v = $(el).find('.ux-labels-values__values').text().trim();
    if (k && v && k.length < 60 && v.length < 200) itemSpecifics[k] = v;
  });

  const condition = itemSpecifics.Condition ?? itemSpecifics['Condition Description'] ?? undefined;

  // Extra images: thumb-strip carousel
  const extraImages: string[] = [];
  $('.ux-image-carousel-item img, .ux-image-grid-container img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src');
    if (src && src.includes('ebayimg.com') && !extraImages.includes(src)) {
      extraImages.push(src.replace('s-l64', 's-l800').replace('s-l225', 's-l800'));
    }
  });

  return { description, condition, itemSpecifics, extraImages };
}

// --- Main ---

async function main() {
  const started = Date.now();
  const maxPages = Number(parseArg('pages', '20'));
  const fetchDetails = process.env.FETCH_DETAILS === '1' || parseArg('details') === '1';

  console.log(`==> Public eBay scrape: seller=${SELLER}, max ${maxPages} pages, details=${fetchDetails}`);
  await connectMongo().catch((err) => console.warn('[mongo] not available, skipping catalog enrichment:', err.message));

  const categories = await prisma.productCategory.findMany();
  if (categories.length === 0) throw new Error('Run pnpm db:seed first to create categories');
  const catBySlug = new Map(categories.map((c) => [c.slug, c.categoryId] as const));
  const builders = await prisma.builder.findMany({ where: { status: 'active' }, orderBy: { builderCode: 'asc' } });
  if (builders.length === 0) throw new Error('Run pnpm db:seed first to create builders');

  const allCards: Card[] = [];
  const failures: Array<{ context: string; error: string }> = [];

  let throttled = false;
  for (let page = 1; page <= maxPages; page += 1) {
    const url = `${STORE_BASE}?_pgn=${page}`;
    process.stdout.write(`  page ${page}/${maxPages} ... `);
    try {
      const html = await fetchHtml(url);
      const cards = parseStorePage(html);
      console.log(`${cards.length} cards`);
      if (cards.length === 0) {
        console.log('  (no more cards, stopping)');
        break;
      }
      allCards.push(...cards);
    } catch (err) {
      if (err instanceof EbayThrottledError) {
        console.log('ABORT');
        console.log(`==> ${err.message}`);
        failures.push({ context: `page ${page}`, error: err.message });
        throttled = true;
        break;
      }
      console.log('failed:', String(err));
      failures.push({ context: `page ${page}`, error: String(err) });
    }
    await sleep(2200);
  }

  if (throttled && allCards.length === 0) {
    console.log('==> No cards collected before throttle - skipping DB writes.');
  }

  console.log(`==> Collected ${allCards.length} cards`);

  let upserted = 0;
  for (let i = 0; i < allCards.length; i += 1) {
    const c = allCards[i];
    if (!c) continue;

    if (fetchDetails) {
      try {
        const html = await fetchHtml(c.itemUrl);
        Object.assign(c, parseItemPage(html));
      } catch (err) {
        if (err instanceof EbayThrottledError) {
          console.log(`\n==> ${err.message} (stopping detail fetch, continuing with cards already collected)`);
          failures.push({ context: `detail ${c.ebayItemId}`, error: err.message });
          // Stop fetching details but keep upserting what we already have.
          break;
        }
        failures.push({ context: `detail ${c.ebayItemId}`, error: String(err) });
      }
      await sleep(1100);
      if (i % 25 === 0) process.stdout.write(`  details ${i}/${allCards.length} ...\r`);
    }

    try {
      const slug = slugify(c.title, c.ebayItemId);
      const sku = `BAV-EBAY-${c.ebayItemId}`;
      const categoryId = catBySlug.get(inferCategorySlug(c.title)) ?? catBySlug.get('other');
      if (!categoryId) continue;
      const builder = builders[i % builders.length]!;

      const allImages = [c.imageUrl, ...(c.extraImages ?? [])].filter(Boolean) as string[];
      const dedupImages = allImages.filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 8);

      const product = await prisma.product.upsert({
        where: { ebayListingId: c.ebayItemId },
        update: {
          title: c.title,
          priceGbp: c.priceGbp,
          conditionGrade: c.condition ?? inferCondition(c.title),
          primaryImageUrl: c.imageUrl || null,
          imageUrls: dedupImages,
          descriptionHtml: c.description ?? null,
          ebaySyncAt: new Date(),
        },
        create: {
          sku,
          slug,
          builderId: builder.builderId,
          categoryId,
          title: c.title,
          subtitle: null,
          conditionGrade: c.condition ?? inferCondition(c.title),
          priceGbp: c.priceGbp,
          costGbp: Math.round(c.priceGbp * 0.72),
          primaryImageUrl: c.imageUrl || null,
          imageUrls: dedupImages,
          descriptionHtml: c.description ?? null,
          warrantyMonths: 12,
          ebayListingId: c.ebayItemId,
          ebaySyncAt: new Date(),
          isActive: true,
          isFeatured: i < 12,
          inventory: { create: { stockQty: 3, reorderThreshold: 1 } },
        },
      });

      const images = [c.imageUrl, ...(c.extraImages ?? [])]
        .filter(Boolean)
        .filter((v, idx, arr) => arr.indexOf(v) === idx)
        .slice(0, 8)
        .map((url, n) => ({ url, alt: c.title, isPrimary: n === 0 }));

      await ProductCatalog.findOneAndUpdate(
        { postgresProductId: product.productId },
        {
          $set: {
            postgresProductId: product.productId,
            sku,
            slug,
            images,
            tags: c.itemSpecifics ? Object.values(c.itemSpecifics).slice(0, 12) : [],
            seo: {
              metaTitle: `${c.title} | Birmingham AV`,
              metaDescription: c.description?.slice(0, 160) ?? c.title,
            },
            ebay: {
              listingId: c.ebayItemId,
              lastSyncedAt: new Date(),
              rawTitle: c.title,
              rawPriceGbp: c.priceGbp,
            },
          },
        },
        { upsert: true, new: true },
      ).catch(() => undefined); // skip mongo writes if not connected

      upserted += 1;
    } catch (err) {
      // Narrow error to a useful one-liner - strip multiline Prisma stack noise
      // so a single failure surfaces clearly without drowning the output.
      const msg = err instanceof Error ? err.message : String(err);
      const firstLine = msg.split('\n').find((l) => l.trim().length > 0)?.trim() ?? msg;
      const code = (err as { code?: string })?.code;
      const tag = code ? `[${code}] ` : '';
      console.log(`  upsert failed (${c.ebayItemId}): ${tag}${firstLine}`);
      failures.push({ context: `upsert ${c.ebayItemId}`, error: `${tag}${firstLine}` });
      // Continue - do not let one bad row abort the remaining writes.
      continue;
    }

    // Progress output every 10 upserts so we can see DB write progress.
    if ((i + 1) % 10 === 0) {
      console.log(`  upserted ${i + 1}/${allCards.length}`);
    }
  }

  const logDir = path.join(process.cwd(), 'logs');
  await mkdir(logDir, { recursive: true }).catch(() => undefined);
  const logPath = path.join(logDir, `ingest-public-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(
    logPath,
    JSON.stringify(
      {
        seller: SELLER,
        pages: maxPages,
        fetchDetails,
        cards: allCards.length,
        upserted,
        failures,
        elapsedMs: Date.now() - started,
      },
      null,
      2,
    ),
  ).catch(() => undefined);

  const mins = ((Date.now() - started) / 60_000).toFixed(1);
  console.log(`\n==> Done in ${mins} min · upserted ${upserted}/${allCards.length} · ${failures.length} failures`);
  console.log(`    Log: ${logPath}`);
}

main()
  .catch((err) => {
    if (err instanceof EbayThrottledError) {
      console.error(`==> ${err.message}`);
    } else {
      console.error(err);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await disconnectMongo().catch(() => undefined);
  });
