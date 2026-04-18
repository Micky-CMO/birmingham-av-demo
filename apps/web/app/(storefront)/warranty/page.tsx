import Link from 'next/link';
import { PageHero } from '@/components/storefront/PageHero';
import { Button, GlassCard } from '@/components/ui';

export const metadata = { title: 'Warranty' };

export default function WarrantyPage() {
  return (
    <>
      <PageHero
        eyebrow="Warranty"
        title="Twelve months of parts and labour. No small print."
        lead="Every Birmingham AV machine ships with a 12-month return-to-base warranty. Extend to 24 months at checkout for a flat £29."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { k: 'What is covered', b: 'Hardware faults arising from normal use, assembly defects, DOA, thermal failure, PSU, motherboard, storage, memory, GPU.' },
            { k: 'What is not', b: 'Liquid damage, physical damage, overclocking beyond factory settings, third-party hardware modifications, software issues unrelated to the OS image we shipped.' },
            { k: 'How it works', b: 'Open a return from your account. We arrange courier collection, diagnose inside 48 hours, repair or replace, courier back. Usually 5 working days end-to-end.' },
          ].map((x) => (
            <GlassCard key={x.k} className="p-8">
              <h3 className="font-display text-h3 font-semibold">{x.k}</h3>
              <p className="mt-3 text-small text-ink-500 dark:text-ink-300">{x.b}</p>
            </GlassCard>
          ))}
        </div>
        <GlassCard className="mt-8 flex flex-col items-start gap-6 p-10 md:flex-row md:items-center md:justify-between">
          <p className="text-body text-ink-700 dark:text-ink-300">Need to start a claim?</p>
          <Link href="/returns/new"><Button size="lg">Start a return</Button></Link>
        </GlassCard>
      </section>
    </>
  );
}
