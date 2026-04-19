import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { OrderConfirmedClient } from './OrderConfirmedClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { orderNumber: string };
}): Promise<Metadata> {
  return {
    title: `Order ${params.orderNumber}`,
    description: `Track your Birmingham AV order ${params.orderNumber}.`,
    robots: { index: false, follow: false },
  };
}

type Addr = {
  line1?: string;
  line2?: string | null;
  city?: string;
  region?: string | null;
  county?: string | null;
  postcode?: string;
  countryIso2?: string;
  country?: string;
};

function toAddress(raw: unknown): Addr | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as Addr;
}

function formatCountry(iso2?: string, country?: string): string {
  if (iso2 === 'GB') return 'United Kingdom';
  return country ?? iso2 ?? '';
}

export default async function AccountOrderPage({
  params,
  searchParams,
}: {
  params: { orderNumber: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const confirmed = searchParams.confirmed === '1';

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/auth/login?next=/account/orders/${params.orderNumber}${confirmed ? '?confirmed=1' : ''}`,
    );
  }

  const [order, avSub] = await Promise.all([
    prisma.order.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        items: {
          include: {
            product: { include: { builder: true } },
            unit: true,
          },
        },
      },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: user.userId },
      select: { status: true },
    }),
  ]);
  if (!order) notFound();
  if (order.userId !== user.userId) notFound();

  if (confirmed) {
    return renderConfirmed(order);
  }

  return renderStandard(order, avSub?.status ?? null);
}

// ─────────────────────────────────────────────────────────────
// Standard order-detail layout (Batch 4 · artefact 15)
// ─────────────────────────────────────────────────────────────

function renderStandard(
  order: LoadedOrder,
  avCareStatus:
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'paused'
    | 'cancelled'
    | 'expired'
    | null,
) {
  const subtotalGbp = Number(order.subtotalGbp);
  const shippingGbp = Number(order.shippingGbp);
  const taxGbp = Number(order.taxGbp);
  const discountGbp = Number(order.discountGbp);
  const totalGbp = Number(order.totalGbp);

  const stageOrder = [
    'pending_payment',
    'paid',
    'queued',
    'in_build',
    'qc',
    'shipped',
    'delivered',
  ];
  const currentIdx = stageOrder.indexOf(order.status);
  const stages = [
    {
      key: 'paid',
      label: 'Paid',
      timestamp: order.paymentCapturedAt?.toISOString() ?? null,
    },
    {
      key: 'queued',
      label: 'Queued',
      timestamp: order.queuedForBuildAt?.toISOString() ?? null,
    },
    {
      key: 'in_build',
      label: 'In build',
      timestamp: order.queuedForBuildAt?.toISOString() ?? null,
    },
    { key: 'qc', label: 'QC', timestamp: null as string | null },
    {
      key: 'shipped',
      label: 'Shipped',
      timestamp: order.shippedAt?.toISOString() ?? null,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      timestamp: order.deliveredAt?.toISOString() ?? null,
    },
  ];

  const ship = toAddress(order.shippingAddress);
  const bill = toAddress(order.billingAddress);
  const canReturn = order.status === 'delivered';

  return (
    <AccountShell activeKey="orders" avCareStatus={avCareStatus}>
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
          href="/account/orders"
          className="bav-hover-opa"
          style={{ color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          Orders
        </Link>
        <span style={{ margin: '0 10px', color: 'var(--ink-30)' }}>/</span>
        <span style={{ color: 'var(--ink)' }}>{order.orderNumber}</span>
      </div>

      <h1
        className="font-display"
        style={{
          fontWeight: 300,
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          letterSpacing: '-0.01em',
          lineHeight: 1.06,
          margin: 0,
          marginBottom: 8,
        }}
      >
        Your <span className="bav-italic">order</span>.
      </h1>
      <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 12 }}>
        {order.orderNumber}
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-60)', marginBottom: 56 }}>
        Placed {formatDateLong(order.createdAt)}
      </div>

      {/* Status timeline */}
      <section style={{ marginBottom: 72 }}>
        <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 24 }}>
          — Status
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
            borderTop: '1px solid var(--ink-10)',
            borderBottom: '1px solid var(--ink-10)',
            padding: '28px 0',
          }}
        >
          {stages.map((s, i) => {
            const done = stageOrder.indexOf(s.key) < currentIdx;
            const current = s.key === order.status;
            const tone = done
              ? 'var(--ink)'
              : current
                ? 'var(--ink)'
                : 'var(--ink-30)';
            return (
              <div
                key={s.key}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: 4 }}>
                  {current ? (
                    <span className="bav-pulse" aria-hidden="true" />
                  ) : (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: done ? 'var(--ink)' : 'var(--ink-30)',
                      }}
                    />
                  )}
                  {i < stages.length - 1 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        right: 0,
                        top: 3,
                        height: 1,
                        background: done ? 'var(--ink)' : 'var(--ink-10)',
                      }}
                    />
                  )}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: tone,
                    fontWeight: current ? 500 : 400,
                  }}
                >
                  {s.label}
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-60)' }}>
                  {s.timestamp ? formatDateShort(s.timestamp) : current ? 'In progress' : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-column: items + summary */}
      <div className="bav-order-grid">
        <div>
          <section>
            <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 20 }}>
              — The build
            </div>
            <h2
              className="font-display"
              style={{
                fontWeight: 300,
                fontSize: 'clamp(22px, 2vw, 28px)',
                lineHeight: 1.2,
                margin: 0,
                marginBottom: 32,
                maxWidth: 540,
              }}
            >
              {order.items.length === 1
                ? 'One item on this order.'
                : `${order.items.length} items on this order.`}
            </h2>

            <div>
              {order.items.map((it, i) => {
                const builder = it.product.builder;
                const buildNumber = buildNumberFromSku(it.product.sku);
                return (
                  <div
                    key={it.orderItemId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 1fr auto',
                      gap: 28,
                      padding: '28px 0',
                      borderTop: '1px solid var(--ink-10)',
                      borderBottom: i === order.items.length - 1 ? '1px solid var(--ink-10)' : 'none',
                      alignItems: 'start',
                    }}
                  >
                    {/* Canvas thumbnail */}
                    <div
                      className="bav-canvas"
                      style={{
                        aspectRatio: '4 / 5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        className="font-display bav-italic"
                        style={{
                          fontWeight: 300,
                          fontSize: 'clamp(48px, 8vw, 86px)',
                          lineHeight: 1,
                          color: 'var(--ink)',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <span style={{ fontSize: '0.5em', verticalAlign: 'super', marginRight: 2 }}>№</span>
                        {buildNumber}
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/product/${it.product.slug}`}
                        className="bav-hover-opa"
                        style={{ textDecoration: 'none', color: 'var(--ink)' }}
                      >
                        <div
                          className="font-mono"
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-60)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            marginBottom: 8,
                          }}
                        >
                          {it.product.sku}
                        </div>
                        <div style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 10 }}>
                          {it.product.title}
                        </div>
                      </Link>

                      {builder && (
                        <div style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 8 }}>
                          Built by{' '}
                          <Link
                            href={`/builders/${builder.builderCode}`}
                            className="bav-hover-opa"
                            style={{
                              color: 'var(--ink)',
                              textDecoration: 'none',
                              borderBottom: '1px solid var(--ink-10)',
                            }}
                          >
                            {builder.displayName}
                          </Link>
                          <span style={{ color: 'var(--ink-30)' }}> · {builder.builderCode}</span>
                        </div>
                      )}

                      {it.unit?.serialNumber && (
                        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-60)' }}>
                          Serial {it.unit.serialNumber}
                        </div>
                      )}

                      {canReturn && (
                        <div style={{ marginTop: 18 }}>
                          <Link
                            href={`/returns/new?orderItem=${it.orderItemId}`}
                            className="bav-underline font-mono"
                            style={{
                              fontSize: 11,
                              textTransform: 'uppercase',
                              letterSpacing: '0.18em',
                              color: 'var(--ink)',
                              textDecoration: 'none',
                            }}
                          >
                            Start a return <span className="arrow">→</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontSize: 14 }}>
                        £{Number(it.pricePerUnitGbp).toFixed(2)}
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 11, color: 'var(--ink-60)', marginTop: 4 }}
                      >
                        Qty {it.qty}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Addresses */}
          <section style={{ marginTop: 72 }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 20 }}>
              — Addresses
            </div>
            <div className="bav-address-grid-2">
              <AddressCard title="Shipping" address={ship} />
              <AddressCard title="Billing" address={bill} />
            </div>
          </section>

          {order.customerNotes && (
            <section style={{ marginTop: 48 }}>
              <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 12 }}>
                — Your notes
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', margin: 0, maxWidth: 540 }}>
                &ldquo;{order.customerNotes}&rdquo;
              </p>
            </section>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="bav-order-summary" style={{ position: 'sticky', top: 96 }}>
          <div style={{ border: '1px solid var(--ink-10)', padding: 28 }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 20 }}>
              — Summary
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>Subtotal</div>
              <div className="font-mono" style={{ fontSize: 13 }}>
                £{subtotalGbp.toFixed(2)}
              </div>

              <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>Shipping</div>
              <div className="font-mono" style={{ fontSize: 13 }}>
                £{shippingGbp.toFixed(2)}
              </div>

              <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>VAT</div>
              <div className="font-mono" style={{ fontSize: 13 }}>
                £{taxGbp.toFixed(2)}
              </div>

              {discountGbp > 0 && (
                <>
                  <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>Discount</div>
                  <div className="font-mono" style={{ fontSize: 13 }}>
                    −£{discountGbp.toFixed(2)}
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                borderTop: '1px solid var(--ink-10)',
                paddingTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'baseline',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 13 }}>Total</div>
              <div className="font-mono" style={{ fontSize: 18 }}>
                £{totalGbp.toFixed(2)}
              </div>
            </div>

            {order.paymentMethod && (
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-60)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 20,
                }}
              >
                Paid via {paymentLabel(order.paymentMethod)}
              </div>
            )}

            <Link
              href="/support"
              className="bav-underline font-mono"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'var(--ink-60)',
                textDecoration: 'none',
                marginTop: 20,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              Need help with this order? <span className="arrow">→</span>
            </Link>
          </div>
        </aside>
      </div>
    </AccountShell>
  );
}

function AddressCard({ title, address }: { title: string; address: Addr | null }) {
  if (!address) return null;
  return (
    <div style={{ borderTop: '1px solid var(--ink-10)', paddingTop: 16 }}>
      <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>
        {address.line1}
        <br />
        {address.line2 && (
          <>
            {address.line2}
            <br />
          </>
        )}
        {address.city}
        {address.region || address.county ? `, ${address.region ?? address.county}` : ''}
        <br />
        <span className="font-mono" style={{ fontSize: 12 }}>
          {address.postcode}
        </span>
        , {formatCountry(address.countryIso2, address.country)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Confirmed branch (artefact 9, maintained by Agent B)
// ─────────────────────────────────────────────────────────────

function renderConfirmed(order: LoadedOrder) {
  const items = order.items;
  const addr = toAddress(order.shippingAddress);
  const placedDate = order.createdAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const builderNames = Array.from(new Set(items.map((i) => i.product.builder.displayName)));
  const builderLine =
    builderNames.length === 1
      ? `${builderNames[0]} has been assigned your build and will begin picking components within the hour.`
      : builderNames.length > 1
        ? `${builderNames.join(', ')} have been assigned to your order and will begin within the hour.`
        : 'Our team will begin your build within the hour.';

  const firstBuilderCode = items[0]?.product.builder.builderCode ?? null;
  const totalGbp = Number(order.totalGbp);
  const shippingGbp = Number(order.shippingGbp);

  const steps = [
    {
      n: '01',
      title: 'Notified',
      body: 'Your builder has been assigned and will begin picking components within the hour.',
    },
    {
      n: '02',
      title: 'Built',
      body: 'Each component is scanned out of stock and bound to your serial. Build and bench-test take 24–48 hours. Benchmarks go on your birth certificate.',
    },
    {
      n: '03',
      title: 'Dispatched',
      body: 'Packaged, labelled with your details, and handed to DPD. Live tracking and ETA text to your phone.',
    },
  ];

  return (
    <main>
      <OrderConfirmedClient orderNumber={order.orderNumber} />

      {/* Hero */}
      <section className="border-b border-ink-10">
        <div className="bav-page-pad mx-auto max-w-page px-12 pb-20 pt-24">
          <div className="bav-fade">
            <div className="bav-label mb-12 flex items-center gap-3.5 text-ink-60">
              <span className="bav-pulse" />
              <span>Order received · {placedDate}</span>
            </div>

            <h1 className="m-0 mb-12 font-display text-[clamp(64px,10vw,152px)] font-light leading-[0.92] tracking-[-0.04em]">
              Thank <span className="bav-italic">you</span>.
            </h1>

            <div className="mb-2">
              <div className="bav-label mb-2.5 text-ink-60">Order number</div>
              <div className="font-mono text-[22px] tracking-[-0.01em]">{order.orderNumber}</div>
            </div>

            <div className="mt-1.5 font-mono text-[12px] text-ink-30">
              A confirmation has been sent to your email address.
            </div>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <section>
        <div className="bav-page-pad mx-auto max-w-page px-12 pb-32 pt-20">
          <div className="bav-confirmed-grid">
            <div>
              <div className="mb-16">
                <div className="bav-label mb-7 text-ink-60">— What happens next</div>
                {steps.map((step) => (
                  <div key={step.n} className="flex gap-7 border-t border-ink-10 py-6">
                    <span className="shrink-0 pt-1 font-mono text-[11px] text-ink-30">{step.n}</span>
                    <div>
                      <div className="mb-1.5 text-[15px] font-medium">{step.title}</div>
                      <div className="text-[14px] leading-[1.6] text-ink-60">{step.body}</div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-ink-10" />
              </div>

              <div className="mb-12 bg-paper-2 p-8">
                <div className="bav-label mb-4 text-ink-60">— Your build team</div>
                <p className="m-0 text-[16px] leading-[1.6] text-ink">{builderLine}</p>
                {builderNames.length === 1 && firstBuilderCode && (
                  <div className="mt-4">
                    <Link
                      href={`/builders/${firstBuilderCode}`}
                      className="bav-underline text-[13px] text-ink-60 no-underline"
                    >
                      <span>See {builderNames[0]}&rsquo;s profile</span>
                      <span className="arrow">→</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-10">
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="bav-underline text-[14px] text-ink no-underline"
                >
                  <span>Track your order</span>
                  <span className="arrow">→</span>
                </Link>
                <Link href="/shop" className="bav-underline text-[14px] text-ink-60 no-underline">
                  <span>Continue shopping</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>

            <div>
              <div className="mb-8">
                <div className="bav-label mb-5 text-ink-60">Items ordered</div>
                {items.map((item, idx) => {
                  const buildNumber = buildNumberFromSku(item.product.sku);
                  const lineTotal = Number(item.pricePerUnitGbp) * item.qty;
                  return (
                    <div
                      key={item.orderItemId}
                      className={`flex items-start gap-4 pb-5 ${
                        idx === 0 ? 'pt-0' : 'border-t border-ink-10 pt-5'
                      }`}
                    >
                      <div className="bav-canvas relative shrink-0" style={{ width: 48, height: 60 }}>
                        <div className="absolute inset-0 flex select-none items-center justify-center font-display text-[20px] font-light italic tracking-[-0.03em] text-[rgba(23,20,15,0.14)]">
                          {buildNumber}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="mb-1 overflow-hidden text-[14px] font-medium leading-[1.3]"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.product.title}
                        </div>
                        <div className="bav-label text-ink-60">
                          Built by {item.product.builder.displayName}
                        </div>
                      </div>
                      <div className="shrink-0 font-mono text-[14px]">
                        £{lineTotal.toLocaleString('en-GB')}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-baseline justify-between border-t border-ink-10 pt-5">
                  <div>
                    <span className="text-[14px] font-medium">Total</span>
                    <span className="bav-label ml-2.5 text-ink-30">
                      Shipping: {shippingGbp === 0 ? 'Free' : `£${shippingGbp.toLocaleString('en-GB')}`}
                    </span>
                  </div>
                  <span className="font-mono text-[18px]">£{totalGbp.toLocaleString('en-GB')}</span>
                </div>
              </div>

              {addr && (
                <div className="border-t border-ink-10 pt-6">
                  <div className="bav-label mb-4 text-ink-60">Shipping to</div>
                  <div className="text-[14px] leading-[2] text-ink">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}
                    <br />
                    {addr.city}
                    {addr.region ?? addr.county ? `, ${addr.region ?? addr.county}` : ''}
                    <br />
                    {addr.postcode}
                    <br />
                    {formatCountry(addr.countryIso2, addr.country)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Type-only helper so both branches share the same inferred order shape.
type LoadedOrder = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.order.findUnique<{
        where: { orderNumber: string };
        include: {
          items: {
            include: {
              product: { include: { builder: true } };
              unit: true;
            };
          };
        };
      }>
    >
  >
>;

function buildNumberFromSku(sku: string): string {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return '000';
  return m[1].padStart(3, '0').slice(-3);
}

function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    stripe_card: 'card',
    stripe_klarna: 'Klarna',
    stripe_clearpay: 'Clearpay',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    bank_transfer: 'bank transfer',
  };
  return map[method] ?? method;
}

function formatDateLong(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatDateShort(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}
