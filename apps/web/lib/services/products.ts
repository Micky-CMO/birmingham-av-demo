import { prisma } from '@/lib/db';
import { connectMongo, ProductCatalog } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { ProductListQuery } from '@bav/lib/schemas';

/**
 * Category-specific stock photography fallback. Used when neither the
 * Postgres imageUrls array nor the Mongo catalog has an image. Ensures every
 * product card on the site shows a real photo rather than the icon placeholder.
 * All URLs verified to resolve from Unsplash CDN.
 */
const CATEGORY_DEFAULT_IMAGE: Record<string, string> = {
  'all-in-one-pc': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&q=82&auto=format&fit=crop',
  computers: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=82&auto=format&fit=crop',
  'gaming-pc-bundles': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=82&auto=format&fit=crop',
  laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=82&auto=format&fit=crop',
  monitors: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&q=82&auto=format&fit=crop',
  projectors: 'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=1200&q=82&auto=format&fit=crop',
  'projector-lenses': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=82&auto=format&fit=crop',
  printers: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1200&q=82&auto=format&fit=crop',
  'av-switches': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=82&auto=format&fit=crop',
  parts: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=1200&q=82&auto=format&fit=crop',
  'hard-drive': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&q=82&auto=format&fit=crop',
  'power-supply-chargers': 'https://images.unsplash.com/photo-1623040622440-6e27116ef8cb?w=1200&q=82&auto=format&fit=crop',
  'network-equipment': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=82&auto=format&fit=crop',
  other: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=82&auto=format&fit=crop',
};
const CATEGORY_DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=82&auto=format&fit=crop';

export function defaultImageFor(categorySlug: string | null | undefined): string {
  if (!categorySlug) return CATEGORY_DEFAULT_FALLBACK;
  return CATEGORY_DEFAULT_IMAGE[categorySlug] ?? CATEGORY_DEFAULT_FALLBACK;
}

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
  if (query.inStockOnly) where.inventory = { stockQty: { gt: 0 } };

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
      include: { inventory: true, category: { select: { slug: true } } },
    }),
  ]);

  // Mongo enrichment is optional (provides images + structured specs)
  const catalogById = new Map<string, CatalogLean>();
  try {
    const conn = await connectMongo();
    if (conn) {
      const catalogs = await ProductCatalog.find({
        postgresProductId: { $in: rows.map((r) => r.productId) },
      }).lean();
      for (const c of catalogs) catalogById.set(c.postgresProductId, c as unknown as CatalogLean);
    }
  } catch (err) {
    console.warn('[products] mongo lookup failed', (err as Error).message);
  }

  const items: ListedProduct[] = rows.map((p) => {
    const raw = catalogById.get(p.productId);
    const mongoImage = raw?.images?.find((i) => i.isPrimary)?.url ?? raw?.images?.[0]?.url ?? null;
    // Priority: Postgres primaryImageUrl -> Postgres imageUrls[0] -> Mongo catalog -> null.
    // No category default: a generic stock photo for every product in a category
    // is misleading (all laptops would show the same MacBook shot). When there's
    // no real image, ProductCard renders a product-specific placeholder inferred
    // from the title (tower / laptop / GPU / storage etc).
    const imageUrl = p.primaryImageUrl ?? p.imageUrls?.[0] ?? mongoImage ?? null;
    const cpu = raw?.specs?.cpu?.model ?? null;
    const gpu = raw?.specs?.gpu?.model ?? null;
    const ram = raw?.specs?.memory?.sizeGb ? `${raw.specs.memory.sizeGb}GB` : null;
    const stock = raw?.specs?.storage?.[0]?.capacityGb ? `${raw.specs.storage[0].capacityGb}GB` : null;
    const specLine = [cpu, gpu, ram, stock].filter(Boolean).join(' · ') || extractSpecsFromTitle(p.title);
    return {
      productId: p.productId,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      conditionGrade: p.conditionGrade,
      priceGbp: Number(p.priceGbp),
      compareAtGbp: p.compareAtGbp ? Number(p.compareAtGbp) : null,
      imageUrl,
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

  let catalog: unknown = null;
  try {
    const conn = await connectMongo();
    if (conn) {
      catalog = await ProductCatalog.findOne({ postgresProductId: product.productId }).lean();
    }
  } catch (err) {
    console.warn('[products] mongo lookup failed', (err as Error).message);
  }
  return { product, catalog };
}

/**
 * Best-effort spec extraction from a free-text title (e.g. eBay listing).
 * "GAMING PC CORE i9 14TH GEN / Nvidia RTX 5070 / 64GB RAM / 2TB SSD" →
 * "i9 · RTX 5070 · 64GB · 2TB SSD"
 */
export function extractSpecsFromTitle(title: string): string | null {
  const t = title;
  const cpu = t.match(/\b(i[3579]|core i[3579]|ryzen [3579]|m[1-4](?: pro| max| ultra)?|xeon|celeron)[\w-]*/i)?.[0];
  const gpu = t.match(/\b(rtx ?\d{3,4}(?:\s?ti)?|gtx ?\d{3,4}|rx ?\d{3,4}|radeon \w+|iris \w+)\b/i)?.[0];
  const ram = t.match(/\b(\d{1,3})\s*gb\s*(?:ram|ddr\d?)\b/i)?.[1];
  const ssd = t.match(/\b(\d+\s*(?:gb|tb))\s*(?:ssd|nvme|hdd|hard drive)/i)?.[1];
  const parts = [
    cpu ? cleanSpec(cpu) : null,
    gpu ? cleanSpec(gpu) : null,
    ram ? `${ram}GB` : null,
    ssd ? cleanSpec(ssd) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

function cleanSpec(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/^core\s+/i, '').trim();
}
