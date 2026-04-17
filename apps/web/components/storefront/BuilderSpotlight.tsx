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
    <section className="mx-auto max-w-7xl px-6 py-16">
      <GlassCard className="flex flex-col gap-6 p-8 md:flex-row md:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-ink-100 dark:bg-obsidian-800">
          {builder.avatarUrl && (
            <Image src={builder.avatarUrl} alt={builder.displayName} fill className="object-cover" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-caption text-ink-500">Builder spotlight</span>
            <Badge tone={`tier-${builder.tier}` as 'tier-standard'}>{builder.tier}</Badge>
          </div>
          <h2 className="mt-1 text-h2 font-display">{builder.displayName}</h2>
          {builder.bio && <p className="mt-2 max-w-2xl text-small text-ink-500 dark:text-ink-300">{builder.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-6 font-mono text-small">
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
          className="self-start text-small font-medium text-brand-green hover:underline md:self-center"
        >
          View profile &rarr;
        </Link>
      </GlassCard>
    </section>
  );
}
