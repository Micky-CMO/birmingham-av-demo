import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import '@/components/avcare/avcare.css';
import { SubscribeClient } from './SubscribeClient';

export const metadata: Metadata = {
  title: 'Subscribe to AV Care',
  description:
    'Pick an AV Care plan. 30-day free trial. £100 excess per claim. Cancel any time.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

function buildNumberFromSku(sku: string): string | null {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return null;
  return m[1].padStart(3, '0').slice(-3);
}

export default async function AvCareSubscribePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/av-care/subscribe');

  const existingSub = await prisma.avCareSubscription.findUnique({
    where: { userId: user.userId },
    select: { status: true, tier: true },
  });

  if (
    existingSub &&
    existingSub.status !== 'cancelled' &&
    existingSub.status !== 'expired'
  ) {
    redirect('/account/av-care');
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { order: { userId: user.userId, status: { not: 'draft' } } },
    include: {
      product: { select: { productId: true, title: true, sku: true } },
      order: { select: { deliveredAt: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const seen = new Set<string>();
  const coveredProducts = orderItems
    .filter((it) => {
      if (seen.has(it.productId)) return false;
      seen.add(it.productId);
      return true;
    })
    .map((it) => {
      const purchased = it.order.deliveredAt ?? it.order.createdAt;
      return {
        productId: it.productId,
        title: it.product.title,
        buildNumber: buildNumberFromSku(it.product.sku),
        purchasedAt: purchased
          ? purchased.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : null,
      };
    });

  return <SubscribeClient coveredProducts={coveredProducts} />;
}
