import { PageHero } from '@/components/storefront/PageHero';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" lead="What we collect, why, and how to control it." />
      <article className="mx-auto max-w-3xl space-y-10 px-6 pb-24 text-body leading-relaxed text-ink-700 dark:text-ink-300">
        <Block title="Data we collect">
          Name, email, phone, shipping address, order history, payment references (we never see your full card number;
          Stripe and PayPal handle those), and basic analytics (pages viewed, device, country).
        </Block>
        <Block title="Why we collect it">
          To fulfil orders, honour warranties, provide support, send transactional emails and optional order-status
          updates via Telegram, and to detect fraud.
        </Block>
        <Block title="How long we keep it">
          Order and warranty records: 7 years (HMRC requirement). Marketing preferences: until you unsubscribe. Support
          transcripts: 2 years, then archived.
        </Block>
        <Block title="Who we share it with">
          Stripe, PayPal, Resend (email), Neon (database), MongoDB Atlas (catalog), AWS (hosting), our courier partners,
          and HMRC on request. We never sell your data.
        </Block>
        <Block title="Your rights">
          You can request a copy, correction, or deletion of your data at any time. Email{' '}
          <a className="text-brand-green hover:underline" href="mailto:privacy@birmingham-av.com">privacy@birmingham-av.com</a>.
          We will respond within 30 days.
        </Block>
        <Block title="Cookies">
          We use essential cookies for the cart and session. Optional analytics cookies only load after consent. See our{' '}
          <a className="text-brand-green hover:underline" href="/cookies">cookie policy</a>.
        </Block>
      </article>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-3">{children}</p>
    </section>
  );
}
