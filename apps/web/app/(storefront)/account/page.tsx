import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';

export const metadata: Metadata = {
  title: 'Your account',
  description:
    'Everything you have ordered, registered, covered and queued with Birmingham AV — in one place.',
};
export const dynamic = 'force-dynamic';

type RecentItem = {
  kind: 'order' | 'return';
  href: string;
  title: string;
  meta: string;
  dateIso: string;
  reference: string;
};

export default async function AccountDashboardPage() {
  // Staff users go to the admin console.
  const isStaff = cookies().get('bav_staff')?.value === '1';
  if (isStaff) redirect('/admin/dashboard');

  const current = await getCurrentUser();
  if (!current) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { userId: current.userId },
    include: {
      addresses: true,
      avCareSubscription: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          items: { include: { product: { select: { title: true } } }, take: 1 },
        },
      },
    },
  });
  if (!user) redirect('/auth/login');

  const [totalOrders, activeOrders, totalReturns, openReturns, passkeys] =
    await Promise.all([
      prisma.order.count({ where: { userId: user.userId, status: { not: 'draft' } } }),
      prisma.order.count({
        where: {
          userId: user.userId,
          status: { in: ['paid', 'queued', 'in_build', 'qc', 'shipped'] as never[] },
        },
      }),
      prisma.return.count({ where: { requestedByUserId: user.userId } }),
      prisma.return.count({
        where: {
          requestedByUserId: user.userId,
          status: { in: ['requested', 'approved', 'in_transit', 'received'] as never[] },
        },
      }),
      prisma.webauthnCredential.count({ where: { userId: user.userId } }),
    ]);

  const firstName = user.firstName || 'there';
  const avSub = user.avCareSubscription;

  const recent: RecentItem[] = user.orders.map((o) => ({
    kind: 'order',
    href: `/account/orders/${o.orderNumber}`,
    title: o.items[0]?.product?.title ?? 'Order',
    meta: statusLabel(o.status),
    dateIso: o.createdAt.toISOString(),
    reference: o.orderNumber,
  }));

  return (
    <AccountShell activeKey="dashboard" avCareStatus={avSub?.status ?? null}>
      <h1
        className="font-display"
        style={{
          fontWeight: 300,
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          letterSpacing: '-0.01em',
          lineHeight: 1.06,
          margin: 0,
          marginBottom: 12,
        }}
      >
        Welcome, <span className="bav-italic">{firstName}</span>.
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'var(--ink-60)',
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 64,
          maxWidth: 560,
        }}
      >
        Everything you have ordered, registered, covered and queued — in one place. Pick up where you left
        off, or read the workshop notes on a build in progress.
      </p>

      <AvCarePanel
        subscription={
          avSub
            ? {
                tier: avSub.tier,
                status: avSub.status,
                monthlyPriceGbp: Number(avSub.monthlyPriceGbp),
                claimExcessGbp: Number(avSub.claimExcessGbp),
                trialEndsAt: avSub.trialEndsAt?.toISOString() ?? null,
                currentPeriodEnd: avSub.currentPeriodEnd.toISOString(),
                coveredProductCount: 0,
              }
            : null
        }
      />

      {/* Tile grid */}
      <div className="bav-account-tiles" style={{ marginTop: 64 }}>
        <Tile
          label="— Orders"
          headline="View your orders"
          sub={
            totalOrders === 0
              ? 'No orders yet'
              : totalOrders === 1
                ? '1 order on file'
                : `${totalOrders} orders on file${activeOrders > 0 ? ` · ${activeOrders} in progress` : ''}`
          }
          href="/account/orders"
        />
        <Tile
          label="— Returns"
          headline="Returns & refunds"
          sub={
            openReturns === 0
              ? totalReturns === 0
                ? 'None on record'
                : `${totalReturns} historical`
              : `${openReturns} open`
          }
          href="/account/returns"
        />
        <Tile
          label="— Addresses"
          headline="Saved addresses"
          sub={`${user.addresses.length} ${user.addresses.length === 1 ? 'address' : 'addresses'}`}
          href="/account/addresses"
        />
        <Tile
          label="— AV Care"
          headline="Subscription warranty"
          sub={avCareTileSubtitle(avSub)}
          href="/account/av-care"
        />
        <Tile
          label="— Security"
          headline="Password, 2FA, passkeys"
          sub={`${passkeys} ${passkeys === 1 ? 'passkey' : 'passkeys'} · 2FA ${user.mfaEnabled ? 'on' : 'off'}`}
          href="/account/security"
        />
        <Tile
          label="— Notifications"
          headline="Email, push, Telegram"
          sub="Manage channels"
          href="/account/notifications"
        />
      </div>

      {/* Recent activity */}
      <section style={{ marginTop: 96 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            columnGap: 32,
            marginBottom: 32,
          }}
        >
          <div style={{ gridColumn: 'span 4' }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Recent activity
            </div>
          </div>
          <div style={{ gridColumn: 'span 8' }}>
            <h2
              className="font-display"
              style={{
                fontWeight: 300,
                fontSize: 'clamp(22px, 2vw, 28px)',
                lineHeight: 1.2,
                margin: 0,
                maxWidth: 540,
              }}
            >
              The last <span className="bav-italic">three</span> things on your account.
            </h2>
          </div>
        </div>

        {recent.length === 0 ? (
          <div
            style={{
              padding: '48px 0',
              borderTop: '1px solid var(--ink-10)',
              borderBottom: '1px solid var(--ink-10)',
              textAlign: 'center',
              color: 'var(--ink-60)',
              fontSize: 14,
            }}
          >
            Nothing to show yet. Your most recent orders will appear here.
          </div>
        ) : (
          <div>
            {recent.map((item, i) => (
              <Link
                key={`${item.kind}-${item.reference}`}
                href={item.href}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  alignItems: 'baseline',
                  gap: 24,
                  padding: '22px 0',
                  borderTop: '1px solid var(--ink-10)',
                  borderBottom: i === recent.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
                className="bav-hover-opa"
              >
                <div
                  className="font-mono"
                  style={{ fontSize: 12, color: 'var(--ink-60)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatDate(item.dateIso)}
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-60)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    {item.meta} · {item.reference}
                  </div>
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 12, color: 'var(--ink-60)' }}
                >
                  View →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer meta */}
      <div
        style={{
          marginTop: 96,
          paddingTop: 32,
          borderTop: '1px solid var(--ink-10)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div className="bav-label" style={{ color: 'var(--ink-30)' }}>
          — Signed in as {user.email}
        </div>
        <a
          href="/auth/signout"
          className="bav-hover-opa bav-label"
          style={{ color: 'var(--ink-30)', textDecoration: 'none' }}
        >
          Sign out
        </a>
      </div>
    </AccountShell>
  );
}

function Tile({
  label,
  headline,
  sub,
  href,
}: {
  label: string;
  headline: string;
  sub: string;
  href: string;
}) {
  return (
    <Link href={href} className="bav-account-tile">
      <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
        {label}
      </div>
      <div
        className="font-display"
        style={{ fontWeight: 300, fontSize: 22, lineHeight: 1.25, flex: 1 }}
      >
        {headline}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.4 }}>{sub}</div>
    </Link>
  );
}

type AvSubscriptionPanelProps = {
  tier: 'essential' | 'plus';
  status: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
  monthlyPriceGbp: number;
  claimExcessGbp: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  coveredProductCount: number;
};

function AvCarePanel({ subscription }: { subscription: AvSubscriptionPanelProps | null }) {
  if (!subscription) {
    // Promotional panel
    return (
      <div
        style={{
          border: '1px solid var(--ink-10)',
          padding: 40,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          columnGap: 32,
        }}
      >
        <div style={{ gridColumn: 'span 8' }}>
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>
            — AV Care
          </div>
          <h2
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(24px, 2.4vw, 32px)',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: 12,
            }}
          >
            Keep it running, <span className="bav-italic">indefinitely</span>.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-60)',
              lineHeight: 1.6,
              margin: 0,
              marginBottom: 24,
              maxWidth: 520,
            }}
          >
            A monthly subscription covering parts and labour on every BAV product registered to your account.
            £100 excess per claim. Cancel anytime.
          </p>
        </div>
        <div
          style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'flex-end' }}
        >
          <Link
            href="/av-care"
            className="bav-underline font-mono"
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            Learn more <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  const tierLabel = subscription.tier === 'plus' ? 'Plus' : 'Essential';
  const tierItalic = subscription.tier === 'plus';
  const status = subscription.status;

  let statusLine = '';
  let dotVariant: 'green' | 'red' | null = null;
  if (status === 'trialing' && subscription.trialEndsAt) {
    const days = Math.max(
      0,
      Math.round((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86_400_000),
    );
    statusLine = `Trialing — ${days} day${days === 1 ? '' : 's'} left`;
    dotVariant = 'green';
  } else if (status === 'active') {
    statusLine = 'Active';
    dotVariant = 'green';
  } else if (status === 'past_due') {
    statusLine = 'Payment past due';
    dotVariant = 'red';
  } else if (status === 'cancelled') {
    statusLine = 'Cancelling at period end';
  } else if (status === 'paused') {
    statusLine = 'Paused';
  } else if (status === 'expired') {
    statusLine = 'Expired';
  }

  return (
    <div style={{ border: '1px solid var(--ink-10)', padding: 40 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          columnGap: 32,
          alignItems: 'start',
        }}
      >
        <div style={{ gridColumn: 'span 7' }}>
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>
            — AV Care
          </div>
          <h2
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(24px, 2.4vw, 32px)',
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 10,
            }}
          >
            AV Care {tierItalic ? <span className="bav-italic">Plus</span> : tierLabel}.
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            {dotVariant === 'green' && <span className="bav-pulse" aria-hidden="true" />}
            {dotVariant === 'red' && <span className="bav-past-due-dot" aria-hidden="true" />}
            <div
              className="font-mono"
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--ink)',
              }}
            >
              {statusLine}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: 24,
              rowGap: 10,
            }}
          >
            <KV k="Monthly" v={`£${subscription.monthlyPriceGbp.toFixed(2)} /mo`} />
            <KV k="Excess" v={`£${subscription.claimExcessGbp.toFixed(0)} per claim`} />
            <KV
              k={status === 'trialing' ? 'Trial ends' : 'Next bill'}
              v={formatDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}
            />
          </div>
        </div>

        <div
          style={{
            gridColumn: 'span 5',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'stretch',
          }}
        >
          <Link href="/account/av-care" className="bav-cta" style={{ textDecoration: 'none' }}>
            Manage plan
          </Link>
          <Link
            href="/account/av-care/claim/new"
            className="bav-cta-secondary"
            style={{ textDecoration: 'none' }}
          >
            Start a claim
          </Link>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          color: 'var(--ink-60)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        {k}
      </div>
      <div className="font-mono" style={{ fontSize: 13 }}>
        {v}
      </div>
    </>
  );
}

function formatDate(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    draft: 'Draft',
    pending_payment: 'Awaiting payment',
    paid: 'Paid',
    queued: 'Queued',
    in_build: 'In build',
    qc: 'QC',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return map[s] ?? s;
}

function avCareTileSubtitle(
  sub: {
    tier: string;
    status: string;
    trialEndsAt: Date | null;
  } | null,
) {
  if (!sub) return 'Not subscribed';
  if (sub.status === 'trialing' && sub.trialEndsAt) {
    const days = Math.max(0, Math.round((sub.trialEndsAt.getTime() - Date.now()) / 86_400_000));
    return `Trialing · ${days}d left`;
  }
  if (sub.status === 'active') return `${sub.tier === 'plus' ? 'Plus' : 'Essential'} · active`;
  if (sub.status === 'past_due') return 'Payment past due';
  if (sub.status === 'cancelled') return 'Cancelling at period end';
  return 'Inactive';
}
