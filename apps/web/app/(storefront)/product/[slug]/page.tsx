import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, GlassCard } from '@/components/ui';
import { getProductBySlug } from '@/lib/services/products';
import { formatGbp } from '@bav/lib';
import { AddToCartButton } from './AddToCartButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getProductBySlug(params.slug);
  if (!data) {
    return {
      title: 'Product not found',
      description: 'This refurbished PC listing is no longer available at Birmingham AV.',
    };
  }
  const { product } = data;
  const priceLabel = formatGbp(Number(product.priceGbp));
  const subtitle = product.subtitle ? ` ${product.subtitle}.` : '';
  const description =
    `${product.title} refurbished PC from Birmingham AV, built by ${product.builder.displayName}.${subtitle} ${priceLabel} with 12-month warranty.`.slice(
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

  // --- Primary image: Postgres → Mongo → null ------------------------------
  const primaryImageUrl: string | null =
    product.primaryImageUrl ??
    catalog?.images?.find((i) => i.isPrimary)?.url ??
    catalog?.images?.[0]?.url ??
    null;

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

  // --- Description: descriptionHtml → subtitle → fallback ------------------
  const descriptionHtml: string | null = product.descriptionHtml
    ? sanitiseHtml(product.descriptionHtml)
    : null;
  const descriptionFallback = product.subtitle ?? 'No description available.';

  const stockQty = product.inventory?.stockQty ?? 0;
  const inStock = stockQty > 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <nav className="mb-6 flex items-center gap-2 text-caption text-ink-500">
        <Link href="/shop" className="hover:text-ink-900 dark:hover:text-ink-50">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/shop/${product.category.slug}`}
          className="hover:text-ink-900 dark:hover:text-ink-50"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-ink-900 dark:text-ink-300">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
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
            <div className="mt-4 grid grid-cols-5 gap-2">
              {thumbs.map((img) => (
                <div
                  key={img.url}
                  className="relative aspect-square overflow-hidden rounded-md border border-ink-300/60 dark:border-obsidian-500/60"
                >
                  <Image src={img.url} alt={img.alt} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-5">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{product.conditionGrade}</Badge>
            {inStock ? (
              <Badge tone="positive">In stock</Badge>
            ) : (
              <Badge tone="warning">Awaiting build</Badge>
            )}
          </div>
          <h1 className="mt-3 text-h1 font-display">{product.title}</h1>
          {product.subtitle && <p className="mt-2 text-ink-500">{product.subtitle}</p>}

          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-display-lg font-display">{formatGbp(Number(product.priceGbp))}</span>
            {product.compareAtGbp && (
              <span className="text-ink-500 line-through">
                {formatGbp(Number(product.compareAtGbp))}
              </span>
            )}
          </div>

          <div className="mt-8">
            <AddToCartButton
              productId={product.productId}
              title={product.title}
              slug={product.slug}
              pricePerUnitGbp={Number(product.priceGbp)}
              imageUrl={primaryImageUrl}
              inStock={inStock}
            />
          </div>

          <section className="mt-8">
            <h2 className="text-caption uppercase tracking-wider text-ink-500">Description</h2>
            {descriptionHtml ? (
              <div
                className="prose prose-sm mt-2 max-w-none text-body text-ink-700 dark:prose-invert dark:text-ink-300"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="mt-2 text-body text-ink-700 dark:text-ink-300">{descriptionFallback}</p>
            )}
          </section>

          <GlassCard className="mt-8 p-6">
            <div className="text-caption text-ink-500">Built by</div>
            <div className="mt-1 flex items-center justify-between">
              <Link
                href={`/builders/${product.builder.builderCode}`}
                className="text-body font-medium hover:text-brand-green"
              >
                {product.builder.displayName}
              </Link>
              <span className="font-mono text-caption text-ink-500">
                {Number(product.builder.qualityScore).toFixed(2)} / 5 ·{' '}
                {product.builder.totalUnitsBuilt.toLocaleString('en-GB')} builds
              </span>
            </div>
          </GlassCard>
        </div>
      </div>

      {catalog?.specs && Object.keys(catalog.specs).length > 0 && (
        <section className="mt-16">
          <h2 className="text-h2 font-display">Specifications</h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-ink-300/60 dark:border-obsidian-500/60">
            <table className="w-full font-mono text-small">
              <tbody>
                {flattenSpecs(catalog.specs).map((row) => (
                  <tr
                    key={row.k}
                    className="border-b border-ink-300/40 last:border-0 dark:border-obsidian-500/40"
                  >
                    <th className="w-1/3 bg-ink-50 px-4 py-3 text-left text-ink-500 dark:bg-obsidian-800">
                      {row.k}
                    </th>
                    <td className="px-4 py-3">{row.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
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
