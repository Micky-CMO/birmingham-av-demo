import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { OrdersList, type AccountOrder } from './OrdersList';

export const metadata: Metadata = {
  title: 'Your orders',
  description: 'Every order you have placed with Birmingham AV — status, invoices and returns.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login');

  const [orders, avSub] = await Promise.all([
    prisma.order.findMany({
      where: { userId: current.userId, status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { title: true } },
            unit: { select: { serialNumber: true } },
          },
        },
      },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: current.userId },
      select: { status: true },
    }),
  ]);

  const serialised: AccountOrder[] = orders.map((o) => ({
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    totalGbp: Number(o.totalGbp),
    items: o.items.map((it) => ({
      title: it.product.title,
      qty: it.qty,
      // buildNumber proxy: first 3 digits of unit serial tail, when present.
      buildNumber: it.unit?.serialNumber ? suffixOf(it.unit.serialNumber) : null,
    })),
  }));

  return (
    <AccountShell activeKey="orders" avCareStatus={avSub?.status ?? null}>
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
        Your <span className="bav-italic">orders</span>.
      </h1>
      <p
        style={{
          fontSize: 15,
          color: 'var(--ink-60)',
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 48,
          maxWidth: 540,
        }}
      >
        Every order you&apos;ve placed with Birmingham AV, oldest builds at the bottom. Pick one to see the
        build queue, invoices, or start a return.
      </p>

      <OrdersList orders={serialised} />
    </AccountShell>
  );
}

function suffixOf(serial: string): string | null {
  // Serials like "BAV-AEG-0073-SN-0412" → extract "0073" if it follows the 3-char code.
  const parts = serial.split('-');
  const numericPart = parts.find((p) => /^\d{3,4}$/.test(p));
  return numericPart ?? null;
}
