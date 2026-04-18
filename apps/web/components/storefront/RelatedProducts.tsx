import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { listProducts } from '@/lib/services/products';
import { ProductListQuerySchema } from '@bav/lib/schemas';

/**
 * Server component that fetches up to 8 related products from the same
 * category, excluding the current product. Reuses ProductCard for consistency.
 */
export async function RelatedProducts({
  categorySlug,
  excludeId,
  builderCode,
}: {
  categorySlug: string;
  excludeId: string;
  builderCode?: string;
}) {
  const query = ProductListQuerySchema.parse({
    category: categorySlug,
    pageSize: 9,
    sort: 'bestseller',
  });
  const { items } = await listProducts(query);
  const filtered = items.filter((i) => i.productId !== excludeId).slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">You may also like</p>
          <h2 className="mt-2 font-display text-h2 font-semibold tracking-[-0.02em]">
            More in {prettyCategory(categorySlug)}
          </h2>
        </div>
        <Link href={`/shop/${categorySlug}`} className="text-small font-medium text-brand-green hover:underline">
          See all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.productId} product={p} />
        ))}
      </div>
      {builderCode && (
        <p className="mt-6 font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
          Also from{' '}
          <Link href={`/builders/${builderCode}`} className="text-brand-green hover:underline">
            {builderCode}
          </Link>
        </p>
      )}
    </section>
  );
}

function prettyCategory(slug: string): string {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}
