import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getProductBySlug } from '@/lib/services/products';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';
import { AddToCartButton } from './AddToCartButton';
import { ProductSchema } from '@/components/seo/ProductSchema';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { buildProductTitle, buildProductDescription } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getProductBySlug(params.slug);
  if (!data) {
    return { title: 'Product not found', description: 'This listing is no longer available at Birmingham AV.' };
  }
  const { product } = data;
  const seoProduct = {
    title: product.title,
    subtitle: product.subtitle,
    conditionGrade: product.conditionGrade,
    warrantyMonths: product.warrantyMonths,
    priceGbp: Number(product.priceGbp),
    builderDisplayName: product.builder.displayName,
    categorySlug: product.category.slug,
    inStock: (product.inventory?.stockQty ?? 0) > 0,
  };
  return {
    title: buildProductTitle(seoProduct),
    description: buildProductDescription(seoProduct),
  };
}

type Catalog = {
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  specs?: Record<string, unknown>;
};

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();

  const { product } = data;
  const catalog = data.catalog as Catalog | null;

  const [related, totalBuilds] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        NOT: { productId: product.productId },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { builder: { select: { displayName: true, builderCode: true } } },
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const buildNumber = buildNumberFromSku(product.sku);
  const [titleMain, titleSwash] = splitForSwash(product.title);
  const priceLabel = formatGbp(Number(product.priceGbp));
  const compareLabel = product.compareAtGbp ? formatGbp(Number(product.compareAtGbp)) : null;
  const klarnaInstalment = formatGbp(Number(product.priceGbp) / 4);
  const stockQty = product.inventory?.stockQty ?? 0;
  const inStock = stockQty > 0;
  const leadImage = product.primaryImageUrl ?? catalog?.images?.find((i) => i.isPrimary)?.url ?? catalog?.images?.[0]?.url ?? null;

  const specs = catalog?.specs ? flattenSpecs(catalog.specs).slice(0, 11) : [];
  const lead = leadParagraph({
    conditionGrade: product.conditionGrade,
    categoryName: product.category.name,
    builderName: product.builder.displayName,
    warrantyMonths: product.warrantyMonths,
  });

  const timeline = [
    { step: 'Order placed', detail: 'Payment confirmed, build slot reserved.' },
    { step: 'Components picked', detail: 'Each part scanned and serial-logged.' },
    { step: 'Build', detail: `Hand-assembled by ${product.builder.displayName}. Four to six hours.` },
    { step: 'Bench test', detail: '24-hour burn-in. Benchmarks printed to your birth certificate.' },
    { step: 'Dispatch', detail: 'Packed, manifested, shipped. Tracking sent by email and app.' },
  ];

  const schemaImages: string[] = Array.from(
    new Set(
      [
        product.primaryImageUrl,
        ...(product.imageUrls ?? []),
        ...(catalog?.images?.map((i) => i.url) ?? []),
      ].filter((u): u is string => typeof u === 'string' && u.length > 0),
    ),
  );

  const seoProduct = {
    title: product.title,
    description:
      (product.subtitle ??
        `${product.conditionGrade} ${product.category.name} built by ${product.builder.displayName} at Birmingham AV.`).slice(0, 300),
    sku: product.sku,
    slug: product.slug,
    priceGbp: Number(product.priceGbp),
    compareAtGbp: product.compareAtGbp ? Number(product.compareAtGbp) : null,
    conditionGrade: product.conditionGrade,
    imageUrls: schemaImages,
    warrantyMonths: product.warrantyMonths,
    inStock,
    builderName: product.builder.displayName,
  };

  return (
    <div>
      <ProductSchema product={seoProduct} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          { name: product.category.name, url: `/shop/${product.category.slug}` },
          { name: product.title, url: `/product/${product.slug}` },
        ]}
      />
      {/* Breadcrumb */}
      <div className="border-b border-ink-10">
        <div className="mx-auto flex max-w-page items-center justify-between px-12 py-5">
          <div className="bav-label flex gap-[10px] text-ink-60">
            <Link href="/shop" className="bav-hover-opa text-inherit no-underline">
              Shop
            </Link>
            <span className="text-ink-30">/</span>
            <Link href={`/shop/${product.category.slug}`} className="bav-hover-opa text-inherit no-underline">
              {product.category.name}
            </Link>
            <span className="text-ink-30">/</span>
            <span className="line-clamp-1 text-ink">{product.title}</span>
          </div>
          <div className="bav-label whitespace-nowrap text-ink-30">
            Build {buildNumber} / {String(totalBuilds).padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section>
        <div className="mx-auto max-w-page px-12 pb-24 pt-16">
          <div className="grid grid-cols-12 gap-16">
            {/* Gallery */}
            <div className="bav-fade col-span-7">
              <div className="bav-canvas relative mb-4 aspect-[4/5]">
                {leadImage ? (
                  <Image
                    src={leadImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 60vw"
                    className="relative z-10 object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-display font-light leading-none tracking-[-0.05em] text-[rgba(23,20,15,0.06)] select-none text-[clamp(200px,26vw,420px)]">
                    <span className="italic">№</span>
                    {buildNumber}
                  </div>
                )}
                <div className="absolute left-6 right-6 top-6 flex justify-between">
                  <div className="bav-label text-ink-60">
                    Build {buildNumber} · {product.category.name}
                  </div>
                  <div className="bav-label text-ink-60">View 01 / 04</div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                  <div className="bav-label text-ink-60">Studio · seamless</div>
                  <div className="bav-label text-ink-60">Rendered at 2400 × 3000</div>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {['Front', 'Interior', 'Rear I/O', 'Detail'].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className="bav-thumb relative aspect-square cursor-pointer border-none bg-paper-2 p-0"
                    style={{ opacity: i === 0 ? 1 : 0.6, outline: i === 0 ? '1px solid var(--ink)' : 'none', outlineOffset: -1 }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center font-display font-light italic tracking-[-0.04em] text-[rgba(23,20,15,0.15)] text-[48px]">
                      {i + 1}
                    </span>
                    <span className="bav-label absolute bottom-2 left-2 text-[9px] text-ink-60">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="col-span-5">
              <div className="sticky top-24 bav-fade">
                <div className="bav-label mb-6 flex items-center gap-3 text-ink-60">
                  <span className="bav-pulse" />
                  <span>{inStock ? `In stock · ${stockQty} available` : 'Currently unavailable'}</span>
                </div>

                <h1 className="mb-5 font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(48px,5.5vw,72px)]">
                  {titleMain}
                  {titleSwash && <> <span className="bav-italic">{titleSwash}</span></>}
                </h1>

                {product.subtitle && (
                  <div className="mb-10 font-mono text-[13px] tabular-nums text-ink-60">
                    {product.subtitle}
                  </div>
                )}

                <p className="mb-10 max-w-[480px] text-[17px] leading-[1.6] text-ink-60">{lead}</p>

                <div className="mb-2 flex items-baseline gap-5">
                  <div className="font-mono text-[36px] tabular-nums tracking-[-0.02em]">{priceLabel}</div>
                  {compareLabel && (
                    <div className="font-mono text-[13px] tabular-nums text-ink-30 line-through">{compareLabel}</div>
                  )}
                </div>
                <div className="bav-label mb-8 text-ink-60">Or 4 interest-free payments of {klarnaInstalment} with Klarna</div>

                <div className="mb-8 border-y border-ink-10 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <MetaCell k="Condition" v={`${product.conditionGrade} · Warrantied`} />
                    <MetaCell k="Lead time" v={inStock ? '48 hours · UK' : 'On request'} />
                    <MetaCell k="Warranty" v={`${product.warrantyMonths} months · parts & labour`} />
                    <MetaCell k="Returns" v="30 days · no questions" />
                  </div>
                </div>

                <AddToCartButton
                  productId={product.productId}
                  title={product.title}
                  slug={product.slug}
                  pricePerUnitGbp={Number(product.priceGbp)}
                  imageUrl={leadImage}
                  inStock={inStock}
                  priceLabel={priceLabel}
                  buildNumber={buildNumber}
                  conditionGrade={product.conditionGrade}
                  builder={{
                    displayName: product.builder.displayName,
                    builderCode: product.builder.builderCode,
                  }}
                />

                <div className="flex items-center gap-4 border-t border-ink-10 pt-6">
                  <div className="bav-ink-canvas h-14 w-14 flex-shrink-0 overflow-hidden">
                    {product.builder.avatarUrl && (
                      <Image
                        src={product.builder.avatarUrl}
                        alt={product.builder.displayName}
                        width={56}
                        height={56}
                        className="relative z-10 h-full w-full object-cover"
                        unoptimized={product.builder.avatarUrl.endsWith('.svg')}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-[2px] text-[14px]">
                      Built by{' '}
                      <span className="font-display text-[17px] tracking-[-0.01em]">{product.builder.displayName}</span>
                    </div>
                    <div className="bav-label text-ink-60">
                      {product.builder.builderCode} · {Number(product.builder.qualityScore).toFixed(2)} / 5 ·{' '}
                      {product.builder.totalUnitsBuilt.toLocaleString('en-GB')} builds
                    </div>
                  </div>
                  <Link
                    href={`/builders/${product.builder.builderCode}`}
                    className="bav-underline text-[12px] text-ink-60 no-underline"
                  >
                    <span>Profile</span>
                    <span className="arrow">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The build — editorial */}
      <section className="border-t border-ink-10 bg-paper-2">
        <div className="mx-auto max-w-page px-12 py-32">
          <div className="grid grid-cols-12 gap-16">
            <div className="col-span-4">
              <div className="bav-label mb-6 text-ink-60">— The build</div>
              <h2 className="font-display font-light leading-none tracking-[-0.025em] text-[clamp(40px,4.2vw,60px)]">
                Considered<br />from the <span className="bav-italic">socket</span>.
              </h2>
            </div>
            <div className="col-span-8">
              <div className="max-w-[720px]">
                <p className="mb-8 font-display font-light leading-[1.45] tracking-[-0.015em] text-ink text-[clamp(22px,2vw,28px)]">
                  Every {product.category.name.toLowerCase()} begins with the same question: what does this machine need to do, quietly, for the next five years?
                </p>
                <p className="mb-6 text-[17px] leading-[1.65] text-ink-60">
                  {product.descriptionHtml
                    ? stripHtml(sanitiseHtml(product.descriptionHtml)).slice(0, 480)
                    : `Every part is chosen for how it will behave on the bench, not just on the spec sheet. Thermals, acoustics, and power delivery are tuned, not assumed. Cable routing is photographed before shipping. The chassis is cleaned the way a camera body would be.`}
                </p>
                <p className="mb-10 text-[17px] leading-[1.65] text-ink-60">
                  It ships with a 24-hour burn-in report, a hand-signed birth certificate from {product.builder.displayName}, and a code to register its serial to your account. Every component is logged for life.
                </p>
                <Link href={`/builders/${product.builder.builderCode}`} className="bav-underline text-[14px] text-ink no-underline">
                  <span>The {product.title} bench report</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specification */}
      {specs.length > 0 && (
        <section className="border-t border-ink-10">
          <div className="mx-auto max-w-page px-12 py-32">
            <div className="grid grid-cols-12 gap-16">
              <div className="col-span-4">
                <div className="bav-label mb-6 text-ink-60">— Specification</div>
                <h2 className="font-display font-light leading-none tracking-[-0.025em] text-[clamp(40px,4.2vw,60px)]">
                  Every<br />component<br />accounted for.
                </h2>
              </div>
              <div className="col-span-8">
                <div>
                  {specs.map((s, i) => (
                    <div
                      key={s.k}
                      className={`grid grid-cols-[1fr_2fr] gap-8 border-t border-ink-10 py-6 ${i === specs.length - 1 ? 'border-b' : ''}`}
                    >
                      <div className="bav-label pt-[2px] text-ink-60">{s.k}</div>
                      <div className="text-[15px] leading-[1.55]">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-10">
                  <a href="#" className="bav-underline text-[13px] text-ink no-underline">
                    <span>Download full specification (PDF)</span>
                    <span className="arrow">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="border-t border-ink-10 bg-paper-2">
        <div className="mx-auto max-w-page px-12 py-32">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <div className="bav-label mb-5 text-ink-60">— What happens next</div>
              <h2 className="font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(44px,5vw,72px)]">
                Order to <span className="bav-italic">doorstep</span>.
              </h2>
            </div>
            <div className="bav-label text-ink-60">≈ 5 days · UK</div>
          </div>
          <div className="grid grid-cols-5 gap-px bg-ink-10">
            {timeline.map((t, i) => (
              <div key={t.step} className="bg-paper-2 p-8">
                <div className="mb-4 font-display font-light tracking-[-0.025em] text-ink text-[36px]">
                  <span className="italic text-ink-30">0{i + 1}</span>
                </div>
                <div className="mb-2 text-[15px]">{t.step}</div>
                <div className="text-[13px] leading-[1.5] text-ink-60">{t.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-ink-10">
          <div className="mx-auto max-w-page px-12 py-32">
            <div className="mb-16 flex items-end justify-between">
              <div>
                <div className="bav-label mb-5 text-ink-60">— Also considered</div>
                <h2 className="font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(44px,5vw,72px)]">
                  Adjacent <span className="bav-italic">builds</span>.
                </h2>
              </div>
              <Link href={`/shop/${product.category.slug}`} className="bav-underline text-[14px] text-ink no-underline">
                <span>All {product.category.name.toLowerCase()}</span>
                <span className="arrow">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-10">
              {related.map((p) => {
                const n = buildNumberFromSku(p.sku);
                return (
                  <Link key={p.productId} href={`/product/${p.slug}`} className="bav-tile block text-ink no-underline">
                    <div className="bav-canvas relative mb-5 aspect-[4/5]">
                      <div className="bav-tile-num absolute inset-0 flex items-center justify-center font-display font-light leading-none tracking-[-0.04em] select-none text-[clamp(120px,13vw,180px)]">
                        <span className="italic">№</span>
                        {n}
                      </div>
                      <div className="bav-label absolute left-4 top-4 text-ink-60">Build {n}</div>
                    </div>
                    <div className="mb-[6px] flex items-baseline justify-between gap-3">
                      <div className="line-clamp-1 font-display text-[22px] tracking-[-0.015em]">{p.title}</div>
                      <div className="font-mono text-[14px] tabular-nums">{formatGbp(Number(p.priceGbp))}</div>
                    </div>
                    {p.subtitle && (
                      <div className="flex justify-between">
                        <div className="line-clamp-1 font-mono text-[11px] tabular-nums text-ink-60">{p.subtitle}</div>
                        <div className="bav-label whitespace-nowrap text-ink-60">
                          {p.conditionGrade === 'New' ? '48h' : '3–5d'}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetaCell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="bav-label mb-[6px] text-ink-60">{k}</div>
      <div className="text-[14px]">{v}</div>
    </div>
  );
}

function buildNumberFromSku(sku: string): string {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return '000';
  return m[1].padStart(3, '0').slice(-3);
}

/**
 * If the product title ends in a clean editorial suffix ("Ultra", "Pro",
 * "Max", "Prime", "Edition", "Studio", "Plus"), split so the caller can
 * render the suffix as an italic swash. Long eBay-style titles fall through
 * untouched — italicising the last word in "HP EliteBook 840 G8 i5" would
 * look broken.
 */
function splitForSwash(title: string): [string, string | null] {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1 || words.length > 3) return [title, null];
  const last = words[words.length - 1];
  if (!last) return [title, null];
  if (/^(Ultra|Pro|Max|Prime|Edition|Lite|Plus|Air|Studio|Mini|Nano|Neo|Refined|Considered)$/i.test(last)) {
    return [words.slice(0, -1).join(' '), last];
  }
  return [title, null];
}

function leadParagraph(p: {
  conditionGrade: string;
  categoryName: string;
  builderName: string;
  warrantyMonths: number;
}): string {
  const isNew = /^(brand\s*)?new$/i.test(p.conditionGrade.trim());
  const opener = isNew ? 'Brand-new, built to order' : 'Fully refurbished, bench-tested, ready to ship';
  return `${opener} in the United Kingdom by ${p.builderName}. ${p.warrantyMonths}-month warranty, parts and labour, no small print. For people who care what's inside, not just what's on the box.`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

function flattenSpecs(specs: Record<string, unknown>, prefix = ''): Array<{ k: string; v: string }> {
  const out: Array<{ k: string; v: string }> = [];
  for (const [k, v] of Object.entries(specs)) {
    const label = (prefix ? `${prefix} ${k}` : k).replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object' && item) out.push(...flattenSpecs(item as Record<string, unknown>, `${label} ${i + 1}`));
      });
    } else if (typeof v === 'object') {
      out.push(...flattenSpecs(v as Record<string, unknown>, label));
    } else {
      out.push({ k: label, v: String(v) });
    }
  }
  return out;
}
