'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type AdminOrder = {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  totalGbp: number;
  status: string;
  paymentMethod: string | null;
  builderCode: string | null;
};

type StatusKey =
  | 'all'
  | 'pending_payment'
  | 'paid'
  | 'queued'
  | 'in_build'
  | 'qc'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

const STATUS_STYLE: Record<
  string,
  { label: string; color: string; dot?: boolean }
> = {
  pending_payment: { label: 'Pending payment', color: 'var(--ink-60)' },
  paid: { label: 'Paid', color: 'var(--ink)' },
  queued: { label: 'Queued', color: 'var(--ink)' },
  in_build: { label: 'In build', color: 'var(--ink)', dot: true },
  qc: { label: 'QC', color: 'var(--ink)' },
  shipped: { label: 'Shipped', color: 'var(--ink)' },
  delivered: { label: 'Delivered', color: 'var(--ink-60)' },
  cancelled: { label: 'Cancelled', color: 'var(--ink-30)' },
  refunded: { label: 'Refunded', color: 'var(--ink-30)' },
  draft: { label: 'Draft', color: 'var(--ink-30)' },
};

const ALL_STATUSES: StatusKey[] = [
  'all',
  'pending_payment',
  'paid',
  'queued',
  'in_build',
  'qc',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

function gbp(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrdersTable({
  orders,
  totalCount,
  builderOptions,
}: {
  orders: AdminOrder[];
  totalCount: number;
  builderOptions: Array<{ code: string; name: string }>;
}) {
  const [status, setStatus] = useState<StatusKey>('all');
  const [search, setSearch] = useState('');
  const [builder, setBuilder] = useState('all');
  const [payment, setPayment] = useState('all');
  const [range, setRange] = useState('30d');

  const counts = useMemo(() => {
    const map = new Map<StatusKey, number>();
    map.set('all', orders.length);
    for (const o of orders) {
      const k = o.status as StatusKey;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (builder !== 'all' && o.builderCode !== builder) return false;
      if (payment !== 'all' && o.paymentMethod !== payment) return false;
      if (q) {
        const hay = `${o.orderNumber} ${o.customerName} ${o.customerEmail}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, status, builder, payment, search]);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 48px 0' }}>
      {/* Header */}
      <div className="mb-9 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — Admin
          </span>
          <h1
            className="m-0 mt-2 font-light"
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontSize: 44,
              letterSpacing: '-0.01em',
            }}
          >
            Orders, <span className="bav-italic">all of them</span>.
          </h1>
          <p className="mt-3 text-[14px]" style={{ color: 'var(--ink-60)' }}>
            {filtered.length} shown · {totalCount} in last {range === '30d' ? '30 days' : range === '7d' ? '7 days' : range === '90d' ? '90 days' : range === '12m' ? '12 months' : 'all time'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bav-cta-secondary" style={{ width: 'auto', padding: '17px 36px' }}>
            Export CSV
          </button>
          <button className="bav-cta" style={{ width: 'auto', padding: '18px 36px' }}>
            New manual order
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div
        className="mb-6 flex gap-7 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--ink-10)' }}
      >
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={'bav-tab-link whitespace-nowrap pb-3' + (status === s ? ' active' : '')}
          >
            {s === 'all' ? 'All' : STATUS_STYLE[s]?.label ?? s}{' '}
            <span className="ml-1 font-mono text-[11px]" style={{ color: 'var(--ink-30)' }}>
              {counts.get(s) ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div
        className="mb-6 grid gap-6 pb-6 pt-5"
        style={{
          gridTemplateColumns: 'minmax(240px,2fr) 1fr 1fr 1fr',
          borderBottom: '1px solid var(--ink-10)',
        }}
      >
        <div>
          <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
            Search
          </label>
          <input
            className="bav-input"
            placeholder="Order number, customer, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
            Range
          </label>
          <select
            className="bav-input"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div>
          <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
            Builder
          </label>
          <select
            className="bav-input"
            value={builder}
            onChange={(e) => setBuilder(e.target.value)}
          >
            <option value="all">All builders</option>
            {builderOptions.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} · {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
            Payment
          </label>
          <select
            className="bav-input"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
          >
            <option value="all">All methods</option>
            <option value="stripe_card">Card · Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="manual">Invoice · BACS</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mb-12" style={{ border: '1px solid var(--ink-10)' }}>
        <div
          className="grid items-center px-5 py-3.5"
          style={{
            gridTemplateColumns: '200px 110px 1.6fr 80px 120px 150px 100px 80px',
            background: 'var(--paper-2)',
            borderBottom: '1px solid var(--ink-10)',
          }}
        >
          {['Order', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Builder', 'View'].map((h, i) => (
            <span
              key={h}
              className="bav-label"
              style={{
                color: 'var(--ink-60)',
                textAlign: i === 3 || i === 4 ? 'right' : i === 7 ? 'right' : 'left',
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {filtered.map((o, i) => {
          const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.draft ?? { label: o.status, color: 'var(--ink-60)' };
          return (
            <Link
              key={o.orderNumber}
              href={`/admin/orders/${o.orderNumber}`}
              className="bav-admin-row grid items-center px-5 py-[22px]"
              style={{
                gridTemplateColumns: '200px 110px 1.6fr 80px 120px 150px 100px 80px',
                borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--ink-10)',
              }}
            >
              <span className="font-mono text-[13px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {o.orderNumber}
              </span>
              <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)', fontVariantNumeric: 'tabular-nums' }}>
                {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
              <span>
                <span className="block text-[14px]">{o.customerName || 'Customer'}</span>
                <span className="text-[12px]" style={{ color: 'var(--ink-60)' }}>
                  {o.customerEmail}
                </span>
              </span>
              <span className="font-mono text-[13px] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {o.itemsCount}
              </span>
              <span className="font-mono text-[14px] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {gbp(o.totalGbp)}
              </span>
              <span className="text-[13px]" style={{ color: s.color }}>
                {s.dot && (
                  <span
                    className="bav-pulse"
                    style={{ marginRight: 10, verticalAlign: 'middle' }}
                  />
                )}
                {s.label}
              </span>
              <span
                className="font-mono text-[12px]"
                style={{ color: o.builderCode ? 'var(--ink-60)' : 'var(--ink-30)' }}
              >
                {o.builderCode ?? '—'}
              </span>
              <span
                className="bav-label bav-underline justify-self-end"
                style={{ color: 'var(--ink)' }}
              >
                View <span className="arrow">→</span>
              </span>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center" style={{ padding: '60px 20px' }}>
            <p
              className="m-0 italic"
              style={{
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                fontSize: 22,
                fontWeight: 300,
                color: 'var(--ink-60)',
              }}
            >
              No orders match.
            </p>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--ink-30)' }}>
              Widen the date range or clear a filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
