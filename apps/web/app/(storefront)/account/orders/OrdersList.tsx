'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type AccountOrder = {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalGbp: number;
  items: Array<{ title: string; qty: number; buildNumber: string | null }>;
};

const FILTERS: Array<{ key: 'all' | 'in_progress' | 'delivered' | 'cancelled'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const IN_PROGRESS = new Set(['queued', 'in_build', 'qc', 'shipped', 'paid', 'pending_payment']);

export function OrdersList({ orders }: { orders: AccountOrder[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (filter === 'all') return true;
        if (filter === 'in_progress') return IN_PROGRESS.has(o.status);
        if (filter === 'delivered') return o.status === 'delivered';
        if (filter === 'cancelled') return o.status === 'cancelled' || o.status === 'refunded';
        return true;
      }),
    [orders, filter],
  );

  return (
    <>
      {/* Filter pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          marginBottom: 32,
          borderTop: '1px solid var(--ink-10)',
          borderBottom: '1px solid var(--ink-10)',
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="bav-hover-opa"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '18px 20px',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                cursor: 'pointer',
                color: active ? 'var(--ink)' : 'var(--ink-60)',
                position: 'relative',
              }}
            >
              {f.label}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -1,
                    height: 1,
                    background: 'var(--ink)',
                  }}
                />
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div
          className="font-mono"
          style={{
            padding: '18px 0',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--ink-60)',
            alignSelf: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {filtered.map((o, i) => (
            <OrderRow key={o.orderId} order={o} isLast={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </>
  );
}

function OrderRow({ order, isLast }: { order: AccountOrder; isLast: boolean }) {
  const statusMeta = getStatusMeta(order.status);
  const tone = getToneColors(statusMeta.tone);
  const firstBuild = order.items.find((it) => it.buildNumber);
  const date = new Date(order.createdAt);

  return (
    <Link href={`/account/orders/${order.orderNumber}`} className={`bav-order-row ${isLast ? 'is-last' : ''}`}>
      <div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}
        >
          {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 11, color: 'var(--ink-60)', fontVariantNumeric: 'tabular-nums' }}
        >
          {date.getFullYear()}
        </div>
      </div>

      <div>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--ink-60)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 6,
          }}
        >
          {order.orderNumber}
          {firstBuild && (
            <span style={{ marginLeft: 10, color: 'var(--ink-30)' }}>· Build {firstBuild.buildNumber}</span>
          )}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.4 }}>
          {order.items[0]?.title ?? 'Order'}
          {order.items.length > 1 && (
            <span style={{ color: 'var(--ink-60)' }}>
              {' '}
              + {order.items.length - 1} more item{order.items.length - 1 === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {tone.pulse ? (
          <span className="bav-pulse" aria-hidden="true" />
        ) : (
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: tone.dotColor,
            }}
          />
        )}
        <div
          className="font-mono"
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: tone.textColor,
          }}
        >
          {statusMeta.label}
        </div>
      </div>

      <div
        className="font-mono row-total"
        style={{ fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
      >
        £{order.totalGbp.toFixed(2)}
      </div>

      <div
        className="font-mono row-view"
        style={{ fontSize: 12, color: 'var(--ink-60)', textAlign: 'right' }}
      >
        View →
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '72px 48px',
        border: '1px solid var(--ink-10)',
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        columnGap: 32,
      }}
    >
      <div style={{ gridColumn: 'span 4' }}>
        <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
          — No orders
        </div>
      </div>
      <div style={{ gridColumn: 'span 8', maxWidth: 520 }}>
        <div
          className="font-display"
          style={{ fontWeight: 300, fontSize: 28, lineHeight: 1.2, marginBottom: 16 }}
        >
          Nothing to show here.
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-60)', lineHeight: 1.6, margin: 0, marginBottom: 24 }}>
          When you place an order it will appear in this list. Your build number, status, and invoice will all
          live on the detail page.
        </p>
        <Link
          href="/shop"
          className="bav-underline font-mono"
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
        >
          Browse the catalogue <span className="arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

function getStatusMeta(status: string): { label: string; tone: 'warn' | 'neutral' | 'active' | 'done' | 'muted' } {
  const map: Record<string, { label: string; tone: 'warn' | 'neutral' | 'active' | 'done' | 'muted' }> = {
    pending_payment: { label: 'Awaiting payment', tone: 'warn' },
    paid: { label: 'Paid', tone: 'neutral' },
    queued: { label: 'Queued', tone: 'active' },
    in_build: { label: 'In build', tone: 'active' },
    qc: { label: 'QC', tone: 'active' },
    shipped: { label: 'Shipped', tone: 'active' },
    delivered: { label: 'Delivered', tone: 'done' },
    cancelled: { label: 'Cancelled', tone: 'muted' },
    refunded: { label: 'Refunded', tone: 'muted' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

type ToneColor = { dotColor: string; textColor: string; pulse?: boolean };

function getToneColors(tone: string): ToneColor {
  const ink = 'var(--ink)';
  const ink60 = 'var(--ink-60)';
  const ink30 = 'var(--ink-30)';
  const map: Record<string, ToneColor> = {
    warn: { dotColor: '#B88B00', textColor: ink },
    neutral: { dotColor: ink60, textColor: ink },
    active: { dotColor: '#1EB53A', textColor: ink, pulse: true },
    done: { dotColor: ink60, textColor: ink60 },
    muted: { dotColor: ink30, textColor: ink60 },
  };
  return map[tone] ?? { dotColor: ink60, textColor: ink };
}
