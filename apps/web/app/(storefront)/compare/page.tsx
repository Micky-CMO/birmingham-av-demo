import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { connectMongo, ProductCatalog } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Compare',
  description: 'Set up to three Birmingham AV builds alongside each other. A thin rule marks where each column differs from the first.',
};
export const dynamic = 'force-dynamic';

type CompareProduct = {
  productId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  priceGbp: number;
  conditionGrade: string;
  warrantyMonths: number;
  stockQty: number;
  buildNumber: string | null;
  builder: { displayName: string; builderCode: string };
  specs: Specs;
};

type Specs = {
  cpu?: {
    brand?: string | null;
    family?: string | null;
    model?: string | null;
    cores?: number | null;
    threads?: number | null;
    boostClockGhz?: number | null;
  };
  gpu?: {
    brand?: string | null;
    model?: string | null;
    vramGb?: number | null;
    rtx?: boolean | null;
  };
  memory?: {
    sizeGb?: number | null;
    type?: string | null;
    speedMhz?: number | null;
  };
  storage?: Array<{
    kind?: string | null;
    capacityGb?: number | null;
    brand?: string | null;
    model?: string | null;
  }>;
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const slugKeys = ['a', 'b', 'c'] as const;
  const slugs = slugKeys
    .map((k) => {
      const raw = searchParams[k];
      return Array.isArray(raw) ? raw[0] : raw;
    })
    .filter((s): s is string => typeof s === 'string' && s.length > 0);

  const products = await loadProducts(slugs);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-12 pb-32 pt-14">
        {/* HEADER */}
        <div className="bav-fade mb-12 grid grid-cols-1 items-end gap-8 border-b border-ink-10 pb-8 md:grid-cols-[7fr_5fr]">
          <div>
            <div className="bav-label mb-6 text-ink-60">— Side by side</div>
            <h1 className="m-0 font-display text-[clamp(48px,6.2vw,88px)] font-light leading-[1.02] tracking-[-0.02em]">
              Compare, <span className="bav-italic">considered</span>.
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-6">
            <span className="font-mono text-[12px] tabular-nums text-ink-60">
              {String(products.length).padStart(2, '0')} / 03
            </span>
            <Link href="/shop" className="bav-underline text-[13px] text-ink no-underline">
              <span>Back to shop</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>

        {products.length === 0 && (
          <div className="border border-ink-10 p-16 text-center">
            <div className="bav-label mb-4 text-ink-30">— Nothing to compare</div>
            <div className="font-display text-[28px] text-ink">
              Pick two or three products from the <span className="bav-italic">shop</span>.
            </div>
            <p className="mx-auto mt-6 max-w-[420px] text-[14px] leading-[1.6] text-ink-60">
              Use{' '}
              <span className="font-mono tabular-nums text-ink">
                /compare?a=slug1&amp;b=slug2
              </span>{' '}
              to line builds up side by side. Up to three at once.
            </p>
            <Link
              href="/shop"
              className="bav-underline mt-6 inline-flex text-[14px] text-ink no-underline"
            >
              <span>Browse the catalogue</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        )}

        {products.length === 1 && (
          <div className="mb-12 border border-ink-10 p-[72px_32px] text-center">
            <div className="bav-label mb-4 text-ink-30">— Waiting</div>
            <div className="font-display text-[28px] font-normal text-ink">
              Add another product to <span className="bav-italic">compare</span>.
            </div>
            <p className="mx-auto mt-3 max-w-[420px] text-[14px] text-ink-60">
              Comparisons need at least two products. Pick another from the catalogue.
            </p>
            <Link
              href="/shop"
              className="bav-underline mt-6 inline-flex text-[14px] text-ink no-underline"
            >
              <span>Browse the catalogue</span>
              <span className="arrow">+</span>
            </Link>
          </div>
        )}

        {products.length >= 2 && <CompareTable products={products} />}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
          <p className="m-0 max-w-[560px] text-[13px] leading-[1.55] text-ink-60">
            A thin rule down the left of a cell marks where that product differs from the first. Up to three
            products compare at once.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompareTable({ products }: { products: CompareProduct[] }) {
  const rows = buildRows(products);
  const cols = products.length;
  const gridTemplate = `260px repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto border border-ink-10 bg-paper">
      <div className="w-full">
        {/* TOP — product tiles */}
        <CompareRow gridTemplate={gridTemplate} first>
          <div className="flex items-end border-r border-ink-10 bg-paper px-5 py-6">
            <span className="bav-label text-ink-30">— Products</span>
          </div>
          {products.map((p, idx) => (
            <div
              key={p.productId}
              className="border-r border-ink-10 last:border-r-0"
              style={{ padding: 0 }}
            >
              <div className="flex flex-col gap-[18px] p-5">
                <div
                  className="bav-canvas flex w-full items-center justify-center"
                  style={{ aspectRatio: '4 / 3', position: 'relative' }}
                >
                  <div
                    className="bav-italic relative z-[1] flex items-baseline font-display font-light leading-none"
                    style={{
                      fontSize: 'clamp(80px, 8vw, 120px)',
                      color: 'rgba(23,20,15,0.88)',
                    }}
                  >
                    <span style={{ fontSize: '0.5em', marginRight: 4 }}>№</span>
                    {p.buildNumber ?? String(idx + 1).padStart(2, '0')}
                  </div>
                </div>
                <div>
                  <Link
                    href={`/product/${p.slug}`}
                    className="bav-hover-opa text-inherit no-underline"
                  >
                    <div className="font-display text-[22px] font-normal leading-[1.2] tracking-[-0.01em] text-ink">
                      {p.title}
                    </div>
                  </Link>
                  {p.subtitle && (
                    <div className="mt-[6px] text-[13px] leading-[1.5] text-ink-60">{p.subtitle}</div>
                  )}
                  <div className="mt-[10px] font-mono text-[11px] tabular-nums text-ink-30">
                    Build {p.buildNumber ?? '—'} · {p.builder.builderCode}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CompareRow>

        {/* SPEC ROWS */}
        {rows.map((row) => {
          const flags = diffFlags(row.values);
          return (
            <CompareRow key={row.label} gridTemplate={gridTemplate}>
              <div className="flex items-center border-r border-ink-10 bg-paper px-5 py-6">
                <span className="bav-label text-ink-60">{row.label}</span>
              </div>
              {row.values.map((v, i) => (
                <div
                  key={i}
                  className={`relative border-r border-ink-10 px-5 py-6 last:border-r-0 ${
                    flags[i] ? 'bav-compare-diff' : ''
                  }`}
                  style={
                    flags[i]
                      ? {
                          boxShadow: 'inset 2px 0 0 var(--ink)',
                        }
                      : undefined
                  }
                >
                  <div
                    className={
                      row.emphasis
                        ? 'font-mono text-[20px] tabular-nums text-ink'
                        : 'text-[14px] font-medium leading-[1.4] text-ink'
                    }
                  >
                    {v}
                  </div>
                  {row.detail[i] && (
                    <div className="mt-1 text-[12px] leading-[1.5] text-ink-60">{row.detail[i]}</div>
                  )}
                </div>
              ))}
            </CompareRow>
          );
        })}

        {/* CTA ROW */}
        <CompareRow gridTemplate={gridTemplate}>
          <div className="flex items-center border-r border-ink-10 bg-paper px-5 py-6">
            <span className="bav-label text-ink-30">— Action</span>
          </div>
          {products.map((p) => (
            <div key={p.productId} className="border-r border-ink-10 p-5 last:border-r-0">
              <Link
                href={`/product/${p.slug}`}
                className="bav-cta"
                style={{ textDecoration: 'none', padding: '16px 24px', fontSize: 12 }}
              >
                {p.stockQty === 0 ? 'View (out of stock)' : 'View product'}
              </Link>
            </div>
          ))}
        </CompareRow>
      </div>
    </div>
  );
}

function CompareRow({
  children,
  gridTemplate,
  first,
}: {
  children: React.ReactNode;
  gridTemplate: string;
  first?: boolean;
}) {
  return (
    <div
      className="grid items-stretch"
      style={{
        gridTemplateColumns: gridTemplate,
        borderTop: first ? 'none' : '1px solid var(--ink-10)',
      }}
    >
      {children}
    </div>
  );
}

type Row = {
  label: string;
  values: string[];
  detail: string[];
  emphasis?: boolean;
};

function buildRows(products: CompareProduct[]): Row[] {
  const storageDesc = (p: CompareProduct) => {
    const s = p.specs.storage?.[0];
    if (!s || !s.capacityGb) return '—';
    const size = s.capacityGb >= 1000 ? `${s.capacityGb / 1000}TB` : `${s.capacityGb}GB`;
    return `${size} ${s.brand ?? ''} ${s.model ?? ''}`.trim();
  };
  const dashIfMissing = (v: string | number | null | undefined) =>
    v === null || v === undefined || v === '' ? '—' : String(v);

  return [
    {
      label: 'Processor',
      values: products.map((p) =>
        dashIfMissing([p.specs.cpu?.family, p.specs.cpu?.model].filter(Boolean).join(' ')),
      ),
      detail: products.map((p) => {
        const cpu = p.specs.cpu ?? {};
        const bits: string[] = [];
        if (cpu.cores && cpu.threads) bits.push(`${cpu.cores}c / ${cpu.threads}t`);
        if (cpu.boostClockGhz) bits.push(`${cpu.boostClockGhz} GHz boost`);
        return bits.join(' · ');
      }),
    },
    {
      label: 'Graphics',
      values: products.map((p) =>
        dashIfMissing([p.specs.gpu?.brand, p.specs.gpu?.model].filter(Boolean).join(' ')),
      ),
      detail: products.map((p) => {
        const gpu = p.specs.gpu ?? {};
        const bits: string[] = [];
        if (gpu.vramGb) bits.push(`${gpu.vramGb}GB VRAM`);
        if (gpu.rtx) bits.push('RTX');
        return bits.join(' · ');
      }),
    },
    {
      label: 'Memory',
      values: products.map((p) =>
        p.specs.memory?.sizeGb
          ? `${p.specs.memory.sizeGb}GB ${p.specs.memory.type ?? ''}`.trim()
          : '—',
      ),
      detail: products.map((p) =>
        p.specs.memory?.speedMhz ? `${p.specs.memory.speedMhz} MT/s` : '',
      ),
    },
    {
      label: 'Storage',
      values: products.map(storageDesc),
      detail: products.map(() => ''),
    },
    {
      label: 'Condition',
      values: products.map((p) => p.conditionGrade),
      detail: products.map(() => ''),
    },
    {
      label: 'Warranty',
      values: products.map((p) => `${p.warrantyMonths} months`),
      detail: products.map(() => 'Parts & labour'),
    },
    {
      label: 'Builder',
      values: products.map((p) => p.builder.displayName),
      detail: products.map((p) => p.builder.builderCode),
    },
    {
      label: 'Stock',
      values: products.map((p) =>
        p.stockQty === 0
          ? 'Out of stock'
          : p.stockQty <= 2
            ? `Only ${p.stockQty} left`
            : 'In stock',
      ),
      detail: products.map(() => ''),
    },
    {
      label: 'Price',
      values: products.map((p) => `£${p.priceGbp.toLocaleString('en-GB')}`),
      detail: products.map(() => 'inc. VAT'),
      emphasis: true,
    },
  ];
}

function diffFlags(values: string[]): boolean[] {
  const first = values[0];
  return values.map((v, i) => (i === 0 ? false : v !== first));
}

async function loadProducts(slugs: string[]): Promise<CompareProduct[]> {
  const uniqueSlugs = Array.from(new Set(slugs)).slice(0, 3);
  if (uniqueSlugs.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { slug: { in: uniqueSlugs }, isActive: true },
    include: {
      builder: { select: { displayName: true, builderCode: true } },
      inventory: { select: { stockQty: true } },
    },
  });

  // Preserve requested order (a, b, c).
  const bySlug = new Map(rows.map((r) => [r.slug, r] as const));
  const ordered = uniqueSlugs.map((s) => bySlug.get(s)).filter(Boolean) as typeof rows;

  // Fetch mongo spec enrichment.
  const catalogBySlug = new Map<string, { specs?: Specs }>();
  try {
    const conn = await connectMongo();
    if (conn) {
      const catalogs = await ProductCatalog.find({
        postgresProductId: { $in: ordered.map((p) => p.productId) },
      }).lean();
      for (const c of catalogs as Array<{ postgresProductId: string; slug: string; specs?: Specs }>) {
        catalogBySlug.set(c.slug, { specs: c.specs });
      }
    }
  } catch (err) {
    console.warn('[compare] mongo lookup failed', (err as Error).message);
  }

  return ordered.map((p) => {
    const catalog = catalogBySlug.get(p.slug);
    return {
      productId: p.productId,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      priceGbp: Number(p.priceGbp),
      conditionGrade: p.conditionGrade,
      warrantyMonths: p.warrantyMonths,
      stockQty: p.inventory?.stockQty ?? 0,
      buildNumber: null, // TODO: derive once build-number lives on Product.
      builder: p.builder,
      specs: (catalog?.specs ?? {}) as Specs,
    };
  });
}
