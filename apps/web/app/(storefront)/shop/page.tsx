import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { ShopView, type CategoryOption, type BuilderOption } from '@/components/shop/ShopView';
import type { TileProduct } from '@/components/shop/ProductTile';
import { defaultImageFor } from '@/lib/services/products';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { buildShopTitle, buildShopDescription } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const count = await prisma.product.count({ where: { isActive: true } }).catch(() => undefined);
  return {
    title: buildShopTitle(count),
    description: buildShopDescription(count),
  };
}

export default async function ShopPage() {
  const [rows, categoryRows, builderRows, ceilingRow] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventory: { select: { stockQty: true } },
        category: { select: { slug: true } },
        builder: { select: { builderCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.builder.findMany({
      where: { status: 'active' },
      select: { builderCode: true, displayName: true, tier: true },
      orderBy: { displayName: 'asc' },
    }),
    prisma.product.aggregate({ _max: { priceGbp: true } }),
  ]);

  const products: TileProduct[] = rows.map((p) => ({
    productId: p.productId,
    sku: p.sku,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? null,
    priceGbp: Number(p.priceGbp),
    compareAtGbp: p.compareAtGbp ? Number(p.compareAtGbp) : null,
    conditionGrade: p.conditionGrade,
    warrantyMonths: p.warrantyMonths ?? 12,
    isFeatured: Boolean(p.isFeatured),
    stockQty: p.inventory?.stockQty ?? 0,
    imageUrl: p.primaryImageUrl ?? defaultImageFor(p.category?.slug),
    categorySlug: p.category?.slug ?? 'other',
    builderCode: p.builder?.builderCode ?? '',
  }));

  const categories: CategoryOption[] = categoryRows.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: c._count.products,
  }));

  const builders: BuilderOption[] = builderRows.map((b) => ({
    builderCode: b.builderCode,
    displayName: b.displayName,
    tier: b.tier,
  }));

  const priceCeiling = Math.ceil(Number(ceilingRow._max.priceGbp ?? 5000) / 100) * 100;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
        ]}
      />
      <ShopView
        products={products}
        categories={categories}
        builders={builders}
        priceCeiling={priceCeiling}
      />
    </>
  );
}
