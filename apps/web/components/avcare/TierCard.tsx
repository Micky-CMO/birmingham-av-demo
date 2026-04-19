import Link from 'next/link';

export type TierCardProps = {
  tier: 'essential' | 'plus';
  priceGbp: number;
  blurb: string;
  features: Array<{ label: string }>;
  ctaLabel: string;
  ctaVariant: 'primary' | 'secondary';
  ctaHref?: string;
  onCtaClick?: () => void;
  disabled?: boolean;
  /** When set, renders a read-only "Current plan" pill instead of a CTA. */
  currentPlanLabel?: string | null;
};

/**
 * Shared AV Care tier card — used by the marketing landing (A47), the
 * subscribe flow (A49), and the account switch-plan overlay (A50). Accepts
 * either an href (navigation) or an onCtaClick handler (in-page selection).
 */
export function TierCard({
  tier,
  priceGbp,
  blurb,
  features,
  ctaLabel,
  ctaVariant,
  ctaHref,
  onCtaClick,
  disabled = false,
  currentPlanLabel = null,
}: TierCardProps) {
  const isPlus = tier === 'plus';
  const nameText = isPlus ? 'Plus' : 'Essential';

  const ctaClass = ctaVariant === 'primary' ? 'bav-cta' : 'bav-cta-secondary';

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (disabled || currentPlanLabel) {
      e.preventDefault();
      return;
    }
    if (onCtaClick) {
      e.preventDefault();
      onCtaClick();
    }
  }

  return (
    <div
      className="flex flex-col gap-8 border border-ink-10 bg-paper"
      style={{ padding: '48px 40px' }}
    >
      {/* Header */}
      <div className="flex flex-col gap-5">
        <span className="bav-label" style={{ color: 'var(--ink-60)' }}>— AV Care</span>

        <h3
          className="font-display m-0"
          style={{
            fontWeight: 300,
            fontSize: 32,
            lineHeight: 1,
            fontStyle: isPlus ? 'italic' : 'normal',
          }}
        >
          {nameText}
        </h3>

        <div className="flex items-baseline gap-1.5">
          <span
            className="font-mono"
            style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}
          >
            £{priceGbp.toFixed(2)}
          </span>
          <span className="font-mono" style={{ fontSize: 14, color: 'var(--ink-60)' }}>
            /mo
          </span>
        </div>

        <p
          className="m-0"
          style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-60)', maxWidth: '40ch' }}
        >
          {blurb}
        </p>
      </div>

      {/* Features */}
      <div className="flex flex-col">
        {features.map((f, i) => {
          const isLast = i === features.length - 1;
          return (
            <div
              key={f.label}
              className="grid items-start gap-4 border-t border-ink-10"
              style={{
                gridTemplateColumns: '14px 1fr',
                padding: '16px 0',
                borderBottom: isLast ? '1px solid var(--ink-10)' : undefined,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                style={{ marginTop: 4 }}
                aria-hidden="true"
              >
                <path
                  d="M2 6.5L5 9.5L10 3"
                  stroke="var(--ink)"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="square"
                />
              </svg>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>{f.label}</span>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div>
        {currentPlanLabel ? (
          <div
            className="w-full border border-ink-10 text-center uppercase"
            style={{
              padding: '22px 44px',
              color: 'var(--ink-60)',
              fontSize: 13,
              letterSpacing: '0.02em',
            }}
          >
            {currentPlanLabel}
          </div>
        ) : onCtaClick ? (
          <a
            href={disabled ? undefined : ctaHref ?? '#'}
            onClick={handleClick}
            className={ctaClass}
            style={{
              opacity: disabled ? 0.4 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
              textDecoration: 'none',
            }}
          >
            {ctaLabel}
          </a>
        ) : (
          <Link
            href={disabled ? '#' : ctaHref ?? '#'}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={ctaClass}
            style={{
              opacity: disabled ? 0.4 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
              textDecoration: 'none',
            }}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export default TierCard;
