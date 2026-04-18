import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Badge, GlassCard } from '@/components/ui';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { orderNumber: string };
}): Promise<Metadata> {
  return {
    title: `Order ${params.orderNumber}`,
    description: `Track your Birmingham AV order ${params.orderNumber}: build status, shipping, invoice, and assigned builder.`.slice(0, 159),
    robots: { index: false, follow: false },
  };
}

const STATUS_STEPS = [
  { key: 'paid', label: 'Paid' },
  { key: 'queued', label: 'Queued' },
  { key: 'in_build', label: 'In build' },
  { key: 'qc', label: 'QC' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

export default async function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: { include: { product: true, builder: true, unit: true } },
    },
  });
  if (!order) notFound();

  const activeIndex = Math.max(
    0,
    STATUS_STEPS.findIndex((s) => s.key === order.status),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-caption text-ink-500">Order</p>
          <h1 className="mt-1 font-mono text-h2">{order.orderNumber}</h1>
          <p className="mt-2 text-small text-ink-500">
            Placed {order.createdAt.toLocaleDateString('en-GB')}
          </p>
        </div>
        <Badge tone={order.status === 'delivered' ? 'positive' : 'info'}>{order.status}</Badge>
      </header>

      <GlassCard className="mt-8 p-6">
        <ol className="flex items-center justify-between">
          {STATUS_STEPS.map((s, i) => {
            const done = i <= activeIndex;
            return (
              <li key={s.key} className="flex flex-1 items-center">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption ${
                    done ? 'bg-brand-green text-white' : 'bg-ink-100 text-ink-500 dark:bg-obsidian-800'
                  }`}
                >
                  {i + 1}
                </div>
                <span className="ml-2 text-caption">{s.label}</span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`mx-2 h-px flex-1 ${done ? 'bg-brand-green' : 'bg-ink-300 dark:bg-obsidian-500'}`} />
                )}
              </li>
            );
          })}
        </ol>
      </GlassCard>

      <section className="mt-8">
        <h2 className="text-h3 font-display">Items</h2>
        <ul className="mt-4 divide-y divide-ink-300/50 rounded-lg border border-ink-300/60 dark:divide-obsidian-500/40 dark:border-obsidian-500/60">
          {order.items.map((i) => (
            <li key={i.orderItemId} className="flex items-start justify-between p-4">
              <div>
                <div className="font-medium">{i.product.title}</div>
                <div className="mt-1 text-caption text-ink-500">
                  Built by {i.builder.displayName}
                  {i.unit && <> · Unit {i.unit.serialNumber}</>}
                </div>
              </div>
              <div className="text-right">
                <div>{formatGbp(Number(i.pricePerUnitGbp) * i.qty)}</div>
                <div className="mt-1 text-caption text-ink-500">
                  {i.qty} &times; {formatGbp(Number(i.pricePerUnitGbp))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="text-caption text-ink-500">Total</h3>
          <p className="mt-2 text-h2 font-display">{formatGbp(Number(order.totalGbp))}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-caption text-ink-500">Shipping</h3>
          <p className="mt-2 text-small">
            {order.shippingAddress ? JSON.stringify(order.shippingAddress) : 'Not specified'}
          </p>
        </GlassCard>
      </section>
    </div>
  );
}
