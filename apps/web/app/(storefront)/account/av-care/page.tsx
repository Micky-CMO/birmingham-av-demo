import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { SwitchPlanOverlay } from './SwitchPlanOverlay';
import { ProductsPanel, type CoveredProduct } from './ProductsPanel';

export const metadata: Metadata = {
  title: 'AV Care',
  description: 'Your AV Care subscription, the products it covers, and your claim history.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

const CLAIM_STATUS_META: Record<
  string,
  { label: string; tone: 'neutral' | 'active' | 'warn' | 'done' | 'reject' }
> = {
  submitted: { label: 'Submitted', tone: 'neutral' },
  assessing: { label: 'Assessing', tone: 'active' },
  awaiting_excess_payment: { label: 'Excess pending', tone: 'warn' },
  awaiting_unit: { label: 'Awaiting unit', tone: 'active' },
  in_repair: { label: 'In repair', tone: 'active' },
  in_qc: { label: 'In QC', tone: 'active' },
  returning: { label: 'Returning', tone: 'active' },
  resolved: { label: 'Resolved', tone: 'done' },
  rejected: { label: 'Rejected', tone: 'reject' },
};

function buildNumberFromSku(sku: string): string | null {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return null;
  return m[1].padStart(3, '0').slice(-3);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function AccountAvCarePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/account/av-care');

  const subscription = await prisma.avCareSubscription.findUnique({
    where: { userId: user.userId },
  });

  if (!subscription) redirect('/av-care');

  const [claims, orderItems] = await Promise.all([
    prisma.avCareClaim.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { title: true, sku: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: { order: { userId: user.userId, status: { not: 'draft' } } },
      include: {
        product: { select: { productId: true, title: true, sku: true } },
        order: { select: { deliveredAt: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const seen = new Set<string>();
  const coveredProducts: CoveredProduct[] = orderItems
    .filter((it) => {
      if (seen.has(it.productId)) return false;
      seen.add(it.productId);
      return true;
    })
    .map((it) => ({
      productId: it.productId,
      title: it.product.title,
      buildNumber: buildNumberFromSku(it.product.sku),
      purchasedAt: fmtDate(it.order.deliveredAt ?? it.order.createdAt),
    }));

  const now = Date.now();
  const trialDaysLeft = subscription.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now) / 86_400_000))
    : 0;

  const statusLabel = (() => {
    if (subscription.cancelAtPeriodEnd) {
      return `Cancelling on ${fmtDate(subscription.currentPeriodEnd)}`;
    }
    switch (subscription.status) {
      case 'trialing':
        return `Trialing · ${trialDaysLeft} days left`;
      case 'active':
        return 'Active';
      case 'past_due':
        return 'Past due · payment needed';
      case 'paused':
        return 'Paused';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return subscription.status;
    }
  })();

  const statusDot =
    subscription.status === 'past_due'
      ? '#B94040'
      : subscription.status === 'trialing'
        ? 'var(--accent)'
        : null;

  const tier = subscription.tier;
  const monthlyPrice = Number(subscription.monthlyPriceGbp);
  const excessGbp = Number(subscription.claimExcessGbp);

  return (
    <AccountShell activeKey="av-care" avCareStatus={subscription.status}>
      {/* h1 */}
      <h1
        className="font-display m-0"
        style={{
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}
      >
        AV <span className="bav-italic">Care</span>.
      </h1>
      <p
        className="m-0"
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--ink-60)',
          marginBottom: 48,
          maxWidth: '56ch',
        }}
      >
        Your subscription, the products it covers, and claim history.
      </p>

      {/* Current plan panel */}
      <section
        className="border border-ink-10 bg-paper"
        style={{ padding: 40, marginBottom: 64 }}
      >
        <div
          className="flex flex-wrap items-start justify-between"
          style={{ gap: 24 }}
        >
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Current plan
            </span>
            <div
              className="font-display"
              style={{
                fontSize: 44,
                fontWeight: 300,
                lineHeight: 1,
                marginTop: 20,
                letterSpacing: '-0.02em',
              }}
            >
              AV Care {tier === 'plus' ? <span className="bav-italic">Plus</span> : 'Essential'}
            </div>
            <div className="flex items-center" style={{ marginTop: 18, gap: 10 }}>
              {statusDot && (
                <span
                  className="inline-block"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: statusDot,
                  }}
                />
              )}
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{statusLabel}</span>
            </div>
          </div>

          <div
            className="font-mono text-right"
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          >
            £{monthlyPrice.toFixed(2)}
            <span
              style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-60)', marginLeft: 4 }}
            >
              /mo
            </span>
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 border-t border-ink-10"
          style={{ gap: 32, marginTop: 40, paddingTop: 32 }}
        >
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Trial ends
            </span>
            <div className="font-mono" style={{ fontSize: 16, color: 'var(--ink)', marginTop: 8 }}>
              {fmtDate(subscription.trialEndsAt)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', marginTop: 4 }}>
              {trialDaysLeft} days from today
            </div>
          </div>
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Next invoice
            </span>
            <div className="font-mono" style={{ fontSize: 16, color: 'var(--ink)', marginTop: 8 }}>
              {fmtDate(subscription.currentPeriodEnd)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', marginTop: 4 }}>
              £{monthlyPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Excess per claim
            </span>
            <div className="font-mono" style={{ fontSize: 16, color: 'var(--ink)', marginTop: 8 }}>
              £{excessGbp.toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', marginTop: 4 }}>
              Flat rate, both tiers
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center"
          style={{ marginTop: 40, gap: 32 }}
        >
          <SwitchPlanOverlay
            currentTier={tier}
            nextBillingDate={fmtDate(subscription.currentPeriodEnd)}
          />
          <Link
            href="/av-care/manage-payment"
            className="bav-underline"
            style={{ fontSize: 14, color: 'var(--ink-60)', textDecoration: 'none' }}
          >
            Update payment method
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
          <Link
            href="/warranty"
            className="bav-underline"
            style={{ fontSize: 14, color: 'var(--ink-60)', textDecoration: 'none' }}
          >
            Read the terms
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Claims history */}
      <section style={{ marginBottom: 64 }}>
        <div
          className="flex flex-wrap items-baseline justify-between"
          style={{ marginBottom: 24, gap: 16 }}
        >
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Claims
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: 28,
                fontWeight: 300,
                margin: '12px 0 0',
                lineHeight: 1,
                letterSpacing: '-0.015em',
              }}
            >
              History
            </h2>
          </div>
          <Link
            href="/account/av-care/claim/new"
            className="bav-cta"
            style={{ width: 'auto', padding: '16px 28px', textDecoration: 'none' }}
          >
            New claim
          </Link>
        </div>

        {claims.length === 0 ? (
          <div
            className="border border-ink-10 text-center"
            style={{ padding: '64px 40px' }}
          >
            <div
              className="font-display"
              style={{ fontSize: 28, fontWeight: 300, fontStyle: 'italic', color: 'var(--ink-60)' }}
            >
              No claims yet.
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-30)', marginTop: 12 }}>
              Nothing to worry about.
            </div>
          </div>
        ) : (
          <div className="border-t border-ink-10">
            {claims.map((c) => {
              const meta = CLAIM_STATUS_META[c.status] ?? { label: c.status, tone: 'neutral' as const };
              const buildNumber = buildNumberFromSku(c.product.sku);
              return (
                <Link
                  key={c.claimId}
                  href={`/account/av-care/claim/${c.claimNumber}`}
                  className="bav-hover-opa grid items-center border-b border-ink-10 no-underline"
                  style={{
                    gridTemplateColumns: '140px 1fr 140px 120px 24px',
                    gap: 24,
                    padding: '24px 0',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div
                      className="font-mono"
                      style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}
                    >
                      {c.claimNumber}
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 4 }}
                    >
                      {fmtDate(c.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                      {c.product.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-60)', marginTop: 4 }}>
                      Build <span className="font-mono">{buildNumber ?? '—'}</span>
                    </div>
                  </div>
                  <StatusPill tone={meta.tone} label={meta.label} />
                  <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                    View
                  </span>
                  <span style={{ color: 'var(--ink-30)' }} aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <ProductsPanel products={coveredProducts} />

      <div className="border-t border-ink-10" style={{ paddingTop: 32 }}>
        <Link
          href="/account/av-care/cancel"
          className="bav-hover-opa bav-label"
          style={{ color: 'var(--ink-30)', textDecoration: 'none' }}
        >
          Cancel subscription
        </Link>
      </div>
    </AccountShell>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: 'neutral' | 'active' | 'warn' | 'done' | 'reject';
  label: string;
}) {
  const border =
    tone === 'warn' || tone === 'reject'
      ? '#B94040'
      : tone === 'done'
        ? 'var(--ink-60)'
        : 'var(--ink-10)';
  const color =
    tone === 'warn' || tone === 'reject'
      ? '#B94040'
      : tone === 'done'
        ? 'var(--ink-60)'
        : 'var(--ink)';
  return (
    <span
      className="font-mono inline-block uppercase"
      style={{
        fontSize: 11,
        letterSpacing: '0.08em',
        color,
        border: `1px solid ${border}`,
        padding: '5px 10px',
      }}
    >
      {label}
    </span>
  );
}
