import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { listProducts } from '@/lib/services/products';
import { prisma } from '@/lib/db';
import { ProductListQuerySchema } from '@bav/lib/schemas';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = await prisma.productCategory.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const query = ProductListQuerySchema.parse({
    ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => typeof v === 'string')),
    category: params.slug,
  });
  const { items, total } = await listProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header>
        <p className="text-caption text-ink-500">Category</p>
        <h1 className="mt-2 text-h1 font-display">{category.name}</h1>
        <p className="mt-2 text-small text-ink-500">{total.toLocaleString('en-GB')} items</p>
      </header>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.productId} product={p} />
        ))}
      </div>
    </div>
  );
}
