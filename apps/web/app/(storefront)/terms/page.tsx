import type { Metadata } from 'next';
import { PageHero } from '@/components/storefront/PageHero';

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'Terms of service for birmingham-av.com: ordering, pricing, warranty, returns, liability, and governing law for Birmingham AV Ltd. PC sales, new and refurbished.',
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of service"
        lead="These terms govern your use of birmingham-av.com. Last updated April 2026."
      />
      <article className="mx-auto max-w-3xl px-6 pb-24 text-body leading-relaxed text-ink-700 dark:text-ink-300">
        <Section n="1" title="Who we are">
          Birmingham AV Ltd. (company number 12383651), registered at 21b Buntsford Drive, Bromsgrove, B60 3AJ, England.
          Contact <a className="text-brand-green hover:underline" href="mailto:support@birmingham-av.com">support@birmingham-av.com</a>.
        </Section>
        <Section n="2" title="Your order">
          Prices are in GBP and include UK VAT where applicable. We may cancel and refund any order at our discretion,
          including for pricing errors. Title passes on delivery; risk passes when you receive the goods.
        </Section>
        <Section n="3" title="Warranty">
          Our 12-month warranty covers hardware faults arising from normal use. Physical damage, liquid damage, and
          third-party modifications are excluded. See our <a className="text-brand-green hover:underline" href="/warranty">warranty policy</a>.
        </Section>
        <Section n="4" title="Returns and refunds">
          You have 30 days from delivery to request a return under the UK Consumer Contracts Regulations. Faulty
          machines are covered outside that window by the warranty. Start a return from your account.
        </Section>
        <Section n="5" title="Liability">
          Our liability for any single order is capped at the value of that order. We are not liable for indirect or
          consequential loss.
        </Section>
        <Section n="6" title="Governing law">
          These terms are governed by the laws of England and Wales.
        </Section>
      </article>
    </>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0 border-t border-ink-300/50 pt-6 first:border-0 first:pt-0 dark:border-obsidian-500/40">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">{n}</span>
        <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
