import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  OrderStatusButtons,
  OrderCustomerMessageButton,
  OrderRefundButton,
} from '@/components/admin/OrderDetailActions';

export const dynamic = 'force-dynamic';

function gbp(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAddress(addr: unknown) {
  if (!addr || typeof addr !== 'object') return null;
  const a = addr as {
    line1?: string;
    line2?: string | null;
    city?: string;
    region?: string | null;
    postcode?: string;
    countryIso2?: string;
  };
  return (
    <div className="text-[13px] leading-[1.7]" style={{ color: 'var(--ink)' }}>
      {a.line1}
      <br />
      {a.line2 && (
        <>
          {a.line2}
          <br />
        </>
      )}
      {a.city}
      <br />
      <span className="font-mono">{a.postcode}</span>
      <br />
      {a.countryIso2 === 'GB' ? 'United Kingdom' : a.countryIso2}
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // `params.id` can be either the orderId uuid or orderNumber. Try both.
  const order = await prisma.order.findFirst({
    where: { OR: [{ orderNumber: params.id }, { orderId: params.id }] },
    include: {
      user: true,
      items: {
        include: {
          product: { select: { title: true, slug: true, sku: true, primaryImageUrl: true } },
          builder: { select: { displayName: true, builderCode: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const customer = order.user;
  const builders = await prisma.builder.findMany({
    where: { status: 'active' },
    orderBy: { builderCode: 'asc' },
    select: { builderId: true, builderCode: true, displayName: true },
  });

  const timeline: Array<{ at: string; status: string; by: string; note: string }> = [
    { at: order.createdAt.toLocaleString('en-GB'), status: 'draft', by: 'Customer', note: 'Order placed' },
  ];
  if (order.paymentCapturedAt) {
    timeline.push({
      at: order.paymentCapturedAt.toLocaleString('en-GB'),
      status: 'paid',
      by: order.paymentMethod ?? 'Payment',
      note: `Payment captured · ${gbp(Number(order.totalGbp))}`,
    });
  }
  if (order.queuedForBuildAt) {
    timeline.push({
      at: order.queuedForBuildAt.toLocaleString('en-GB'),
      status: 'queued',
      by: 'System',
      note: 'Queued for build',
    });
  }
  if (order.shippedAt) {
    timeline.push({
      at: order.shippedAt.toLocaleString('en-GB'),
      status: 'shipped',
      by: 'Warehouse',
      note: 'Shipped',
    });
  }
  if (order.deliveredAt) {
    timeline.push({
      at: order.deliveredAt.toLocaleString('en-GB'),
      status: 'delivered',
      by: 'Carrier',
      note: 'Delivered',
    });
  }

  const totalGbp = Number(order.totalGbp);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 48px 0' }}>
      {/* Breadcrumb */}
      <div className="mb-7 flex items-center gap-3">
        <Link href="/admin/orders" className="bav-label bav-hover-opa" style={{ color: 'var(--ink-60)' }}>
          ← Orders
        </Link>
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
          /
        </span>
        <span className="bav-label font-mono" style={{ color: 'var(--ink)' }}>
          {order.orderNumber}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — Order
          </span>
          <h1
            className="m-0 mt-2 font-light"
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontSize: 44,
              letterSpacing: '-0.01em',
            }}
          >
            <span className="font-mono" style={{ fontSize: 28, color: 'var(--ink-60)', marginRight: 16, fontWeight: 400 }}>
              {order.orderNumber}
            </span>
          </h1>
          <p className="mt-3.5 flex items-center gap-3 text-[14px]" style={{ color: 'var(--ink-60)' }}>
            {order.status === 'in_build' && <span className="bav-pulse" />}
            <span>
              {order.status.replace('_', ' ')} · placed {order.createdAt.toLocaleDateString('en-GB')}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
            Total
          </div>
          <div className="mt-1 font-mono" style={{ fontSize: 32, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {gbp(totalGbp)}
          </div>
        </div>
      </div>

      {/* Status transitions row */}
      <div className="mb-12 flex gap-3 flex-wrap">
        <OrderStatusButtons orderId={order.orderId} status={order.status} />
        <OrderRefundButton totalGbp={totalGbp} />
        <OrderCustomerMessageButton />
      </div>

      {/* Main grid */}
      <div
        className="mb-24 grid gap-[72px]"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}
      >
        {/* Main column */}
        <div>
          {/* Items */}
          <div className="mb-14">
            <div className="bav-label mb-5" style={{ color: 'var(--ink-60)' }}>
              — Items
            </div>
            <div style={{ border: '1px solid var(--ink-10)' }}>
              {order.items.map((item, i) => {
                const builder = item.builder;
                return (
                  <div
                    key={item.orderItemId}
                    className="grid gap-5 p-5 items-start"
                    style={{
                      gridTemplateColumns: '120px 1fr 160px',
                      borderBottom:
                        i === order.items.length - 1 ? 'none' : '1px solid var(--ink-10)',
                    }}
                  >
                    <div className="bav-canvas flex items-center justify-center" style={{ height: 120 }}>
                      <span
                        className="font-light"
                        style={{
                          fontFamily: 'var(--font-fraunces), Georgia, serif',
                          fontSize: 32,
                          color: 'var(--ink)',
                        }}
                      >
                        <span className="bav-italic">№</span>
                        {item.orderItemId.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono text-[11px]" style={{ color: 'var(--ink-60)', marginBottom: 6 }}>
                        {item.product.sku}
                      </div>
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="bav-hover-opa block text-[16px] mb-2.5"
                      >
                        {item.product.title}
                      </Link>
                      {builder && (
                        <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--ink-60)' }}>
                          <span className="bav-ink-canvas" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
                          <Link href={`/builders/${builder.builderCode}`} className="bav-hover-opa">
                            Built by {builder.displayName}
                          </Link>
                          <span style={{ color: 'var(--ink-30)' }}>·</span>
                          <span className="font-mono">{builder.builderCode}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
                        Qty {item.qty}
                      </div>
                      <div className="font-mono text-[16px] mt-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {gbp(Number(item.pricePerUnitGbp) * item.qty)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="ml-auto mt-6" style={{ maxWidth: 360 }}>
              {[
                { label: 'Subtotal', value: gbp(Number(order.subtotalGbp)) },
                { label: 'Shipping', value: gbp(Number(order.shippingGbp)) },
                { label: 'Tax', value: gbp(Number(order.taxGbp)) },
                {
                  label: 'Discount',
                  value: Number(order.discountGbp) ? `−${gbp(Number(order.discountGbp))}` : '—',
                },
              ].map((t, i) => (
                <div
                  key={t.label}
                  className="flex justify-between"
                  style={{
                    padding: '10px 0',
                    borderTop: i === 0 ? '1px solid var(--ink-10)' : 'none',
                    borderBottom: '1px solid var(--ink-10)',
                  }}
                >
                  <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                    {t.label}
                  </span>
                  <span className="font-mono text-[13px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {t.value}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between"
                style={{ padding: '16px 0', borderBottom: '1px solid var(--ink)' }}
              >
                <span className="bav-label">Total</span>
                <span className="font-mono text-[18px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {gbp(totalGbp)}
                </span>
              </div>
            </div>
          </div>

          {order.customerNotes && (
            <div
              className="mb-14"
              style={{ padding: '24px 28px', border: '1px solid var(--ink-10)', background: 'var(--paper-2)' }}
            >
              <div className="bav-label mb-2.5" style={{ color: 'var(--ink-60)' }}>
                — Customer notes
              </div>
              <p className="m-0 text-[14px] italic leading-[1.6]">“{order.customerNotes}”</p>
            </div>
          )}

          <div>
            <div className="bav-label mb-5" style={{ color: 'var(--ink-60)' }}>
              — Activity log
            </div>
            <div style={{ borderTop: '1px solid var(--ink-10)' }}>
              {timeline
                .slice()
                .reverse()
                .map((t, i) => (
                  <div
                    key={i}
                    className="grid items-start gap-5"
                    style={{
                      gridTemplateColumns: '200px 1fr 140px',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--ink-10)',
                    }}
                  >
                    <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
                      {t.at}
                    </span>
                    <span className="text-[14px]">{t.note}</span>
                    <span className="font-mono text-[11px] text-right" style={{ color: 'var(--ink-30)' }}>
                      {t.by}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Aside */}
        <aside>
          <div className="mb-10">
            <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
              — Customer
            </div>
            <div className="text-[16px] mb-2">
              {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email}
            </div>
            <div className="text-[13px] mb-1" style={{ color: 'var(--ink-60)' }}>
              {customer.email}
            </div>
            {customer.phone && (
              <div className="font-mono text-[13px] mb-3.5" style={{ color: 'var(--ink-60)' }}>
                {customer.phone}
              </div>
            )}
          </div>

          <div className="mb-10">
            <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
              — Ship to
            </div>
            {formatAddress(order.shippingAddress) ?? (
              <p className="text-[13px]" style={{ color: 'var(--ink-30)' }}>
                No shipping address.
              </p>
            )}
          </div>

          <div className="mb-10">
            <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
              — Payment
            </div>
            <div className="text-[13px] leading-[1.7]">
              <div>{order.paymentMethod?.replace('_', ' · ') ?? 'Not captured'}</div>
              {order.paymentCapturedAt && (
                <div style={{ color: 'var(--ink-60)' }}>
                  Captured {order.paymentCapturedAt.toLocaleString('en-GB')}
                </div>
              )}
              {order.paymentIntentId && (
                <div className="font-mono text-[11px] mt-1.5" style={{ color: 'var(--ink-30)' }}>
                  {order.paymentIntentId}
                </div>
              )}
            </div>
          </div>

          <div className="mb-10">
            <div className="bav-label mb-3" style={{ color: 'var(--ink-60)' }}>
              — Assigned
            </div>
            <select className="bav-input" defaultValue="">
              <option value="">Unassigned</option>
              {builders.map((b) => (
                <option key={b.builderId} value={b.builderId}>
                  {b.builderCode} · {b.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-10">
            <div className="bav-label mb-3" style={{ color: 'var(--ink-60)' }}>
              — Internal note
            </div>
            <textarea
              className="bav-input"
              placeholder="Visible to staff only"
              style={{ minHeight: 80, resize: 'vertical', paddingBottom: 10 }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
