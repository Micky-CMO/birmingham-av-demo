import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payments · Admin' };

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';

function deriveStatus(order: {
  status: string;
  paymentCapturedAt: Date | null;
  paymentIntentId: string | null;
}): PaymentStatus {
  if (order.status === 'cancelled') return 'cancelled';
  if (order.paymentCapturedAt) return 'paid';
  if (!order.paymentIntentId) return 'failed';
  return 'pending';
}

const STATUS_TONE: Record<PaymentStatus, string> = {
  paid: 'var(--accent)',
  pending: '#F0B849',
  failed: '#B94040',
  refunded: 'var(--ink-60)',
  cancelled: 'var(--ink-30)',
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

export default async function AdminPaymentsPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { email: true } },
    },
  });

  const statuses = orders.map((o) => ({ ...o, _status: deriveStatus(o) }));

  const totals = {
    paid: statuses.filter((o) => o._status === 'paid').reduce((s, o) => s + Number(o.totalGbp), 0),
    pending: statuses.filter((o) => o._status === 'pending').reduce((s, o) => s + Number(o.totalGbp), 0),
    refunded: statuses.filter((o) => o._status === 'refunded').reduce((s, o) => s + Number(o.totalGbp), 0),
    count: orders.length,
  };

  return (
    <main className="mx-auto max-w-page px-6 py-16 md:px-12">
      <header className="mb-12 flex items-end justify-between border-b border-ink-10 pb-8">
        <div>
          <div className="bav-label mb-4 text-ink-60">— Admin · Payments</div>
          <h1 className="m-0 font-display text-[48px] font-light leading-[1] tracking-[-0.025em]">
            {totals.count} <span className="bav-italic">transactions</span>.
          </h1>
          <p className="mt-4 max-w-[560px] text-[14px] leading-[1.55] text-ink-60">
            Customer payment ledger via Stripe. For builder payouts see the
            Payouts surface under More.
          </p>
        </div>
        <Link
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener"
          className="bav-label border border-ink-10 px-5 py-3 text-ink no-underline transition-colors hover:border-ink"
        >
          Open Stripe ↗
        </Link>
      </header>

      <section className="mb-16 grid grid-cols-1 gap-px bg-ink-10 sm:grid-cols-3">
        <div className="bg-paper p-8">
          <div className="bav-label mb-4 text-ink-60">— Paid (last 100)</div>
          <div className="font-display text-[36px] font-light leading-none tracking-[-0.025em]">
            {formatGbp(totals.paid)}
          </div>
        </div>
        <div className="bg-paper p-8">
          <div className="bav-label mb-4 text-ink-60">— Pending</div>
          <div className="font-display text-[36px] font-light leading-none tracking-[-0.025em]">
            {formatGbp(totals.pending)}
          </div>
        </div>
        <div className="bg-paper p-8">
          <div className="bav-label mb-4 text-ink-60">— Refunded</div>
          <div className="font-display text-[36px] font-light leading-none tracking-[-0.025em]">
            {formatGbp(totals.refunded)}
          </div>
        </div>
      </section>

      <section>
        <div className="border-y border-ink-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink-10">
                <th className="bav-label py-4 pr-4 text-left text-ink-60">Order</th>
                <th className="bav-label py-4 pr-4 text-left text-ink-60">Customer</th>
                <th className="bav-label py-4 pr-4 text-left text-ink-60">Placed</th>
                <th className="bav-label py-4 pr-4 text-left text-ink-60">Method</th>
                <th className="bav-label py-4 pr-4 text-right text-ink-60">Total</th>
                <th className="bav-label py-4 pr-4 text-right text-ink-60">Status</th>
                <th className="bav-label py-4 pr-4 text-right text-ink-60"></th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((o) => (
                <tr key={o.orderId} className="border-b border-ink-10 last:border-0">
                  <td className="py-4 pr-4">
                    <div className="font-mono text-[13px] text-ink">{o.orderNumber}</div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-ink-60">
                    {o.user?.email ?? '—'}
                  </td>
                  <td className="py-4 pr-4 font-mono text-[12px] text-ink-60">
                    {o.createdAt.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-ink-60 capitalize">
                    {o.paymentMethod?.replace('_', ' ') ?? 'Stripe'}
                  </td>
                  <td className="py-4 pr-4 text-right font-mono text-[14px]">
                    {formatGbp(Number(o.totalGbp))}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span
                      className="bav-label inline-flex items-center gap-2"
                      style={{ color: STATUS_TONE[o._status] }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: STATUS_TONE[o._status] }}
                      />
                      {STATUS_LABEL[o._status]}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <Link
                      href={`/admin/orders/${o.orderNumber}`}
                      className="bav-label bav-hover-opa text-ink no-underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[14px] text-ink-60">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
