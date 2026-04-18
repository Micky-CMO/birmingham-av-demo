'use client';

import { AnimatedNumber } from '@/components/fx/AnimatedNumber';
import { ScrollReveal } from '@/components/fx/ScrollReveal';

const STATS: Array<{ label: string; value: number; format?: (n: number) => string; accent?: boolean }> = [
  { label: 'Units sold on eBay', value: 82_000, format: (n) => `${Math.round(n / 1000)}K` },
  { label: 'Positive feedback', value: 98.4, format: (n) => `${n.toFixed(1)}%`, accent: true },
  { label: 'In-house builders', value: 22 },
  { label: 'Warranty months', value: 12 },
];

export function StatsRail() {
  return (
    <section className="border-y border-ink-300/50 bg-white/40 backdrop-blur-sm dark:border-obsidian-500/40 dark:bg-obsidian-900/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-ink-300/50 md:grid-cols-4 dark:bg-obsidian-500/40">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.08}>
            <div className="h-full bg-white/40 px-3 py-6 text-center backdrop-blur-sm sm:px-6 sm:py-10 md:py-14 dark:bg-obsidian-900/40">
              <div
                className={`font-display text-[clamp(1.65rem,8vw,3.75rem)] font-semibold leading-none tracking-[-0.02em] ${
                  s.accent ? 'text-brand-green' : ''
                }`}
              >
                <AnimatedNumber value={s.value} format={s.format} />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 sm:mt-3 sm:text-caption dark:text-ink-300">
                {s.label}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
