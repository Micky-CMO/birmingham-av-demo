'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type OrderStatus = 'queued' | 'in_build' | 'qc' | 'shipped' | 'delivered' | 'cancelled';

export function OrderStatusButtons({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const transitions: { key: OrderStatus; label: string; danger?: boolean; available: boolean }[] = [
    { key: 'qc', label: 'Mark · QC', available: status === 'in_build' },
    { key: 'shipped', label: 'Mark · Shipped', available: status === 'qc' || status === 'in_build' },
    { key: 'delivered', label: 'Mark · Delivered', available: status === 'shipped' },
    {
      key: 'cancelled',
      label: 'Cancel order',
      danger: true,
      available: !['delivered', 'cancelled', 'refunded', 'shipped'].includes(status),
    },
  ];

  async function transition(next: OrderStatus) {
    setPending(next);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      {transitions
        .filter((t) => t.available)
        .map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => transition(t.key)}
            className="bav-cta-secondary"
            disabled={pending !== null}
            style={{
              width: 'auto',
              padding: '14px 22px',
              color: t.danger ? 'var(--ink-30)' : 'var(--ink)',
              opacity: pending === t.key ? 0.6 : 1,
            }}
          >
            {pending === t.key ? '…' : t.label}
          </button>
        ))}
    </>
  );
}

export function OrderCustomerMessageButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bav-cta"
        style={{ width: 'auto', padding: '14px 22px' }}
      >
        Message customer
      </button>
      {open && (
        <>
          <div className="bav-slideover-backdrop" onClick={() => setOpen(false)} />
          <aside className="bav-slideover-panel" role="dialog" aria-label="Message customer">
            <div style={{ padding: '32px 40px 40px' }}>
              <div className="mb-7 flex items-center justify-between">
                <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  — Message customer
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bav-hover-opa font-mono text-[12px]"
                >
                  CLOSE ✕
                </button>
              </div>
              <h2
                className="m-0 mb-3.5 font-light leading-[1.1]"
                style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: 28 }}
              >
                To customer
              </h2>
              <p className="mt-0 mb-7 text-[13px]" style={{ color: 'var(--ink-60)' }}>
                Sent via email and visible on the order.
              </p>
              <div className="mb-4">
                <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
                  Subject
                </label>
                <input className="bav-input" defaultValue="Update on your order" />
              </div>
              <div className="mb-7">
                <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
                  Message
                </label>
                <textarea
                  className="bav-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write plainly. Ship dates, serials, honest answers."
                  style={{ minHeight: 180, resize: 'vertical' }}
                />
              </div>
              {/* TODO: wire send-customer-message to /api/admin/orders/[id]/message */}
              <button type="button" className="bav-cta" style={{ width: '100%' }}>
                Send message
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export function OrderRefundButton({ totalGbp }: { totalGbp: number }) {
  const [open, setOpen] = useState(false);
  const gbp = (n: number) =>
    `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bav-cta-secondary"
        style={{ width: 'auto', padding: '14px 22px' }}
      >
        Refund
      </button>
      {open && (
        <>
          <div className="bav-slideover-backdrop" onClick={() => setOpen(false)} />
          <aside className="bav-slideover-panel" role="dialog" aria-label="Process refund">
            <div style={{ padding: '32px 40px 40px' }}>
              <div className="mb-7 flex items-center justify-between">
                <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  — Refund
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bav-hover-opa font-mono text-[12px]"
                >
                  CLOSE ✕
                </button>
              </div>
              <h2
                className="m-0 mb-3.5 font-light"
                style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: 28 }}
              >
                Issue a <span className="bav-italic">refund</span>
              </h2>
              <p className="mt-0 mb-7 text-[13px]" style={{ color: 'var(--ink-60)' }}>
                Refunds to card via Stripe settle in 5–10 working days.
              </p>
              <div className="mb-4">
                <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
                  Amount
                </label>
                <input className="bav-input" defaultValue={totalGbp.toFixed(2)} />
                <div className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-30)' }}>
                  Max refundable {gbp(totalGbp)}
                </div>
              </div>
              <div className="mb-7">
                <label className="bav-label mb-1 block" style={{ color: 'var(--ink-60)' }}>
                  Reason
                </label>
                <select className="bav-input">
                  <option>Customer request</option>
                  <option>Item faulty</option>
                  <option>Build cancelled</option>
                  <option>Goodwill</option>
                  <option>Other</option>
                </select>
              </div>
              {/* TODO: wire refund to /api/admin/orders/[id]/refund */}
              <button type="button" className="bav-cta" style={{ width: '100%' }}>
                Refund {gbp(totalGbp)}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
