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
const TIER_LABEL: Record<'probation' | 'standard' | 'preferred' | 'elite', string> = {
  probation: 'Probation',
  standard: 'Standard',
  preferred: 'Preferred',
  elite: 'Elite',
};

export default async function BuildersPage() {
  const builders = await prisma.builder.findMany({
    where: { status: 'active' },
    orderBy: [{ tier: 'desc' }, { qualityScore: 'desc' }],
    include: {
      warehouseNode: true,
      _count: { select: { buildQueues: { where: { status: { in: ['queued', 'in_progress'] } } } } },
    },
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
        title="Pick the builder who builds your PC."
        lead={
          <p>
            Like choosing your barber: every builder has a roster, a reputation, and a wait time. Go with an Elite
            builder and wait a few more days. Go with a rising Standard and ship faster. Either way, the name on the
            warranty is the name on your order.
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
                <div className="font-mono text-caption text-ink-500">avg rating</div>
              </div>
            </div>
          </GlassCard>
        }
      />

      {/* Tier legend */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="flex flex-wrap items-center gap-4 font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
          <span>Tier legend:</span>
          {(['probation', 'standard', 'preferred', 'elite'] as const).map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${TIER_DOT[t]}`} />
              {TIER_LABEL[t]}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {builders.map((b) => {
            const queueDepth = b._count.buildQueues;
            const waitDays = queueDepth === 0 ? 0 : Math.max(1, Math.ceil((queueDepth * b.avgBuildMinutes) / (60 * 7)));
            return (
              <Link key={b.builderId} href={`/builders/${b.builderCode}`}>
                <GlassCard className="group relative flex flex-col overflow-hidden p-6 transition-all duration-420 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
                      {b.builderCode}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-caption uppercase tracking-[0.15em] text-ink-500">
                      <span
                        aria-hidden
                        className={`inline-block h-1.5 w-1.5 rounded-full ${TIER_DOT[b.tier as keyof typeof TIER_DOT]}`}
                      />
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

                  {/* Star rating visual */}
                  <div className="mt-4 flex items-center gap-1">
                    <StarRating score={Number(b.qualityScore)} />
                    <span className="ml-1 font-mono text-caption text-ink-500">
                      {Number(b.qualityScore).toFixed(2)}
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-ink-300/50 pt-4 font-mono text-caption dark:border-obsidian-500/40">
                    <div>
                      <dt className="text-ink-500">Builds</dt>
                      <dd className="mt-0.5 tabular-nums">{b.totalUnitsBuilt.toLocaleString('en-GB')}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-500">RMA</dt>
                      <dd
                        className={`mt-0.5 tabular-nums ${Number(b.rmaRateRolling90d) > 0.04 ? 'text-semantic-critical' : 'text-brand-green'}`}
                      >
                        {(Number(b.rmaRateRolling90d) * 100).toFixed(1)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-500">Queue</dt>
                      <dd className="mt-0.5 tabular-nums">{queueDepth}</dd>
                    </div>
                  </dl>

                  {/* Barber-shop wait indicator */}
                  <div className="mt-4 flex items-center justify-between rounded-md bg-ink-100/60 px-3 py-2 dark:bg-obsidian-800/60">
                    <span className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500">Wait</span>
                    <span
                      className={`font-display text-small font-semibold ${
                        waitDays === 0 ? 'text-brand-green' : waitDays > 5 ? 'text-semantic-warning' : ''
                      }`}
                    >
                      {waitDays === 0 ? 'Available now' : `${waitDays} day${waitDays === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  <span
                    aria-hidden
                    className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-brand-green transition-transform duration-420 ease-unfold group-hover:scale-x-100"
                  />
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${score.toFixed(2)} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = score >= s - 0.25;
        const half = !filled && score >= s - 0.75;
        return (
          <svg key={s} width="12" height="12" viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`star-g-${s}`}>
                <stop offset="50%" stopColor="#1EB53A" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2 L14.9 8.6 L22 9.3 L16.5 14.1 L18.2 21 L12 17.3 L5.8 21 L7.5 14.1 L2 9.3 L9.1 8.6 Z"
              fill={filled ? '#1EB53A' : half ? `url(#star-g-${s})` : '#D4D4D8'}
              stroke={filled ? '#1EB53A' : '#D4D4D8'}
            />
          </svg>
        );
      })}
    </div>
  );
}
