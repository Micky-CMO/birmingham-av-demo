import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { orderNumber: string };
}): Promise<Metadata> {
  return {
    title: `Invoice ${params.orderNumber} — Birmingham AV`,
    description: `VAT invoice for order ${params.orderNumber}.`,
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

function formatDateLong(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function addressLines(a: Addr | null): string[] {
  if (!a) return [];
  const out: string[] = [];
  if (a.line1) out.push(a.line1);
  if (a.line2) out.push(a.line2);
  if (a.city) out.push(a.city);
  if (a.postcode) out.push(a.postcode);
  const country = a.countryIso2 === 'GB' ? 'United Kingdom' : a.country ?? a.countryIso2 ?? '';
  if (country) out.push(country);
  return out;
}

function paymentLabel(method: string | null): string {
  if (!method) return '—';
  const map: Record<string, string> = {
    stripe_card: 'Card',
    stripe_klarna: 'Klarna',
    stripe_clearpay: 'Clearpay',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    bank_transfer: 'Bank transfer',
  };
  return map[method] ?? method;
}

export default async function InvoicePage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?next=/account/orders/${params.orderNumber}/invoice`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: { include: { product: { include: { builder: true } } } },
    },
  });
  if (!order) notFound();
  if (order.userId !== user.userId) notFound();

  const ship = toAddress(order.shippingAddress);
  const bill = toAddress(order.billingAddress) ?? ship;

  const subtotalExVat = order.items.reduce(
    (s, i) => s + Number(i.pricePerUnitGbp) * i.qty,
    0,
  );
  const discountExVat = Number(order.discountGbp);
  const shippingExVat = Number(order.shippingGbp);
  const vatAmount = Number(order.taxGbp);
  const totalIncVat = Number(order.totalGbp);

  const vatRateLabel =
    subtotalExVat - discountExVat + shippingExVat > 0
      ? ((vatAmount / (subtotalExVat - discountExVat + shippingExVat)) * 100).toFixed(0)
      : '20';

  const invoiceNumber = order.orderNumber;
  const issueDate = formatDateLong(order.createdAt);
  const capturedAt = order.paymentCapturedAt ? formatDateTime(order.paymentCapturedAt) : null;
  const transactionId = order.paymentIntentId ?? '—';
  const paymentMethod = paymentLabel(order.paymentMethod);

  return (
    <AccountShell activeKey="orders">
      <style>{`
        @media print {
          body { background: white !important; }
          .bav-invoice-controls, .bav-account-sidebar, .bav-account-tabbar { display: none !important; }
          .bav-account-main { padding: 0 !important; }
          .bav-account-shell { display: block !important; }
          .invoice-sheet {
            margin: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            min-height: 100vh !important;
          }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      {/* Breadcrumb + controls */}
      <div className="bav-invoice-controls mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-60">
          <Link href="/account/orders" className="bav-hover-opa text-inherit no-underline">
            Orders
          </Link>
          <span className="mx-[10px] text-ink-30">/</span>
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="bav-hover-opa text-inherit no-underline"
          >
            {order.orderNumber}
          </Link>
          <span className="mx-[10px] text-ink-30">/</span>
          <span className="text-ink">Invoice</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/account/orders/${order.orderNumber}/invoice.pdf`}
            className="bav-cta-secondary"
          >
            Download PDF
          </Link>
        </div>
      </div>

      {/* A4 SHEET */}
      <div
        className="invoice-sheet mx-auto bg-paper text-ink"
        style={{
          width: '210mm',
          maxWidth: '100%',
          minHeight: '297mm',
          padding: '20mm 18mm',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
      >
        {/* HEAD */}
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <div>
            <h1 className="m-0 mb-6 font-display text-[40px] font-light leading-none tracking-[-0.02em]">
              Invoice
            </h1>
            <div
              className="grid gap-x-5 gap-y-2 text-[11px]"
              style={{ gridTemplateColumns: 'auto 1fr' }}
            >
              <InvLabel>Invoice №</InvLabel>
              <span className="font-mono text-[11px] text-ink">{invoiceNumber}</span>
              <InvLabel>Order №</InvLabel>
              <span className="font-mono text-[11px] text-ink">{order.orderNumber}</span>
              <InvLabel>Issued</InvLabel>
              <span className="font-mono text-[11px] text-ink">{issueDate}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-3 font-display text-[22px] font-light">
              Birmingham<span className="bav-italic">AV</span>
            </div>
            <div className="text-[10px] leading-[1.65] text-ink-60">
              <div>Unit 14, Fazeley Street Workshops</div>
              <div>Digbeth, Birmingham</div>
              <div>B5 5RS</div>
              <div>United Kingdom</div>
            </div>
            <div className="mt-[14px] font-mono text-[10px] leading-[1.65] text-ink-60">
              <div>Company № 09281743</div>
              <div>VAT № GB 217 8934 12</div>
            </div>
            <div className="mt-[10px] text-[10px] leading-[1.65] text-ink-60">
              <div>accounts@birminghamav.co.uk</div>
              <div>0121 448 7700</div>
            </div>
          </div>
        </div>

        {/* ADDRESSES */}
        <div
          className="mb-12 grid gap-12 border-y border-ink-10 py-6 md:grid-cols-2"
        >
          <AddressBlock title="Billed to" address={bill} />
          <AddressBlock title="Shipped to" address={ship} />
        </div>

        {/* LINE ITEMS */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <InvTh width="18%">SKU</InvTh>
              <InvTh width="46%">Description</InvTh>
              <InvTh width="8%" align="right">
                Qty
              </InvTh>
              <InvTh width="14%" align="right">
                Unit · ex VAT
              </InvTh>
              <InvTh width="14%" align="right">
                Total · ex VAT
              </InvTh>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const lineTotal = Number(item.pricePerUnitGbp) * item.qty;
              return (
                <tr key={item.orderItemId} className="border-b border-ink-10">
                  <td
                    className="py-[18px] align-top font-mono text-[10px] tracking-[0.06em] text-ink-60"
                  >
                    {item.product.sku}
                  </td>
                  <td className="py-[18px] align-top text-[11px] leading-[1.5]">
                    <div className="mb-1 text-[12px] font-medium">{item.product.title}</div>
                    {item.product.subtitle && (
                      <div className="text-[10px] leading-[1.5] text-ink-60">
                        {item.product.subtitle} · Built by {item.product.builder.builderCode}
                      </div>
                    )}
                  </td>
                  <td className="py-[18px] text-right align-top font-mono text-[11px] tabular-nums">
                    {item.qty}
                  </td>
                  <td className="py-[18px] text-right align-top font-mono text-[11px] tabular-nums">
                    £{fmt(Number(item.pricePerUnitGbp))}
                  </td>
                  <td className="py-[18px] text-right align-top font-mono text-[11px] font-medium tabular-nums">
                    £{fmt(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="mb-12 mt-8 flex justify-end">
          <div className="w-[320px]">
            <div
              className="grid gap-x-6 gap-y-3 text-[11px]"
              style={{ gridTemplateColumns: '1fr auto' }}
            >
              <div className="text-ink-60">Subtotal (ex VAT)</div>
              <div className="text-right font-mono tabular-nums text-ink">
                £{fmt(subtotalExVat)}
              </div>
              {discountExVat > 0 && (
                <>
                  <div className="text-ink-60">Discount</div>
                  <div className="text-right font-mono tabular-nums text-ink">
                    −£{fmt(discountExVat)}
                  </div>
                </>
              )}
              <div className="text-ink-60">Shipping</div>
              <div className="text-right font-mono tabular-nums text-ink">
                {shippingExVat === 0 ? 'Free' : `£${fmt(shippingExVat)}`}
              </div>
              <div className="text-ink-60">VAT @ {vatRateLabel}%</div>
              <div className="text-right font-mono tabular-nums text-ink">£{fmt(vatAmount)}</div>
            </div>

            <div className="my-[18px] h-px bg-ink" />

            <div
              className="grid items-baseline gap-6"
              style={{ gridTemplateColumns: '1fr auto' }}
            >
              <div className="font-display text-[14px] font-medium">Total (inc VAT)</div>
              <div className="text-right font-mono text-[20px] font-medium tabular-nums text-ink">
                £{fmt(totalIncVat)}
              </div>
            </div>
            <div className="mt-[6px] text-right font-mono text-[10px] tracking-[0.06em] text-ink-30">
              GBP
            </div>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="mb-12 border-t border-ink-10 pt-6">
          <div className="mb-3">
            <InvLabel>— Payment</InvLabel>
          </div>
          <div
            className="grid gap-x-6 gap-y-[6px] text-[11px]"
            style={{ gridTemplateColumns: 'auto 1fr' }}
          >
            <div className="text-ink-60">Method</div>
            <div className="text-ink">{paymentMethod}</div>
            <div className="text-ink-60">Captured</div>
            <div className="font-mono text-[11px] text-ink">{capturedAt ?? 'Not yet captured'}</div>
            <div className="text-ink-60">Reference</div>
            <div className="font-mono text-[10px] tracking-[0.04em] text-ink-60">
              {transactionId}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-ink-10 pt-5">
          <div
            className="grid items-end gap-6 md:grid-cols-2"
          >
            <div className="font-mono text-[9px] leading-[1.6] tracking-[0.04em] text-ink-30">
              Birmingham AV Ltd · Registered in England and Wales · 09281743
              <br />
              VAT GB 217 8934 12
            </div>
            <div
              className="text-right font-display text-[13px] italic text-ink-60"
            >
              Thank you for your order.
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}

// ---- tiny helpers ----

function InvLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-30">
      {children}
    </span>
  );
}

function InvTh({
  children,
  width,
  align = 'left',
}: {
  children: React.ReactNode;
  width: string;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className="border-b border-ink pb-[10px] pt-[14px] font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-ink-60"
      style={{ width, textAlign: align }}
    >
      {children}
    </th>
  );
}

function AddressBlock({ title, address }: { title: string; address: Addr | null }) {
  const lines = addressLines(address);
  return (
    <div>
      <div className="mb-3">
        <InvLabel>— {title}</InvLabel>
      </div>
      {lines.length > 0 ? (
        <div className="text-[11px] leading-[1.65] text-ink-60">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-ink-30">—</div>
      )}
    </div>
  );
}
