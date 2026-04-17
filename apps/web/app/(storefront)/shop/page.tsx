import { Suspense } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Skeleton } from '@/components/ui';
import { listProducts } from '@/lib/services/products';
import { ProductListQuerySchema } from '@bav/lib/schemas';

export const metadata = { title: 'Shop' };
export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = ProductListQuerySchema.parse(
    Object.fromEntries(Object.entries(searchParams).filter(([, v]) => typeof v === 'string')),
  );
  const { items, total } = await listProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 font-display">All products</h1>
          <p className="mt-2 text-small text-ink-500">{total.toLocaleString('en-GB')} items</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="mt-20 rounded-lg border border-dashed border-ink-300 p-16 text-center text-ink-500 dark:border-obsidian-500">
          No products yet. Run{' '}
          <code className="font-mono text-brand-green">pnpm ingest:ebay</code> to pull from eBay.
        </div>
      ) : (
        <Suspense fallback={<GridSkeleton />}>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        </Suspense>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4]" />
      ))}
    </div>
  );
}
