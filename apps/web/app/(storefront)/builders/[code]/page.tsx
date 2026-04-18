import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { PageHero } from '@/components/storefront/PageHero';
import { ProductCard } from '@/components/storefront/ProductCard';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export default async function BuilderProfile({ params }: { params: { code: string } }) {
  const b = await prisma.builder.findUnique({
    where: { builderCode: params.code.toUpperCase() },
    include: { warehouseNode: true },
  });
  if (!b) notFound();

  const products = await prisma.product.findMany({
    where: { builderId: b.builderId, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { inventory: true },
  });

  return (
    <>
      <PageHero
        eyebrow={`Builder · ${b.builderCode}`}
        title={b.displayName}
        lead={b.bio ?? undefined}
        right={
          <GlassCard className="p-6">
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-ink-100 dark:bg-obsidian-800">
              {b.avatarUrl && <Image src={b.avatarUrl} alt={b.displayName} fill className="object-cover" />}
            </div>
            <div className="mt-4 flex justify-center">
              <Badge tone={`tier-${b.tier}` as 'tier-preferred'}>{b.tier}</Badge>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-center font-mono text-caption">
              <div>
                <dt className="text-ink-500">Built</dt>
                <dd className="mt-0.5 text-body font-medium tabular-nums">
                  {b.totalUnitsBuilt.toLocaleString('en-GB')}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">Sold</dt>
                <dd className="mt-0.5 text-body font-medium tabular-nums">
                  {b.totalUnitsSold.toLocaleString('en-GB')}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">Quality</dt>
                <dd className="mt-0.5 text-body font-medium tabular-nums text-brand-green">
                  {Number(b.qualityScore).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">RMA 90d</dt>
                <dd className="mt-0.5 text-body font-medium tabular-nums">
                  {(Number(b.rmaRateRolling90d) * 100).toFixed(2)}%
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-center font-mono text-caption text-ink-500">{b.warehouseNode.nodeCode}</p>
          </GlassCard>
        }
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Current builds</h2>
          <Link href="/shop" className="text-small font-medium text-brand-green hover:underline">
            All products &rarr;
          </Link>
        </div>
        {products.length === 0 ? (
          <GlassCard className="p-10 text-center text-small text-ink-500">
            This builder has no active listings right now.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.productId}
                product={{
                  productId: p.productId,
                  slug: p.slug,
                  title: p.title,
                  specLine: null,
                  conditionGrade: p.conditionGrade,
                  priceGbp: Number(p.priceGbp),
                  compareAtGbp: p.compareAtGbp ? Number(p.compareAtGbp) : null,
                  imageUrl: null,
                  inStock: (p.inventory?.stockQty ?? 0) > 0,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
