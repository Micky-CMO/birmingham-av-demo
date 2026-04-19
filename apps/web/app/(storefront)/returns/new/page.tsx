import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { NewReturnForm, type EligibleOrderItem } from './NewReturnForm';

export const metadata: Metadata = {
  title: 'Start a return',
  description:
    '30 days, no questions. Hardware faults covered for 12 months under warranty. Start a return on your Birmingham AV order.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

// Orders delivered less than 30 days ago are eligible for "changed mind" returns.
// Hardware faults are still eligible after that under the warranty. The UI
// shows both, but "out of window" items are disabled.
const RETURN_WINDOW_DAYS = 30;

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?next=/returns/new');

  const orderItemParam =
    typeof searchParams.orderItem === 'string' ? searchParams.orderItem : undefined;

  const [orders, avSub] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId: current.userId,
        status: 'delivered',
      },
      orderBy: { deliveredAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { title: true, sku: true } },
            builder: { select: { displayName: true, builderCode: true } },
          },
        },
      },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: current.userId },
      select: { status: true },
    }),
  ]);

  const now = Date.now();
  const items: EligibleOrderItem[] = orders.flatMap((o) => {
    const deliveredAt = o.deliveredAt;
    const daysSinceDelivery = deliveredAt
      ? Math.floor((now - deliveredAt.getTime()) / 86_400_000)
      : 0;
    const windowDaysLeft = Math.max(0, RETURN_WINDOW_DAYS - daysSinceDelivery);
    return o.items.map((it) => ({
      orderItemId: it.orderItemId,
      orderNumber: o.orderNumber,
      deliveredAt: deliveredAt?.toISOString() ?? null,
      windowDaysLeft,
      title: it.product.title,
      sku: it.product.sku,
      buildNumber: buildNumberFromSku(it.product.sku),
      pricePerUnitGbp: Number(it.pricePerUnitGbp),
      qty: it.qty,
      builderDisplayName: it.builder?.displayName ?? null,
      builderCode: it.builder?.builderCode ?? null,
    }));
  });

  return (
    <AccountShell activeKey="returns" avCareStatus={avSub?.status ?? null}>
      {/* Breadcrumb */}
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          color: 'var(--ink-60)',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          marginBottom: 24,
        }}
      >
        <Link href="/account" className="bav-hover-opa" style={{ color: 'var(--ink-60)', textDecoration: 'none' }}>
          Account
        </Link>
        <span style={{ margin: '0 10px', color: 'var(--ink-30)' }}>/</span>
        <Link
          href="/account/returns"
          className="bav-hover-opa"
          style={{ color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          Returns
        </Link>
        <span style={{ margin: '0 10px', color: 'var(--ink-30)' }}>/</span>
        <span style={{ color: 'var(--ink)' }}>New</span>
      </div>

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
        Start a <span className="bav-italic">return</span>.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-60)', lineHeight: 1.6, margin: 0, marginBottom: 64, maxWidth: 560 }}>
        30 days, no questions. Hardware faults covered for 12 months under warranty. We review each return by
        hand, usually within a working day. Tell us what happened and we&apos;ll take it from there.
      </p>

      <NewReturnForm items={items} preSelectedOrderItemId={orderItemParam ?? null} />
    </AccountShell>
  );
}

function buildNumberFromSku(sku: string): string | null {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return null;
  return m[1].padStart(3, '0').slice(-3);
}
