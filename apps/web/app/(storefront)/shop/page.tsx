import { ProductCard } from '@/components/storefront/ProductCard';
import { FilterPanel } from '@/components/storefront/FilterPanel';
import { listProducts } from '@/lib/services/products';
import { getFilterAggregates } from '@/lib/services/filters';
import { ProductListQuerySchema } from '@bav/lib/schemas';

export const metadata = { title: 'Shop' };
export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? '']),
  );
  const query = ProductListQuerySchema.parse(flat);
  const [{ items, total }, aggregates] = await Promise.all([listProducts(query), getFilterAggregates()]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Catalog</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
            All products
          </h1>
          <p className="mt-2 text-small text-ink-500">{total.toLocaleString('en-GB')} items</p>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <FilterPanel
          categories={aggregates.categories}
          cpuFamilies={aggregates.cpuFamilies}
          gpuFamilies={aggregates.gpuFamilies}
          ramSizes={aggregates.ramSizes}
          builders={aggregates.builders}
          priceCeiling={aggregates.priceCeiling}
        />

        <div>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-300 p-16 text-center text-ink-500 dark:border-obsidian-500">
              No products match these filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          )}

          {total > query.pageSize && (
            <Pagination total={total} query={query} />
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ total, query }: { total: number; query: { page: number; pageSize: number } }) {
  const pages = Math.ceil(total / query.pageSize);
  const make = (n: number) => `?page=${n}&pageSize=${query.pageSize}`;
  const prev = Math.max(1, query.page - 1);
  const next = Math.min(pages, query.page + 1);
  return (
    <div className="mt-10 flex items-center justify-between font-mono text-caption text-ink-500">
      <a href={make(prev)} className="rounded-md border border-ink-300/60 px-3 py-1.5 hover:border-brand-green dark:border-obsidian-500/60">
        ← Previous
      </a>
      <span>
        Page {query.page} of {pages}
      </span>
      <a href={make(next)} className="rounded-md border border-ink-300/60 px-3 py-1.5 hover:border-brand-green dark:border-obsidian-500/60">
        Next →
      </a>
    </div>
  );
}
