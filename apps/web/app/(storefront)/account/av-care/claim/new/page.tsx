import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import '@/components/avcare/avcare.css';
import { NewClaimForm, type CoveredProduct } from './NewClaimForm';

export const metadata: Metadata = {
  title: 'New AV Care claim',
  description: 'Open a new AV Care claim on a product registered to your account.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

function buildNumberFromSku(sku: string): string | null {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return null;
  return m[1].padStart(3, '0').slice(-3);
}

function fmtDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function NewAvCareClaimPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/account/av-care/claim/new');

  const subscription = await prisma.avCareSubscription.findUnique({
    where: { userId: user.userId },
    select: { status: true, tier: true, claimExcessGbp: true },
  });
  if (!subscription) redirect('/av-care');
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    redirect('/av-care');
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { order: { userId: user.userId, status: { not: 'draft' } } },
    include: {
      product: { select: { productId: true, title: true, sku: true, subtitle: true } },
      order: { select: { deliveredAt: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const seen = new Set<string>();
  const products: CoveredProduct[] = orderItems
    .filter((it) => {
      if (seen.has(it.productId)) return false;
      seen.add(it.productId);
      return true;
    })
    .map((it) => ({
      productId: it.productId,
      title: it.product.title,
      subtitle: it.product.subtitle ?? '',
      buildNumber: buildNumberFromSku(it.product.sku),
      purchasedAt: fmtDate(it.order.deliveredAt ?? it.order.createdAt),
    }));

  const preSelectedProductId =
    typeof searchParams.product === 'string' ? searchParams.product : null;

  return (
    <AccountShell activeKey="av-care" avCareStatus={subscription.status}>
      <nav className="flex items-center" style={{ gap: 12, marginBottom: 24 }}>
        <Link
          href="/account/av-care"
          className="bav-hover-opa bav-label"
          style={{ color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          — AV Care
        </Link>
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
          /
        </span>
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
          New claim
        </span>
      </nav>

      <h1
        className="font-display m-0"
        style={{
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          marginBottom: 16,
        }}
      >
        Start a <span className="bav-italic">claim</span>.
      </h1>
      <p
        className="m-0"
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--ink-60)',
          marginBottom: 56,
          maxWidth: '54ch',
        }}
      >
        Three steps. We will confirm within a working day and a builder will own the repair end to
        end.
      </p>

      <NewClaimForm
        products={products}
        preSelectedProductId={preSelectedProductId}
        tier={subscription.tier}
      />
    </AccountShell>
  );
}
