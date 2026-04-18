import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/storefront/PageHero';
import { GlassCard, Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Help centre',
  description:
    'Birmingham AV help centre: answers on PC delivery, returns, warranty, upgrades, payment methods, and builder assignment for new and refurbished kit.',
};

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'UK mainland orders placed before 3pm ship same day for next-working-day delivery. Highlands + Islands typically 2 working days.',
  },
  {
    q: 'Are your PCs new or refurbished?',
    a: 'Both. We sell brand-new machines alongside professionally refurbished ones, bench-tested and priced well below new. Every unit ships with a 12-month warranty and a clearly labelled condition grade, from Brand New through Like New to Good.',
  },
  {
    q: 'What if my PC arrives faulty?',
    a: 'Start a return from your account within 30 days for a full refund, or raise a warranty claim at any point in the 12-month cover. We courier both ways on warranty claims.',
  },
  {
    q: 'Can I upgrade the spec after purchase?',
    a: 'Yes. Contact support with your order number and we will quote the upgrade + fitting fee. Most upgrades are turned around in 3 working days.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We ship to the EU and select international destinations. Shipping is quoted at checkout based on weight and destination.',
  },
  {
    q: 'Can I visit in person?',
    a: 'We are primarily mail-order, but local collection from Bromsgrove can be arranged for orders over £500. Contact support to arrange.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Card (via Stripe), PayPal, and Klarna for orders over £100. All payments are encrypted and we never see your full card number.',
  },
  {
    q: 'Who is my builder?',
    a: 'After your order ships, your account shows the builder assigned. You can also message them directly through your order page for spec questions.',
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help centre"
        title="The answers you came for."
        lead="Most questions are answered below. If yours is not, start a chat bottom-right or raise a ticket."
      />
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-lg border border-ink-300/60 bg-white/60 p-6 backdrop-blur-sm transition-colors hover:border-brand-green/40 open:border-brand-green/40 dark:border-obsidian-500/60 dark:bg-obsidian-900/60"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-6 font-display text-h3 font-semibold tracking-[-0.015em]">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="mt-1 text-ink-500 transition-transform duration-420 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-body text-ink-700 dark:text-ink-300">{f.a}</p>
            </details>
          ))}
        </div>

        <GlassCard className="mt-10 flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-h3 font-semibold tracking-[-0.02em]">Still stuck?</h3>
            <p className="mt-1 text-small text-ink-500 dark:text-ink-300">Start a chat with the team bottom-right.</p>
          </div>
          <Link href="/contact"><Button>Contact the team</Button></Link>
        </GlassCard>
      </section>
    </>
  );
}
