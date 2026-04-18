import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/storefront/PageHero';
import { GlassCard, Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Birmingham AV is a Bromsgrove refurbished-PC workshop: 22 in-house builders, seven-stage QC, and 82,000 units shipped since 2020.',
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Birmingham AV"
        title="Built on benches, not in warehouses."
        lead={
          <>
            <p>
              Birmingham AV began in 2020 from a workshop in Bromsgrove with one principle: every refurbished machine
              that leaves our door should be better than new. Six years and 82,000 units later, that principle still
              holds. Each PC is tested on a dedicated bench, signed by the builder, and warrantied for twelve months.
            </p>
          </>
        }
      />

      {/* Pillars */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-6 md:grid-cols-3">
        {[
          {
            k: '01',
            t: 'Traceable',
            d: 'Every unit carries a serial tied to a named builder. If anything goes wrong, we know exactly who to ring.',
          },
          {
            k: '02',
            t: 'Tested',
            d: 'Seven-stage QC: POST, burn-in, thermal, memtest, GPU stress, disk read-write, peripherals.',
          },
          {
            k: '03',
            t: 'Trusted',
            d: '98.4% positive over 82,000 transactions on eBay. Now on our own platform, finally.',
          },
        ].map((p) => (
          <GlassCard key={p.k} className="p-8">
            <div className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">{p.k}</div>
            <div className="mt-4 font-display text-h2 font-semibold tracking-[-0.02em]">{p.t}</div>
            <p className="mt-3 text-small text-ink-500 dark:text-ink-300">{p.d}</p>
          </GlassCard>
        ))}
      </section>

      {/* Numbers band */}
      <section className="mx-auto mt-20 grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-300/50 bg-ink-300/50 px-0 md:grid-cols-4 dark:border-obsidian-500/40 dark:bg-obsidian-500/30">
        {[
          ['82,000', 'units sold'],
          ['22', 'in-house builders'],
          ['3', 'warehouse nodes'],
          ['98.4%', 'positive feedback'],
        ].map(([v, k]) => (
          <div key={k} className="bg-ink-50 p-8 dark:bg-obsidian-950">
            <div className="font-display text-[clamp(2rem,3.2vw,2.75rem)] font-semibold leading-none tracking-[-0.02em]">
              {v}
            </div>
            <div className="mt-2 font-mono text-caption uppercase tracking-[0.2em] text-ink-500">{k}</div>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display text-h1 font-semibold tracking-[-0.025em]">Six years, one bench at a time.</h2>
        <ol className="mt-12 space-y-6">
          {[
            { year: '2020', title: 'Company incorporated', body: 'Opened Bromsgrove workshop with two builders.' },
            { year: '2022', title: '10,000 units shipped', body: 'Added second warehouse node and hired QC lead.' },
            { year: '2024', title: 'eBay Powerseller Elite', body: 'Featured store status, 98.4% positive feedback.' },
            { year: '2025', title: '£40M turnover year', body: 'Twenty-plus builders, three nodes, UK-wide next-day.' },
            { year: '2026', title: 'Launched birmingham-av.com', body: 'Bespoke platform off eBay. Bye, selling fees.' },
          ].map((e, i) => (
            <li key={e.year} className="grid grid-cols-[80px_1fr] gap-6 border-t border-ink-300/50 pt-6 dark:border-obsidian-500/40">
              <span className="font-mono text-caption uppercase tracking-[0.2em] text-brand-green">{e.year}</span>
              <div>
                <div className="font-display text-h3 font-semibold">{e.title}</div>
                <p className="mt-1 text-small text-ink-500 dark:text-ink-300">{e.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <GlassCard className="flex flex-col items-start gap-6 p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-h2 font-semibold tracking-[-0.02em]">Meet the people behind your PC.</h3>
            <p className="mt-2 text-small text-ink-500 dark:text-ink-300">Twenty-two builders, each with their own roster.</p>
          </div>
          <Link href="/builders"><Button size="lg">See the builders</Button></Link>
        </GlassCard>
      </section>
    </>
  );
}
