import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ShopView, type CategoryOption, type BuilderOption } from '@/components/shop/ShopView';
import type { TileProduct } from '@/components/shop/ProductTile';
import { defaultImageFor } from '@/lib/services/products';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { buildCategoryTitle, buildCategoryDescription } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await prisma.productCategory.findUnique({ where: { slug: params.slug } });
  if (!category) {
    return {
      title: 'Category not found',
      description: 'This PC category is no longer available at Birmingham AV.',
    };
  }
  const count = await prisma.product.count({
    where: { isActive: true, categoryId: category.categoryId },
  });
  return {
    title: buildCategoryTitle({ slug: category.slug, name: category.name }, count),
    description: buildCategoryDescription({ slug: category.slug, name: category.name }, count),
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await prisma.productCategory.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const [rows, categoryRows, builderRows, ceilingRow] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, categoryId: category.categoryId },
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
    prisma.product.aggregate({
      _max: { priceGbp: true },
      where: { categoryId: category.categoryId },
    }),
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
          { name: category.name, url: `/shop/${params.slug}` },
        ]}
      />
      <ShopView
        products={products}
        categories={categories}
        builders={builders}
        priceCeiling={priceCeiling}
        defaultCategory={params.slug}
      />
    </>
  );
}
