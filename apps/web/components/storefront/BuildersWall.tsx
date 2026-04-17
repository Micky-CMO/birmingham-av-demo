import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/fx/ScrollReveal';

/**
 * Dense grid of all 22 builders. Demonstrates the "20+ in-house builders"
 * promise with faces (dicebear seeds) and tier dots.
 */
export type WallBuilder = {
  builderCode: string;
  displayName: string;
  avatarUrl: string | null;
  tier: 'probation' | 'standard' | 'preferred' | 'elite';
  unitsBuilt: number;
};

const TIER_DOT: Record<WallBuilder['tier'], string> = {
  probation: 'bg-tier-probation',
  standard: 'bg-tier-standard',
  preferred: 'bg-tier-preferred',
  elite: 'bg-tier-elite',
};

export function BuildersWall({ builders }: { builders: WallBuilder[] }) {
  if (builders.length === 0) return null;
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-caption uppercase tracking-widest text-ink-500">The bench</p>
            <h2 className="mt-2 max-w-2xl font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
              Twenty-two builders. <span className="text-brand-green">Every machine signed.</span>
            </h2>
          </div>
          <Link href="/builders" className="hidden text-small font-medium text-brand-green hover:underline md:inline">
            Meet the team &rarr;
          </Link>
        </div>
      </ScrollReveal>

      <ul className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {builders.map((b, i) => (
          <ScrollReveal key={b.builderCode} delay={i * 0.025}>
            <li className="group relative aspect-square overflow-hidden rounded-md border border-ink-300/60 bg-white/60 backdrop-blur-sm transition-all duration-420 hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-lift dark:border-obsidian-500/60 dark:bg-obsidian-900/60">
              {b.avatarUrl && (
                <Image
                  src={b.avatarUrl}
                  alt={b.displayName}
                  fill
                  sizes="(max-width: 768px) 25vw, 9vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <span aria-hidden className={`absolute right-2 top-2 block h-1.5 w-1.5 rounded-full ${TIER_DOT[b.tier]}`} />
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-ink-900/80 px-2 py-1.5 text-[10px] font-medium text-white backdrop-blur-md transition-transform duration-420 group-hover:translate-y-0">
                <div className="truncate">{b.displayName}</div>
                <div className="font-mono text-[9px] text-ink-300">{b.builderCode}</div>
              </div>
            </li>
          </ScrollReveal>
        ))}
      </ul>
    </section>
  );
}
