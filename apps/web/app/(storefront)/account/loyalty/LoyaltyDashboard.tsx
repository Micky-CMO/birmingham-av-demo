export type LoyaltyHistoryEntry = {
  transactionId: string;
  delta: number;
  kind: string;
  description: string;
  createdAt: string;
};

type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_LABEL: Record<TierKey, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const REDEMPTIONS = [
  { id: 'r1', label: '£10 off voucher', cost: 500, sub: 'Single-use, 12-month expiry.' },
  { id: 'r2', label: '£25 off voucher', cost: 1200, sub: 'Single-use.' },
  { id: 'r3', label: 'Free UK delivery', cost: 300, sub: 'Applied at checkout.' },
  { id: 'r4', label: 'AV Care month free', cost: 800, sub: 'Applied to the next invoice.' },
  {
    id: 'r5',
    label: '£50 off voucher',
    cost: 2500,
    sub: 'Gold tier only.',
    goldOnly: true,
  },
];

const fmtNum = (n: number): string => n.toLocaleString('en-GB');

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function LoyaltyDashboard({
  balance,
  lifetimeEarned,
  lifetimeRedeemed,
  tier,
  nextTier,
  nextThreshold,
  pointsToNextTier,
  newPointsSince7d,
  history,
}: {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: TierKey;
  nextTier: TierKey | null;
  nextThreshold: number | null;
  pointsToNextTier: number;
  newPointsSince7d: number;
  history: LoyaltyHistoryEntry[];
}) {
  const progressFraction = nextThreshold
    ? Math.min(1, balance / nextThreshold)
    : 1;

  return (
    <div className="bav-fade" style={{ paddingBottom: 24 }}>
      <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>
        — Account · Loyalty
        {newPointsSince7d > 0 && (
          <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="bav-pulse" />
            <span style={{ color: 'var(--ink)' }}>+{fmtNum(newPointsSince7d)} THIS WEEK</span>
          </span>
        )}
      </div>
      <h1
        className="m-0 font-display font-light"
        style={{
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          fontVariationSettings: "'opsz' 144",
        }}
      >
        Loyalty.
      </h1>

      {/* HERO */}
      <div
        className="grid bav-loyalty-hero"
        style={{
          gridTemplateColumns: '60% 40%',
          gap: 48,
          alignItems: 'end',
          paddingTop: 56,
          paddingBottom: 48,
          borderBottom: '1px solid var(--ink-10)',
          marginTop: 48,
        }}
      >
        <div>
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 18 }}>
            YOUR POINTS
          </div>
          <div
            className="font-display tabular-nums"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(72px, 10vw, 120px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {fmtNum(balance)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 16 }}>
            {TIER_LABEL[tier]} tier.
            {nextTier && nextThreshold
              ? ` ${fmtNum(pointsToNextTier)} to ${TIER_LABEL[nextTier]}.`
              : ' Top tier reached — thank you.'}
          </div>
          {nextThreshold && (
            <div style={{ marginTop: 20, maxWidth: 420 }}>
              <div style={{ position: 'relative', height: 1, background: 'var(--ink-10)' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: -1,
                    height: 3,
                    width: `${progressFraction * 100}%`,
                    background: 'var(--ink)',
                  }}
                />
              </div>
              <div
                className="flex justify-between"
                style={{ marginTop: 8 }}
              >
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 11, color: 'var(--ink-60)' }}
                >
                  {fmtNum(balance)} / {fmtNum(nextThreshold)}
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 11, color: 'var(--ink-30)' }}
                >
                  {(nextTier ? TIER_LABEL[nextTier] : '').toUpperCase()} AT{' '}
                  {fmtNum(nextThreshold)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 18 }}>
            EARN
          </div>
          <div>
            {[
              '£1 spent = 1 point',
              'Leave a review = 25 points',
              'Refer a friend = 250 points (when they order)',
            ].map((line, i) => (
              <div
                key={line}
                style={{
                  fontSize: 13,
                  padding: '12px 0',
                  borderTop: i === 0 ? '1px solid var(--ink-10)' : 'none',
                  borderBottom: '1px solid var(--ink-10)',
                }}
              >
                {line}
              </div>
            ))}
          </div>
          {(lifetimeEarned > 0 || lifetimeRedeemed > 0) && (
            <div
              className="font-mono tabular-nums"
              style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 20 }}
            >
              {fmtNum(lifetimeEarned)} EARNED · {fmtNum(lifetimeRedeemed)} REDEEMED LIFETIME
            </div>
          )}
        </div>
      </div>

      {/* TIERS */}
      <div
        className="grid bav-loyalty-tiers-shell"
        style={{
          gridTemplateColumns: '33.333% 1fr',
          gap: 48,
          paddingTop: 64,
        }}
      >
        <div>
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 18 }}>
            — The tiers
          </div>
          <h2
            className="m-0 font-display font-light"
            style={{
              fontSize: 32,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Three tiers, simple.
          </h2>
        </div>
        <div
          className="grid bav-loyalty-tiers-row"
          style={{
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
            gap: 0,
            border: '1px solid var(--ink-10)',
          }}
        >
          <TierCard
            name="Bronze"
            italic={false}
            range="0 — 999 POINTS"
            perks={['2× points on your birthday.']}
            status={tier === 'bronze' ? 'current' : 'passed'}
            pointsToNextTier={pointsToNextTier}
          />
          <TierCard
            name="Silver"
            italic
            range="1,000 — 1,999 POINTS"
            perks={['Early access to Refurb Week drops.', 'Free UK delivery on all orders.']}
            status={tier === 'silver' ? 'current' : tier === 'bronze' ? 'upcoming' : 'passed'}
            pointsToNextTier={pointsToNextTier}
          />
          <TierCard
            name="Gold"
            italic={false}
            range="2,000+ POINTS"
            perks={[
              'Priority AV Care queue.',
              'Annual £50 credit — January.',
              'Early access to builder waitlists.',
            ]}
            status={
              tier === 'gold' || tier === 'platinum'
                ? 'current'
                : 'upcoming'
            }
            pointsToNextTier={pointsToNextTier}
            lastCol
          />
        </div>
      </div>

      {/* REDEEM */}
      <div style={{ paddingTop: 64 }}>
        <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 18 }}>
          — Redeem
        </div>
        <h2
          className="m-0 font-display font-light"
          style={{
            fontSize: 32,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 32,
            fontVariationSettings: "'opsz' 144",
          }}
        >
          Turn points into credit.
        </h2>

        <div>
          {REDEMPTIONS.map((r, i) => {
            const isGoldOnly = r.goldOnly === true;
            const tierOk = !isGoldOnly || tier === 'gold' || tier === 'platinum';
            const canAfford = balance >= r.cost && tierOk;
            return (
              <div
                key={r.id}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '1fr 100px 120px',
                  gap: 24,
                  padding: '20px 0',
                  borderTop: i === 0 ? '1px solid var(--ink-10)' : 'none',
                  borderBottom: '1px solid var(--ink-10)',
                }}
              >
                <div>
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 16,
                      letterSpacing: '-0.01em',
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {r.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-60)', marginTop: 4 }}>
                    {r.sub}
                  </div>
                </div>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, textAlign: 'right' }}
                >
                  {fmtNum(r.cost)} pts
                </span>
                <button
                  type="button"
                  className="bav-cta-secondary"
                  disabled={!canAfford}
                  style={{ justifySelf: 'end' }}
                >
                  Redeem
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* HISTORY */}
      <div style={{ paddingTop: 64 }}>
        <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 18 }}>
          — History
        </div>
        <h2
          className="m-0 font-display font-light"
          style={{
            fontSize: 32,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 32,
            fontVariationSettings: "'opsz' 144",
          }}
        >
          What you&rsquo;ve done.
        </h2>

        {history.length === 0 ? (
          <div
            style={{
              padding: '48px 0',
              textAlign: 'center',
              color: 'var(--ink-60)',
              fontSize: 13,
            }}
          >
            No activity yet. Your first order earns your first points.
          </div>
        ) : (
          <div>
            {history.map((h, i) => (
              <div
                key={h.transactionId}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '100px 1fr 80px',
                  gap: 16,
                  padding: '16px 0',
                  borderTop: i === 0 ? '1px solid var(--ink-10)' : 'none',
                  borderBottom: '1px solid var(--ink-10)',
                }}
              >
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 11, color: 'var(--ink-60)' }}
                >
                  {fmtDate(h.createdAt)}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.5 }}>{h.description}</span>
                <span
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 13,
                    color: h.delta > 0 ? '#1EB53A' : 'var(--ink-60)',
                    textAlign: 'right',
                  }}
                >
                  {h.delta > 0 ? '+' : ''}
                  {fmtNum(h.delta)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 48 }}>
        <p style={{ fontSize: 13, color: 'var(--ink-30)', lineHeight: 1.6 }}>
          Terms, point expiry, and the small print live on the{' '}
          <a
            href="/loyalty/terms"
            className="bav-underline"
            style={{ color: 'var(--ink-30)', textDecoration: 'none' }}
          >
            Loyalty terms page <span className="arrow">→</span>
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function TierCard({
  name,
  italic,
  range,
  perks,
  status,
  pointsToNextTier,
  lastCol,
}: {
  name: string;
  italic: boolean;
  range: string;
  perks: string[];
  status: 'passed' | 'current' | 'upcoming';
  pointsToNextTier: number;
  lastCol?: boolean;
}) {
  return (
    <div
      style={{
        padding: 22,
        borderRight: lastCol ? 'none' : '1px solid var(--ink-10)',
      }}
    >
      <div
        className="font-display font-light"
        style={{
          fontSize: 24,
          letterSpacing: '-0.01em',
          fontVariationSettings: "'opsz' 144",
        }}
      >
        {italic ? <span className="bav-italic">{name}</span> : name}
      </div>
      <div
        className="font-mono tabular-nums"
        style={{ fontSize: 11, color: 'var(--ink-60)', marginTop: 8 }}
      >
        {range}
      </div>
      <div style={{ marginTop: 18, marginBottom: 32 }}>
        {perks.map((p) => (
          <p
            key={p}
            style={{
              fontSize: 13,
              color: status === 'passed' ? 'var(--ink-60)' : 'var(--ink)',
              margin: 0,
              marginBottom: 8,
              lineHeight: 1.6,
            }}
          >
            {p}
          </p>
        ))}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {status === 'current' && (
          <>
            <span className="bav-pulse" />
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 10, color: 'var(--ink)' }}
            >
              CURRENT
            </span>
          </>
        )}
        {status === 'passed' && (
          <>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--ink-30)',
              }}
            />
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 10, color: 'var(--ink-30)' }}
            >
              PASSED
            </span>
          </>
        )}
        {status === 'upcoming' && (
          <>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--ink-30)',
              }}
            />
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 10, color: 'var(--ink-30)' }}
            >
              UPCOMING
              {pointsToNextTier > 0 ? ` — ${fmtNum(pointsToNextTier)} MORE` : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
