import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { PageHero } from '@/components/storefront/PageHero';
import { ProductCard } from '@/components/storefront/ProductCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const b = await prisma.builder.findUnique({ where: { builderCode: params.code.toUpperCase() } });
  if (!b) {
    return {
      title: 'Builder not found',
      description: 'This Birmingham AV builder profile is no longer available.',
    };
  }
  const quality = Number(b.qualityScore).toFixed(2);
  return {
    title: `${b.displayName} · ${b.builderCode}`,
    description: `${b.displayName} (${b.builderCode}) is a ${b.tier} Birmingham AV PC builder with ${b.totalUnitsBuilt.toLocaleString('en-GB')} builds and a ${quality} quality score.`.slice(0, 159),
  };
}

export default async function BuilderProfile({ params }: { params: { code: string } }) {
  const b = await prisma.builder.findUnique({
    where: { builderCode: params.code.toUpperCase() },
    include: { warehouseNode: true },
  });
  if (!b) notFound();

  // Active catalogue listings for the "Current builds" grid.
  const products = await prisma.product.findMany({
    where: { builderId: b.builderId, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { inventory: true },
  });

  // Physical units this builder has assembled recently, joined through to the product.
  // We order by buildCompletedAt (falling back to createdAt for units still mid-assembly)
  // to show what the bench has actually shipped lately.
  const recentUnits = await prisma.unit.findMany({
    where: { builderId: b.builderId },
    orderBy: [{ buildCompletedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 8,
    include: { product: { include: { inventory: true } } },
  });

  // The signature block shows b.bio as a pull quote. If we also pass bio into
  // the hero lead we get an awkward duplicate. Put a generic lead in the hero
  // and let the signature section carry the personal bio text.
  const heroLead = b.bio
    ? `Tier ${b.tier}. Based at ${b.warehouseNode.nodeCode}. ${b.totalUnitsBuilt.toLocaleString('en-GB')} units built to date with a ${Number(b.qualityScore).toFixed(2)}/5 quality score.`
    : undefined;

  return (
    <>
      <PageHero
        eyebrow={`Builder · ${b.builderCode}`}
        title={b.displayName}
        lead={heroLead}
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

      {/* Builder signature — bio as a pull quote */}
      {b.bio && (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <GlassCard className="relative overflow-hidden p-10 md:p-14">
            <span
              aria-hidden
              className="absolute -left-2 -top-6 select-none font-display text-[8rem] leading-none text-brand-green/10 md:text-[10rem]"
            >
              &ldquo;
            </span>
            <p className="mb-3 font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Builder signature</p>
            <blockquote className="font-display text-[clamp(1.5rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
              {b.bio}
            </blockquote>
            <footer className="mt-6 flex items-center gap-3 font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
              <span aria-hidden className="h-px w-10 bg-brand-green" />
              <span>
                {b.displayName} · {b.builderCode}
              </span>
            </footer>
          </GlassCard>
        </section>
      )}

      {/* Current listings */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
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

      {/* Recent builds strip — real units shipped by this builder */}
      {recentUnits.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Off the bench</p>
              <h2 className="mt-2 font-display text-h2 font-semibold tracking-[-0.02em]">Recent builds</h2>
            </div>
            <p className="font-mono text-caption text-ink-500">
              Last {recentUnits.length} unit{recentUnits.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {recentUnits.map((u) => (
              <ProductCard
                key={u.unitId}
                product={{
                  productId: u.product.productId,
                  slug: u.product.slug,
                  title: u.product.title,
                  specLine: null,
                  conditionGrade: u.product.conditionGrade,
                  priceGbp: Number(u.product.priceGbp),
                  compareAtGbp: u.product.compareAtGbp ? Number(u.product.compareAtGbp) : null,
                  imageUrl: null,
                  inStock: (u.product.inventory?.stockQty ?? 0) > 0,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* How to book this specific builder */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-8">
          <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Book the chair</p>
          <h2 className="mt-2 font-display text-h2 font-semibold tracking-[-0.02em]">
            How to book {b.displayName}
          </h2>
          <p className="mt-2 max-w-2xl text-small text-ink-500">
            Pick this builder at checkout just like you pick your barber. Same name on the order, same name on the
            warranty card.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Add a build to your basket',
              body: (
                <>
                  Choose any PC from <Link href="/shop" className="text-brand-green hover:underline">the shop</Link>{' '}
                  or one of {b.displayName}&apos;s current builds above. If it&apos;s already listed under this
                  builder, you&apos;re set.
                </>
              ),
            },
            {
              n: '02',
              title: 'Request this builder at checkout',
              body: (
                <>
                  On the checkout page, open &ldquo;Builder preference&rdquo; and pick{' '}
                  <span className="font-mono text-ink-900 dark:text-ink-100">{b.builderCode}</span>. We&apos;ll route
                  your order into their queue and lock the serial number to their bench.
                </>
              ),
            },
            {
              n: '03',
              title: 'Track it from queue to QC',
              body: (
                <>
                  Watch the wait tick down in your dashboard. You&apos;ll get a photo when the build starts, QC
                  sign-off when it&apos;s boxed, and a dispatch ping the moment it leaves the warehouse.
                </>
              ),
            },
          ].map((step) => (
            <li key={step.n}>
              <GlassCard className="h-full p-6">
                <div className="font-display text-[clamp(2rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-brand-green">
                  {step.n}
                </div>
                <h3 className="mt-2 font-display text-h3 font-semibold">{step.title}</h3>
                <p className="mt-3 text-small leading-relaxed text-ink-700 dark:text-ink-300">{step.body}</p>
              </GlassCard>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
