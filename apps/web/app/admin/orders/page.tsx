import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: 'draft' } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { email: true, firstName: true, lastName: true } }, items: true },
  });

  return (
    <div>
      <h1 className="text-h2 font-display">Orders</h1>
      <GlassCard className="mt-6 overflow-x-auto">
        <table className="w-full text-small">
          <thead className="border-b border-ink-300/50 text-caption text-ink-500 dark:border-obsidian-500/40">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId} className="border-b border-ink-300/40 last:border-0 dark:border-obsidian-500/30">
                <td className="px-4 py-3 font-mono">{o.orderNumber}</td>
                <td className="px-4 py-3">{o.user.firstName ?? ''} {o.user.lastName ?? ''}<div className="text-caption text-ink-500">{o.user.email}</div></td>
                <td className="px-4 py-3"><Badge tone={o.status === 'delivered' ? 'positive' : 'info'}>{o.status}</Badge></td>
                <td className="px-4 py-3 text-right font-mono">{o.items.length}</td>
                <td className="px-4 py-3 text-right font-mono">{formatGbp(Number(o.totalGbp))}</td>
                <td className="px-4 py-3 text-right text-caption text-ink-500">{o.createdAt.toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-ink-500">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
