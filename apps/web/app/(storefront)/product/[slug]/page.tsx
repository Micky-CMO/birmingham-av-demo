import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, Button, GlassCard } from '@/components/ui';
import { getProductBySlug } from '@/lib/services/products';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

type Catalog = {
  images?: Array<{ url: string; alt: string; isPrimary?: boolean }>;
  specs?: Record<string, unknown>;
};

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();
  const { product } = data;
  const catalog = data.catalog as Catalog | null;

  const images = catalog?.images ?? [];
  const primary = images.find((i) => i.isPrimary) ?? images[0];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <nav className="mb-6 flex items-center gap-2 text-caption text-ink-500">
        <Link href="/shop" className="hover:text-ink-900 dark:hover:text-ink-50">
          Shop
        </Link>
        <span>/</span>
        <Link href={`/shop/${product.category.slug}`} className="hover:text-ink-900 dark:hover:text-ink-50">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-ink-900 dark:text-ink-300">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <GlassCard className="relative aspect-[4/3] overflow-hidden">
            {primary && (
              <Image src={primary.url} alt={primary.alt} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" />
            )}
          </GlassCard>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {images.slice(0, 5).map((img) => (
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
            {(product.inventory?.stockQty ?? 0) > 0 ? (
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
              <span className="text-ink-500 line-through">{formatGbp(Number(product.compareAtGbp))}</span>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Button size="lg">Add to cart</Button>
            <Button size="lg" variant="outline">
              Add to wishlist
            </Button>
          </div>

          <GlassCard className="mt-8 p-6">
            <div className="text-caption text-ink-500">Built by</div>
            <div className="mt-1 flex items-center justify-between">
              <Link href={`/builders/${product.builder.builderCode}`} className="text-body font-medium hover:text-brand-green">
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

      {catalog?.specs && (
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
                    <th className="w-1/3 bg-ink-50 px-4 py-3 text-left text-ink-500 dark:bg-obsidian-800">{row.k}</th>
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
