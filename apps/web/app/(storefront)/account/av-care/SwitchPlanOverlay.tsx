'use client';

import { useState } from 'react';
import { TierCard } from '@/components/avcare/TierCard';

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

const TIER_BLURB: Record<'essential' | 'plus', string> = {
  essential:
    'Parts and labour across every product on your account. Repaired in our Birmingham workshop, standard turnaround.',
  plus:
    'Everything in Essential, with courier collection, priority turnaround, and a loan unit while yours is with us.',
};

export type SwitchPlanOverlayProps = {
  currentTier: 'essential' | 'plus';
  nextBillingDate: string;
};

export function SwitchPlanOverlay({ currentTier, nextBillingDate }: SwitchPlanOverlayProps) {
  const [open, setOpen] = useState(false);
  const otherTier: 'essential' | 'plus' = currentTier === 'plus' ? 'essential' : 'plus';
  const otherTierLabel = otherTier === 'plus' ? 'Plus' : 'Essential';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bav-underline"
        style={{
          fontSize: 14,
          color: 'var(--ink)',
          background: 'transparent',
          border: 'none',
          padding: '3px 0',
          cursor: 'pointer',
        }}
      >
        Switch to {otherTierLabel}
        <span className="arrow" aria-hidden="true">→</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 grid place-items-center"
          style={{ background: 'rgba(23,20,15,0.35)', zIndex: 50, padding: 24 }}
        >
          <div
            className="w-full border border-ink-10 bg-paper"
            style={{ maxWidth: 480, padding: 32 }}
          >
            <div className="flex items-baseline justify-between" style={{ marginBottom: 16 }}>
              <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                — Switch to
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bav-hover-opa font-mono"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--ink-60)',
                }}
              >
                Close ×
              </button>
            </div>
            <TierCard
              tier={otherTier}
              priceGbp={TIER_PRICE[otherTier]}
              blurb={TIER_BLURB[otherTier]}
              features={otherTier === 'plus' ? PLUS_FEATURES : ESSENTIAL_FEATURES}
              ctaLabel={`Switch to ${otherTierLabel}`}
              ctaVariant="primary"
              ctaHref={`/api/avcare/switch?tier=${otherTier}`}
            />
            <p
              className="m-0 text-center"
              style={{
                fontSize: 12,
                color: 'var(--ink-60)',
                marginTop: 16,
              }}
            >
              Change takes effect at your next billing date ({nextBillingDate}).
            </p>
          </div>
        </div>
      )}
    </>
  );
}
