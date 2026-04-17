import { prisma } from '@/lib/db';
import { connectMongo, ProductCatalog } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { ProductListQuery } from '@bav/lib/schemas';

type CatalogLean = {
  postgresProductId: string;
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  specs?: {
    cpu?: { model?: string; family?: string };
    gpu?: { model?: string };
    memory?: { sizeGb?: number };
    storage?: Array<{ capacityGb?: number }>;
  };
};

export type ListedProduct = {
  productId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  conditionGrade: string;
  priceGbp: number;
  compareAtGbp: number | null;
  imageUrl: string | null;
  specLine: string | null;
  inStock: boolean;
};

export async function listProducts(query: ProductListQuery): Promise<{
  items: ListedProduct[];
  total: number;
}> {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (query.category) where.category = { slug: query.category };
  if (query.minPrice !== undefined) where.priceGbp = { ...(where.priceGbp as object), gte: query.minPrice };
  if (query.maxPrice !== undefined) where.priceGbp = { ...(where.priceGbp as object), lte: query.maxPrice };
  if (query.condition) where.conditionGrade = query.condition;
  if (query.builderCode) where.builder = { builderCode: query.builderCode };
  if (query.q) where.title = { contains: query.q, mode: 'insensitive' };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === 'price_asc'
      ? { priceGbp: 'asc' }
      : query.sort === 'price_desc'
        ? { priceGbp: 'desc' }
        : query.sort === 'newest'
          ? { createdAt: 'desc' }
          : query.sort === 'bestseller'
            ? { isFeatured: 'desc' }
            : { createdAt: 'desc' };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { inventory: true },
    }),
  ]);

  await connectMongo();
  const catalogs = await ProductCatalog.find({ postgresProductId: { $in: rows.map((r) => r.productId) } }).lean();
  const catalogById = new Map(catalogs.map((c) => [c.postgresProductId, c]));

  const items: ListedProduct[] = rows.map((p) => {
    const raw = catalogById.get(p.productId) as CatalogLean | undefined;
    const image = raw?.images?.find((i) => i.isPrimary) ?? raw?.images?.[0];
    const cpu = raw?.specs?.cpu?.model ?? null;
    const gpu = raw?.specs?.gpu?.model ?? null;
    const ram = raw?.specs?.memory?.sizeGb ? `${raw.specs.memory.sizeGb}GB` : null;
    const stock = raw?.specs?.storage?.[0]?.capacityGb ? `${raw.specs.storage[0].capacityGb}GB` : null;
    const specLine = [cpu, gpu, ram, stock].filter(Boolean).join(' · ') || null;
    return {
      productId: p.productId,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      conditionGrade: p.conditionGrade,
      priceGbp: Number(p.priceGbp),
      compareAtGbp: p.compareAtGbp ? Number(p.compareAtGbp) : null,
      imageUrl: image?.url ?? null,
      specLine,
      inStock: (p.inventory?.stockQty ?? 0) > 0,
    };
  });

  return { items, total };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      builder: true,
      category: true,
      inventory: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { firstName: true } } } },
    },
  });
  if (!product) return null;

  await connectMongo();
  const catalog = await ProductCatalog.findOne({ postgresProductId: product.productId }).lean();
  return { product, catalog };
}
