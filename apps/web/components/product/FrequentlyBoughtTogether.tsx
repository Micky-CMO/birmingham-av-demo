import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { defaultImageFor } from '@/lib/services/products';

type CoPurchaseRow = { product_id: string; co_count: bigint };

/**
 * Server component. Renders up to three products most frequently ordered
 * alongside the current product, based on OrderItem co-occurrence within
 * the same Order. Silent null if no co-purchase data yet.
 */
export async function FrequentlyBoughtTogether({
  productId,
  limit = 3,
}: {
  productId: string;
  limit?: number;
}) {
  const rows = await prisma.$queryRaw<CoPurchaseRow[]>`
    SELECT oi2.product_id, COUNT(*)::bigint AS co_count
    FROM order_items oi1
    JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
    WHERE oi1.product_id = ${productId}::uuid
    GROUP BY oi2.product_id
    ORDER BY co_count DESC
    LIMIT ${limit};
  `;

  if (rows.length === 0) return null;

  const relatedIds = rows.map((r) => r.product_id);
  const products = await prisma.product.findMany({
    where: { productId: { in: relatedIds }, isActive: true },
    include: {
      category: { select: { slug: true } },
      inventory: { select: { stockQty: true } },
    },
  });

  if (products.length === 0) return null;

  const ordered = relatedIds
    .map((id) => products.find((p) => p.productId === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="border-t border-ink-10">
      <div className="mx-auto max-w-page px-6 py-20 md:px-12 md:py-24">
        <div className="bav-label mb-10 text-ink-60">— Frequently bought together</div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {ordered.map((p) => {
            const img = p.primaryImageUrl ?? defaultImageFor(p.category?.slug);
            return (
              <Link
                key={p.productId}
                href={`/product/${p.slug}`}
                className="group block text-ink no-underline"
              >
                <div
                  className="bav-canvas relative mb-5 overflow-hidden"
                  style={{ aspectRatio: '4 / 3' }}
                >
                  {img && (
                    <Image
                      src={img}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                </div>
                <div className="bav-label mb-2 font-mono text-ink-60">
                  №{p.sku.split('-').pop()}
                </div>
                <div className="mb-1 font-display text-[20px] leading-[1.2] tracking-[-0.015em]">
                  {p.title}
                </div>
                {p.subtitle && (
                  <div className="mb-3 text-[14px] leading-[1.4] text-ink-60">
                    {p.subtitle}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[15px] text-ink">
                    £{Number(p.priceGbp).toLocaleString('en-GB')}
                  </span>
                  {p.inventory && p.inventory.stockQty > 0 && (
                    <span className="bav-label text-ink-30">
                      {p.inventory.stockQty} in stock
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
