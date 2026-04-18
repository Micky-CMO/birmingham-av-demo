import Image from 'next/image';
import Link from 'next/link';
import { Badge, GlassCard } from '@/components/ui';

export type SpotlightBuilder = {
  builderCode: string;
  displayName: string;
  avatarUrl: string | null;
  tier: 'probation' | 'standard' | 'preferred' | 'elite';
  totalUnitsBuilt: number;
  qualityScore: number;
  bio: string | null;
};

export function BuilderSpotlight({ builder }: { builder: SpotlightBuilder }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <GlassCard className="flex flex-col gap-4 p-5 sm:gap-6 sm:p-8 md:flex-row md:items-center">
        <div className="flex items-center gap-4 md:contents">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-ink-100 sm:h-24 sm:w-24 dark:bg-obsidian-800">
            {builder.avatarUrl && (
              <Image src={builder.avatarUrl} alt={builder.displayName} fill className="object-cover" />
            )}
          </div>
          <div className="flex-1 md:hidden">
            <div className="flex items-center gap-2">
              <span className="text-caption text-ink-500">Spotlight</span>
              <Badge tone={`tier-${builder.tier}` as 'tier-standard'}>{builder.tier}</Badge>
            </div>
            <h2 className="mt-0.5 font-display text-xl font-semibold tracking-[-0.015em]">{builder.displayName}</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-caption text-ink-500">Builder spotlight</span>
            <Badge tone={`tier-${builder.tier}` as 'tier-standard'}>{builder.tier}</Badge>
          </div>
          <h2 className="mt-1 hidden text-h2 font-display md:block">{builder.displayName}</h2>
          {builder.bio && (
            <p className="mt-1 max-w-2xl text-small text-ink-500 sm:mt-2 dark:text-ink-300">{builder.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-small sm:mt-4 sm:gap-6">
            <div>
              <span className="text-ink-500">Builds</span> {builder.totalUnitsBuilt.toLocaleString('en-GB')}
            </div>
            <div>
              <span className="text-ink-500">Quality</span> {builder.qualityScore.toFixed(2)} / 5
            </div>
            <div>
              <span className="text-ink-500">Code</span> {builder.builderCode}
            </div>
          </div>
        </div>
        <Link
          href={`/builders/${builder.builderCode}`}
          className="inline-flex min-h-11 items-center self-start text-small font-medium text-brand-green hover:underline md:self-center"
        >
          View profile &rarr;
        </Link>
      </GlassCard>
    </section>
  );
}
