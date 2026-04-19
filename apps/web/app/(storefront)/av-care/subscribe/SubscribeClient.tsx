'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TierCard } from '@/components/avcare/TierCard';

type CoveredProduct = {
  productId: string;
  title: string;
  buildNumber: string | null;
  purchasedAt: string | null;
};

export type SubscribeClientProps = {
  coveredProducts: CoveredProduct[];
};

const ESSENTIAL_FEATURES = [
  { label: 'Parts and labour on any registered product' },
  { label: 'In-workshop repair at our Birmingham facility' },
  { label: 'Standard turnaround, typically 7 to 10 working days' },
  { label: '£100 excess per claim' },
  { label: 'Cancel any time' },
];

const PLUS_FEATURES = [
  { label: 'Everything in Essential' },
  { label: 'Courier collection and return' },
  { label: 'Priority turnaround, typically 3 to 5 working days' },
  { label: 'Single loan unit during the repair' },
  { label: '£100 excess per claim' },
  { label: 'Cancel any time' },
];

const TIER_PRICE: Record<'essential' | 'plus', number> = {
  essential: 14.99,
  plus: 29.99,
};

export function SubscribeClient({ coveredProducts }: SubscribeClientProps) {
  const params = useSearchParams();
  const router = useRouter();
  const landingPlan = params.get('plan') === 'plus' ? 'plus' : 'essential';
  const [selected, setSelected] = useState<'essential' | 'plus'>(landingPlan);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(() => TIER_PRICE[selected], [selected]);

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/avcare/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tier: selected }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { checkoutUrl?: string | null; error?: { message?: string } }
        | null;

      if (res.ok && payload?.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      if (res.status === 501) {
        setError('Checkout is coming soon. We will email you when it is live.');
        setSubmitting(false);
        return;
      }

      throw new Error(payload?.error?.message ?? 'Something went wrong');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="mx-auto bav-fade"
        style={{ maxWidth: 1440, padding: '96px 48px 40px' }}
      >
        <nav className="flex items-center" style={{ gap: 12, marginBottom: 32 }}>
          <Link
            href="/av-care"
            className="bav-hover-opa bav-label"
            style={{ color: 'var(--ink-60)', textDecoration: 'none' }}
          >
            — AV Care
          </Link>
          <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
            /
          </span>
          <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
            Subscribe
          </span>
        </nav>
        <h1
          className="font-display m-0"
          style={{
            fontWeight: 300,
            fontSize: 'clamp(48px, 6.5vw, 88px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            maxWidth: '16ch',
          }}
        >
          Pick a plan. <span className="bav-italic">Start</span> the trial.
        </h1>
        <p
          className="m-0"
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: 'var(--ink-60)',
            marginTop: 32,
            maxWidth: '54ch',
          }}
        >
          One subscription covers every Birmingham AV product registered to this account, including
          anything you buy later. First 30 days free. Then £{price.toFixed(2)} a month. Cancel any
          time.
        </p>
      </div>

      <div className="bav-sub-layout">
        <section>
          <div className="bav-sub-tiergrid">
            <TierCard
              tier="essential"
              priceGbp={14.99}
              blurb="Parts and labour across every product on your account. Repaired in our Birmingham workshop, standard turnaround."
              features={ESSENTIAL_FEATURES}
              ctaLabel={selected === 'essential' ? 'Selected · Essential' : 'Choose Essential'}
              ctaVariant={selected === 'essential' ? 'primary' : 'secondary'}
              onCtaClick={() => setSelected('essential')}
            />
            <TierCard
              tier="plus"
              priceGbp={29.99}
              blurb="Everything in Essential, with courier collection, priority turnaround, and a loan unit while yours is with us."
              features={PLUS_FEATURES}
              ctaLabel={selected === 'plus' ? 'Selected · Plus' : 'Choose Plus'}
              ctaVariant={selected === 'plus' ? 'primary' : 'secondary'}
              onCtaClick={() => setSelected('plus')}
            />
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ marginTop: 48, gap: 32 }}
          >
            <FinePrint
              label="Trial"
              body="30 days free. We take payment details now, nothing is charged until the trial ends."
            />
            <FinePrint
              label="Excess"
              body="£100 per claim. Taken when the claim is accepted, before the machine moves."
            />
            <FinePrint
              label="Cancelling"
              body="One tap from your account. Runs to the end of the month you paid for. No exit fee."
            />
          </div>
        </section>

        <aside className="bav-sub-summary">
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Your coverage
            </span>
            <div
              className="font-display"
              style={{
                fontSize: 40,
                fontWeight: 300,
                lineHeight: 1,
                marginTop: 16,
                letterSpacing: '-0.02em',
              }}
            >
              <span className="bav-italic">{coveredProducts.length}</span>{' '}
              {coveredProducts.length === 1 ? 'product' : 'products'}
            </div>
            <p
              className="m-0"
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--ink-60)',
                marginTop: 10,
              }}
            >
              Every product registered to this account, plus anything you buy while the subscription
              is active.
            </p>
          </div>

          {coveredProducts.length > 0 && (
            <div
              className="border border-ink-10"
              style={{ maxHeight: 280, overflowY: 'auto' }}
            >
              {coveredProducts.map((p, i) => (
                <div
                  key={p.productId}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: '56px 1fr auto',
                    gap: 16,
                    padding: '14px 16px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
                  }}
                >
                  <div
                    className="bav-canvas grid place-items-center"
                    style={{ width: 56, height: 56 }}
                  >
                    <div
                      className="font-display"
                      style={{
                        fontSize: 20,
                        fontWeight: 300,
                        color: 'var(--ink)',
                        lineHeight: 1,
                      }}
                    >
                      <span
                        className="bav-italic"
                        style={{ fontSize: '0.7em', color: 'var(--ink-30)', marginRight: 1 }}
                      >
                        №
                      </span>
                      <span className="bav-italic">{p.buildNumber ?? '—'}</span>
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="overflow-hidden"
                      style={{
                        fontSize: 13,
                        color: 'var(--ink)',
                        fontWeight: 500,
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </div>
                    {p.purchasedAt && (
                      <div
                        className="font-mono"
                        style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 2 }}
                      >
                        Purchased {p.purchasedAt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="grid border-t border-ink-10"
            style={{ paddingTop: 24, gap: 12 }}
          >
            <SummaryRow
              label="Plan"
              value={
                <>
                  AV Care{' '}
                  {selected === 'plus' ? (
                    <span className="bav-italic font-display" style={{ fontSize: 15 }}>
                      Plus
                    </span>
                  ) : (
                    'Essential'
                  )}
                </>
              }
            />
            <SummaryRow label="First payment" value={<span className="font-mono">£0.00 today</span>} />
            <SummaryRow
              label="After 30 days"
              value={<span className="font-mono">£{price.toFixed(2)} /mo</span>}
            />
            <SummaryRow
              label="Excess per claim"
              value={<span className="font-mono">£100.00</span>}
            />
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className="bav-cta"
            style={{ marginTop: 8, border: 'none', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting
              ? 'Preparing…'
              : `Continue with ${selected === 'plus' ? 'Plus' : 'Essential'} →`}
          </button>

          {error && (
            <p
              className="font-mono m-0 text-center"
              style={{ fontSize: 11, color: '#B94040', letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              {error}
            </p>
          )}

          <p
            className="m-0 text-center"
            style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-30)' }}
          >
            First 30 days free. Then £{price.toFixed(2)}/mo. £100 excess per claim. Cancel any time.
            You will be handed to Stripe for billing details.
          </p>
        </aside>
      </div>
    </>
  );
}

function FinePrint({ label, body }: { label: string; body: string }) {
  return (
    <div className="border-t border-ink-10" style={{ paddingTop: 20 }}>
      <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
        — {label}
      </span>
      <p
        className="m-0"
        style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)', marginTop: 12 }}
      >
        {body}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
        — {label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--ink)', textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}
