import Image from 'next/image';
import Link from 'next/link';
import { PageHero } from '@/components/storefront/PageHero';
import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Our builders' };
export const dynamic = 'force-dynamic';

const TIER_DOT: Record<'probation' | 'standard' | 'preferred' | 'elite', string> = {
  probation: 'bg-tier-probation',
  standard: 'bg-tier-standard',
  preferred: 'bg-tier-preferred',
  elite: 'bg-tier-elite',
};

export default async function BuildersPage() {
  const builders = await prisma.builder.findMany({
    where: { status: 'active' },
    orderBy: [{ tier: 'desc' }, { qualityScore: 'desc' }],
    include: { warehouseNode: true },
  });

  const totals = {
    count: builders.length,
    units: builders.reduce((s, b) => s + b.totalUnitsBuilt, 0),
    avgQuality: builders.reduce((s, b) => s + Number(b.qualityScore), 0) / Math.max(1, builders.length),
  };

  return (
    <>
      <PageHero
        eyebrow="The bench"
        title="Twenty-two names on the door."
        lead={
          <p>
            Every Birmingham AV machine is hand-built by one of these twenty-two people, signed, and warrantied to them
            personally. No assembly lines. No anonymous contractors. Just engineers who own the work.
          </p>
        }
        right={
          <GlassCard className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-semibold">{totals.count}</div>
                <div className="font-mono text-caption text-ink-500">builders</div>
              </div>
              <div>
                <div className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-semibold">
                  {totals.units.toLocaleString('en-GB')}
                </div>
                <div className="font-mono text-caption text-ink-500">units built</div>
              </div>
              <div>
                <div className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-semibold text-brand-green">
                  {totals.avgQuality.toFixed(2)}
                </div>
                <div className="font-mono text-caption text-ink-500">avg quality</div>
              </div>
            </div>
          </GlassCard>
        }
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {builders.map((b) => (
            <Link key={b.builderId} href={`/builders/${b.builderCode}`}>
              <GlassCard className="group relative flex flex-col overflow-hidden p-6 transition-all duration-420 hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500">{b.builderCode}</span>
                  <span className="flex items-center gap-1.5 font-mono text-caption uppercase tracking-[0.15em] text-ink-500">
                    <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${TIER_DOT[b.tier as keyof typeof TIER_DOT]}`} />
                    {b.tier}
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-ink-100 dark:bg-obsidian-800">
                    {b.avatarUrl && <Image src={b.avatarUrl} alt={b.displayName} fill className="object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-h3 font-semibold">{b.displayName}</div>
                    <div className="truncate font-mono text-caption text-ink-500">{b.warehouseNode.nodeCode}</div>
                  </div>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-300/50 pt-4 font-mono text-caption dark:border-obsidian-500/40">
                  <div>
                    <dt className="text-ink-500">Builds</dt>
                    <dd className="mt-0.5 text-body font-medium tabular-nums">{b.totalUnitsBuilt.toLocaleString('en-GB')}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Quality</dt>
                    <dd className="mt-0.5 text-body font-medium tabular-nums text-brand-green">
                      {Number(b.qualityScore).toFixed(2)}
                    </dd>
                  </div>
                </dl>
                <span
                  aria-hidden
                  className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-brand-green transition-transform duration-420 ease-unfold group-hover:scale-x-100"
                />
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
