import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { FilterPanel } from '@/components/storefront/FilterPanel';
import { listProducts } from '@/lib/services/products';
import { getFilterAggregates } from '@/lib/services/filters';
import { prisma } from '@/lib/db';
import { ProductListQuerySchema } from '@bav/lib/schemas';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await prisma.productCategory.findUnique({ where: { slug: params.slug } });
  if (!category) {
    return {
      title: 'Category not found',
      description: 'This refurbished PC category is no longer available at Birmingham AV.',
    };
  }
  return {
    title: category.name,
    description:
      `Shop refurbished ${category.name} from Birmingham AV: every unit tested on the bench, built by a named UK builder, and shipped with a 12-month warranty.`.slice(
        0,
        159,
      ),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = await prisma.productCategory.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? '']),
  );
  const query = ProductListQuerySchema.parse({ ...flat, category: params.slug });
  const [{ items, total }, aggregates] = await Promise.all([
    listProducts(query),
    getFilterAggregates(params.slug),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header>
        <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Category</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
          {category.name}
        </h1>
        <p className="mt-2 text-small text-ink-500">{total.toLocaleString('en-GB')} items</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <FilterPanel
          categories={aggregates.categories}
          conditions={aggregates.conditions}
          showCategoryFilter={false}
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
        </div>
      </div>
    </div>
  );
}
