import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, GlassCard } from '@/components/ui';
import { getProductBySlug, defaultImageFor } from '@/lib/services/products';
import { formatGbp } from '@bav/lib';
import { AddToCartButton } from './AddToCartButton';
import { StockUrgency, SavingsBadge } from '@/components/storefront/StockUrgency';
import { RecordViewEffect } from '@/components/storefront/RecordViewEffect';
import { RelatedProducts } from '@/components/storefront/RelatedProducts';
import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getProductBySlug(params.slug);
  if (!data) {
    return {
      title: 'Product not found',
      description: 'This PC listing is no longer available at Birmingham AV.',
    };
  }
  const { product } = data;
  const priceLabel = formatGbp(Number(product.priceGbp));
  const subtitle = product.subtitle ? ` ${product.subtitle}.` : '';
  const description =
    `${product.title} from Birmingham AV, built by ${product.builder.displayName}.${subtitle} ${priceLabel} with 12-month warranty.`.slice(
      0,
      159,
    );
  return {
    title: product.title,
    description,
  };
}

// --- Mongo catalog shape (may be null when Mongo is unavailable) -----------
type CatalogImage = { url: string; alt?: string; isPrimary?: boolean };
type Catalog = {
  images?: CatalogImage[];
  specs?: Record<string, unknown>;
};

// --- Premium SVG placeholder (used when no product images exist) -----------
const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#0f1419'/>
        <stop offset='100%' stop-color='#1a2028'/>
      </linearGradient>
      <pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'>
        <path d='M40 0H0V40' fill='none' stroke='rgba(79,195,161,0.08)' stroke-width='1'/>
      </pattern>
    </defs>
    <rect width='800' height='600' fill='url(#g)'/>
    <rect width='800' height='600' fill='url(#grid)'/>
    <g fill='none' stroke='rgba(79,195,161,0.35)' stroke-width='2'>
      <rect x='300' y='220' width='200' height='160' rx='8'/>
      <rect x='330' y='250' width='140' height='100' rx='4' fill='rgba(79,195,161,0.06)'/>
      <circle cx='400' cy='300' r='18'/>
    </g>
    <text x='400' y='430' font-family='monospace' font-size='14' fill='rgba(255,255,255,0.35)' text-anchor='middle' letter-spacing='2'>BIRMINGHAM AV</text>
  </svg>`,
)}`;

/**
 * Minimal allow-listed HTML sanitiser. Strips <script>/<iframe>/<object>/
 * <embed>/<link>/<meta>/<style>, inline event handlers (onclick, onerror, ...),
 * and javascript:/data: URIs. Runs server-side — trusted content is expected,
 * this is a defence-in-depth second pass.
 */
function sanitiseHtml(html: string): string {
  let out = html;
  out = out.replace(/<\s*script\b[^<]*(?:(?!<\s*\/\s*script\s*>)<[^<]*)*<\s*\/\s*script\s*>/gi, '');
  out = out.replace(/<\s*(iframe|object|embed|link|meta|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  out = out.replace(/<\s*(?:iframe|object|embed|link|meta|style)\b[^>]*\/?>/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*"(?:[^"]*)"/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*'(?:[^']*)'/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
  out = out.replace(/(href|src)\s*=\s*"(?:\s*javascript:|\s*data:)[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'(?:\s*javascript:|\s*data:)[^']*'/gi, "$1='#'");
  return out;
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();
  const { product } = data;
  const catalog = data.catalog as Catalog | null;

  // --- Primary image: Postgres -> Mongo -> category default stock photo ----
  const primaryImageUrl: string =
    product.primaryImageUrl ??
    catalog?.images?.find((i) => i.isPrimary)?.url ??
    catalog?.images?.[0]?.url ??
    defaultImageFor(product.category?.slug);

  // --- Gallery: merge Postgres imageUrls with Mongo catalog.images, dedupe -
  type GalleryImage = { url: string; alt: string };
  const gallery: GalleryImage[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined, alt?: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    gallery.push({ url, alt: alt ?? product.title });
  };
  push(primaryImageUrl, product.title);
  for (const u of product.imageUrls ?? []) push(u, product.title);
  for (const img of catalog?.images ?? []) push(img.url, img.alt ?? product.title);

  const hasAnyImage = gallery.length > 0;
  const hero: GalleryImage = hasAnyImage
    ? gallery[0]!
    : { url: PLACEHOLDER_SVG, alt: product.title };
  const thumbs = hasAnyImage ? gallery.slice(0, 5) : [];

  // --- Description: descriptionHtml → rich auto-generated fallback --------
  const descriptionHtml: string = product.descriptionHtml
    ? sanitiseHtml(product.descriptionHtml)
    : generateRichDescription({
        title: product.title,
        conditionGrade: product.conditionGrade,
        warrantyMonths: product.warrantyMonths,
        categoryName: product.category.name,
        builderName: product.builder.displayName,
      });

  const stockQty = product.inventory?.stockQty ?? 0;
  const inStock = stockQty > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
      <nav className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-500 sm:mb-6">
        <Link href="/shop" className="hover:text-ink-900 dark:hover:text-ink-50">
          Shop
        </Link>
        <span>/</span>
        <Link href={`/shop/${product.category.slug}`} className="hover:text-ink-900 dark:hover:text-ink-50">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="line-clamp-1 text-ink-900 dark:text-ink-300">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">
          <GlassCard className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={hero.url}
              alt={hero.alt}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
              priority
              unoptimized={!hasAnyImage}
            />
          </GlassCard>
          {thumbs.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2 sm:mt-4">
              {thumbs.map((img) => (
                <div
                  key={img.url}
                  className="relative aspect-square overflow-hidden rounded-md border border-ink-300/60 dark:border-obsidian-500/60"
                >
                  <Image src={img.url} alt={img.alt} fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{product.conditionGrade}</Badge>
            {product.compareAtGbp && Number(product.compareAtGbp) > Number(product.priceGbp) && (
              <SavingsBadge
                priceGbp={Number(product.priceGbp)}
                compareAtGbp={Number(product.compareAtGbp)}
              />
            )}
          </div>
          <h1 className="mt-3 font-display text-[clamp(1.5rem,6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
            {product.title}
          </h1>
          {product.subtitle && <p className="mt-2 text-small text-ink-500 sm:text-base">{product.subtitle}</p>}

          <div className="mt-4 flex items-baseline gap-3 sm:mt-6 sm:gap-4">
            <span className="font-display text-[clamp(1.75rem,8vw,3.5rem)] font-semibold leading-none tracking-[-0.03em]">
              {formatGbp(Number(product.priceGbp))}
            </span>
            {product.compareAtGbp && (
              <span className="text-small text-ink-500 line-through sm:text-base">
                {formatGbp(Number(product.compareAtGbp))}
              </span>
            )}
          </div>

          <div className="mt-3 sm:mt-4">
            <StockUrgency stockQty={stockQty} />
          </div>

          <div className="mt-5 sm:mt-8">
            <AddToCartButton
              productId={product.productId}
              title={product.title}
              slug={product.slug}
              pricePerUnitGbp={Number(product.priceGbp)}
              imageUrl={primaryImageUrl}
              inStock={inStock}
            />
          </div>

          <section className="mt-6 sm:mt-8">
            <h2 className="text-caption uppercase tracking-wider text-ink-500">Description</h2>
            <div
              className="prose prose-sm mt-2 max-w-none space-y-3 text-small text-ink-700 sm:text-body [&_strong]:text-ink-900 dark:prose-invert dark:text-ink-300 dark:[&_strong]:text-ink-50"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </section>

          <GlassCard className="mt-6 p-5 sm:mt-8 sm:p-6">
            <div className="text-caption text-ink-500">Built by</div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/builders/${product.builder.builderCode}`}
                className="text-body font-medium hover:text-brand-green"
              >
                {product.builder.displayName}
              </Link>
              <span className="font-mono text-caption text-ink-500">
                {Number(product.builder.qualityScore).toFixed(2)} / 5 &middot;{' '}
                {product.builder.totalUnitsBuilt.toLocaleString('en-GB')} builds
              </span>
            </div>
          </GlassCard>
        </div>
      </div>

      <RecordViewEffect
        productId={product.productId}
        slug={product.slug}
        title={product.title}
        priceGbp={Number(product.priceGbp)}
        imageUrl={primaryImageUrl}
      />

      <RelatedProducts
        categorySlug={product.category.slug}
        excludeId={product.productId}
        builderCode={product.builder.builderCode}
      />

      <RecentlyViewed excludeId={product.productId} />

      {catalog?.specs && Object.keys(catalog.specs).length > 0 && (
        <section className="mt-12 sm:mt-16">
          <h2 className="font-display text-[clamp(1.5rem,6vw,1.75rem)] font-semibold tracking-[-0.02em] sm:text-h2">
            Specifications
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-ink-300/60 sm:mt-6 dark:border-obsidian-500/60">
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-small">
                <tbody>
                  {flattenSpecs(catalog.specs).map((row) => (
                    <tr
                      key={row.k}
                      className="border-b border-ink-300/40 last:border-0 dark:border-obsidian-500/40"
                    >
                      <th className="w-1/3 bg-ink-50 px-3 py-2.5 text-left align-top text-ink-500 sm:px-4 sm:py-3 dark:bg-obsidian-800">
                        {row.k}
                      </th>
                      <td className="px-3 py-2.5 align-top sm:px-4 sm:py-3">{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Generate a professional product description from available metadata when
 * the scraped descriptionHtml is absent. Extracts CPU/GPU/RAM/storage from the
 * title and wraps it in on-brand trust copy so no product ever reads as blank.
 */
function generateRichDescription(p: {
  title: string;
  conditionGrade: string;
  warrantyMonths: number;
  categoryName: string;
  builderName: string;
}): string {
  const t = p.title;
  const cpu = t.match(/\b(i[3579](?:-\d{4,5}\w*)?|core i[3579](?:-\d{4,5}\w*)?|ryzen [3579]\b[\w-]*|m[1-4](?: pro| max| ultra)?|xeon|celeron)/i)?.[0];
  const gpu = t.match(/\b(rtx ?\d{3,4}(?:\s?ti)?|gtx ?\d{3,4}|rx ?\d{3,4}|radeon \w+)\b/i)?.[0];
  const ram = t.match(/\b(\d{1,3})\s*gb\s*(?:ram|ddr\d?)\b/i)?.[1];
  const ssd = t.match(/\b(\d+\s*(?:gb|tb))\s*(?:ssd|nvme)/i)?.[1];
  const hdd = t.match(/\b(\d+\s*(?:gb|tb))\s*hdd/i)?.[1];
  const os = t.match(/\bwin(?:dows)?\s*(10|11)\b/i)?.[0];

  const specs: string[] = [];
  if (cpu) specs.push(cpu.replace(/^core\s+/i, '').trim());
  if (gpu) specs.push(gpu);
  if (ram) specs.push(`${ram}GB RAM`);
  if (ssd) specs.push(`${ssd} SSD`);
  if (hdd) specs.push(`${hdd} HDD`);
  if (os) specs.push(os.replace(/win\s*/i, 'Windows '));

  const specLine = specs.length > 0 ? specs.join(' \u00b7 ') : null;

  // Category-specific opener. We key off the per-product condition grade so
  // brand-new units don't read as "refurbished" while genuinely refurbished
  // stock still gets the right language.
  const isNew = /^brand\s*new|new$/i.test(p.conditionGrade.trim());
  const qualifier = isNew ? 'brand-new' : 'carefully refurbished';
  const cat = p.categoryName.toLowerCase();
  let opener: string;
  if (cat.includes('laptop')) {
    opener = `A ${qualifier} laptop${specLine ? ` packing ${specLine}` : ''}. Quiet, battery-checked, ready for a new owner.`;
  } else if (cat.includes('gaming')) {
    opener = `A hand-built gaming rig${specLine ? ` with ${specLine}` : ''}. Bench-tested on real games, not synthetic benchmarks alone.`;
  } else if (cat.includes('monitor')) {
    opener = `A fully tested display, calibrated and panel-checked. Pixel-perfect out of the box.`;
  } else if (cat.includes('all-in-one')) {
    opener = `An all-in-one ${qualifier} PC${specLine ? ` running ${specLine}` : ''}. One clean unit, zero clutter.`;
  } else if (cat.includes('network')) {
    opener = `Enterprise network kit, bench-tested, port-by-port verified, and factory-reset before shipping.`;
  } else if (cat.includes('projector')) {
    opener = `A tested projector with lamp hours checked, optics cleaned, and colour calibrated to spec.`;
  } else if (cat.includes('parts')) {
    opener = `A tested component ready to drop into your build${specLine ? ` (${specLine})` : ''}. Verified working before dispatch.`;
  } else if (cat.includes('power')) {
    opener = `A tested power supply: voltage regulation, ripple, and load-bearing verified under real conditions.`;
  } else if (cat.includes('hard')) {
    opener = `A tested storage device with SMART health checked and surface-scanned end-to-end before it left the bench.`;
  } else if (cat.includes('printer')) {
    opener = `A ${qualifier} printer, test-printed, cleaned, and calibrated. Ready for day-one use.`;
  } else {
    opener = `A ${isNew ? 'brand-new' : 'professionally refurbished'} ${p.categoryName.toLowerCase()} from Birmingham AV${specLine ? `, featuring ${specLine}` : ''}.`;
  }

  return [
    `<p>${opener}</p>`,
    `<p><strong>Tested on the bench.</strong> Every unit passes our 7-stage QC before shipping: POST, burn-in, thermal stress, memtest, GPU stress (where applicable), disk read/write, peripherals, and a final cosmetic check.</p>`,
    `<p><strong>${p.warrantyMonths}-month warranty.</strong> Parts and labour, no small print. Built and signed by ${p.builderName} — the name on the warranty card is the name on the bench.</p>`,
  ].join('');
}

function flattenSpecs(
  specs: Record<string, unknown>,
  prefix = '',
): Array<{ k: string; v: string }> {
  const out: Array<{ k: string; v: string }> = [];
  for (const [k, v] of Object.entries(specs)) {
    const label = (prefix ? `${prefix} ${k}` : k)
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object' && item)
          out.push(...flattenSpecs(item as Record<string, unknown>, `${label} ${i + 1}`));
      });
    } else if (typeof v === 'object') {
      out.push(...flattenSpecs(v as Record<string, unknown>, label));
    } else {
      out.push({ k: label, v: String(v) });
    }
  }
  return out;
}
