'use client';

import { useMemo, useState } from 'react';

export type AdminReturn = {
  returnId: string;
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productTitle: string;
  productSku: string;
  builderCode: string | null;
  builderName: string | null;
  reason: string;
  reasonDetails: string | null;
  refundAmountGbp: number;
  restockingFeeGbp: number;
  aiSeverity: number | null;
  aiFlaggedPattern: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  status: string;
  createdAt: string;
  photoCount: number;
};

const REASON_LABEL: Record<string, string> = {
  hardware_fault: 'Hardware fault',
  damaged_in_transit: 'Damaged in transit',
  not_as_described: 'Not as described',
  dead_on_arrival: 'Dead on arrival',
  changed_mind: 'Changed mind',
  wrong_item: 'Wrong item',
  other: 'Other',
};

const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  in_transit: 'In transit',
  received: 'Received',
  refunded: 'Refunded',
  resolved: 'Resolved',
  escalated: 'Escalated',
  rejected: 'Rejected',
};

function gbp(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ReturnsTable({
  returns,
  counts,
  rmaRate,
}: {
  returns: AdminReturn[];
  counts: Record<string, number>;
  rmaRate: number;
}) {
  const [statusTab, setStatusTab] = useState('requested');
  const [openReturn, setOpenReturn] = useState<AdminReturn | null>(null);

  const statusTabs = [
    { key: 'requested', label: 'Requested', count: counts.requested ?? 0, highlight: true },
    { key: 'approved', label: 'Approved', count: counts.approved ?? 0 },
    { key: 'in_transit', label: 'In transit', count: counts.in_transit ?? 0 },
    { key: 'received', label: 'Received', count: counts.received ?? 0 },
    { key: 'refunded', label: 'Refunded', count: counts.refunded ?? 0 },
    { key: 'resolved', label: 'Resolved', count: counts.resolved ?? 0 },
    { key: 'escalated', label: 'Escalated', count: counts.escalated ?? 0 },
    { key: 'all', label: 'All', count: returns.length },
  ];

  const filtered = useMemo(
    () => (statusTab === 'all' ? returns : returns.filter((r) => r.status === statusTab)),
    [returns, statusTab]
  );

  return (
    <>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 48px 0' }}>
        <div className="mb-9 flex items-end justify-between flex-wrap gap-6">
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
              What came <span className="bav-italic">back</span>.
            </h1>
            <p className="mt-3 text-[14px]" style={{ color: 'var(--ink-60)' }}>
              {counts.requested ?? 0} awaiting decision · {returns.length} in view · RMA rate {(rmaRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              AI triage ·
            </span>
            <span className="bav-pulse" />
            <span className="bav-label" style={{ color: 'var(--ink)' }}>
              ON
            </span>
          </div>
        </div>

        {/* Status tabs */}
        <div
          className="mb-6 flex gap-7 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--ink-10)' }}
        >
          {statusTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusTab(t.key)}
              className={'bav-tab-link whitespace-nowrap pb-3' + (statusTab === t.key ? ' active' : '')}
            >
              {t.label}{' '}
              <span className="ml-1 font-mono text-[11px]" style={{ color: 'var(--ink-30)' }}>
                {t.count}
              </span>
              {t.highlight && t.count > 0 && <span className="bav-pulse ml-2" />}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mb-24" style={{ border: '1px solid var(--ink-10)' }}>
          <div
            className="grid px-5 py-3.5"
            style={{
              gridTemplateColumns: '170px 100px 1.6fr 180px 180px 160px 110px 80px',
              background: 'var(--paper-2)',
              borderBottom: '1px solid var(--ink-10)',
            }}
          >
            {['RMA', 'Date', 'Product / customer', 'Reason', 'AI severity', 'Refund', 'Status', 'Open'].map((h, i) => (
              <span
                key={h}
                className="bav-label"
                style={{ color: 'var(--ink-60)', textAlign: i === 7 ? 'right' : 'left' }}
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.map((r, i) => (
            <button
              key={r.returnId}
              type="button"
              onClick={() => setOpenReturn(r)}
              className="bav-admin-row grid items-center px-5 py-[22px] text-left w-full"
              style={{
                gridTemplateColumns: '170px 100px 1.6fr 180px 180px 160px 110px 80px',
                borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--ink-10)',
                gap: 8,
              }}
            >
              <span className="font-mono text-[13px]">{r.returnNumber}</span>
              <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
                {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
              <div>
                <div className="text-[14px] mb-1">{r.productTitle}</div>
                <div className="text-[12px]" style={{ color: 'var(--ink-60)' }}>
                  {r.customerName} · <span className="font-mono">{r.orderNumber}</span>
                </div>
              </div>
              <span className="text-[13px]" style={{ color: 'var(--ink-60)' }}>
                {REASON_LABEL[r.reason] ?? r.reason}
              </span>
              <SeverityGauge value={r.aiSeverity ?? 0} />
              <span className="font-mono text-[13px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.refundAmountGbp > 0 ? gbp(r.refundAmountGbp) : '—'}
              </span>
              <span
                className="text-[13px]"
                style={{ color: r.status === 'requested' ? 'var(--ink)' : 'var(--ink-60)' }}
              >
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              <span
                className="bav-label bav-underline justify-self-end"
                style={{ color: 'var(--ink)' }}
              >
                Open <span className="arrow">→</span>
              </span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p
                className="m-0 italic"
                style={{
                  fontFamily: 'var(--font-fraunces), Georgia, serif',
                  fontSize: 22,
                  color: 'var(--ink-60)',
                }}
              >
                Nothing in this queue.
              </p>
            </div>
          )}
        </div>
      </div>

      {openReturn && (
        <ReturnDetail r={openReturn} onClose={() => setOpenReturn(null)} />
      )}
    </>
  );
}

function SeverityGauge({ value }: { value: number }) {
  const tag = value >= 0.6 ? 'High' : value >= 0.3 ? 'Moderate' : 'Low';
  return (
    <div className="flex items-center gap-2.5">
      <div className="bav-severity-track">
        <div className="bav-severity-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <span
        className="font-mono text-[11px]"
        style={{ color: 'var(--ink-60)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value.toFixed(2)}
      </span>
      <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
        {tag}
      </span>
    </div>
  );
}

function ReturnDetail({ r, onClose }: { r: AdminReturn; onClose: () => void }) {
  return (
    <>
      <div className="bav-slideover-backdrop" onClick={onClose} />
      <aside
        className="bav-slideover-panel"
        role="dialog"
        aria-label={`Return ${r.returnNumber}`}
      >
        <div style={{ padding: '32px 40px 40px' }}>
          <div className="mb-7 flex items-center justify-between">
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Return
            </span>
            <button
              type="button"
              onClick={onClose}
              className="bav-hover-opa font-mono text-[12px]"
            >
              CLOSE ✕
            </button>
          </div>

          <div className="font-mono text-[13px] mb-2" style={{ color: 'var(--ink-60)' }}>
            {r.returnNumber}
          </div>
          <h2
            className="m-0 mb-6 font-light leading-[1.1]"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: 30 }}
          >
            {REASON_LABEL[r.reason] ?? r.reason}
            <span className="bav-italic">.</span>
          </h2>

          {/* Product card */}
          <div
            className="mb-7 grid gap-4"
            style={{ gridTemplateColumns: '110px 1fr', padding: 18, border: '1px solid var(--ink-10)' }}
          >
            <div className="bav-canvas flex items-center justify-center" style={{ height: 110 }}>
              <span
                className="font-light"
                style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: 28 }}
              >
                <span className="bav-italic">№</span>
                {r.returnId.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-mono text-[11px] mb-1" style={{ color: 'var(--ink-60)' }}>
                {r.productSku}
              </div>
              <div className="text-[14px] mb-2.5">{r.productTitle}</div>
              <div className="text-[12px]" style={{ color: 'var(--ink-60)' }}>
                {r.customerName} · {r.customerEmail}
              </div>
              <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--ink-60)' }}>
                {r.orderNumber}
              </div>
              {r.builderName && (
                <div className="text-[12px] mt-2" style={{ color: 'var(--ink-60)' }}>
                  Built by {r.builderName} · <span className="font-mono">{r.builderCode}</span>
                </div>
              )}
            </div>
          </div>

          {r.reasonDetails && (
            <div className="mb-7">
              <div className="bav-label mb-2.5" style={{ color: 'var(--ink-60)' }}>
                — Customer wrote
              </div>
              <p className="m-0 text-[14px] italic leading-[1.6]">“{r.reasonDetails}”</p>
              {r.photoCount > 0 && (
                <div className="mt-3.5 flex gap-2">
                  {Array.from({ length: r.photoCount }).map((_, i) => (
                    <div key={i} className="bav-canvas" style={{ width: 72, height: 72 }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {r.aiSummary && (
            <div
              className="mb-7"
              style={{ padding: 22, background: 'var(--paper-2)', border: '1px solid var(--ink-10)' }}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span className="bav-label" style={{ color: 'var(--ink)' }}>
                  — AI triage
                </span>
                {r.aiConfidence != null && (
                  <span className="font-mono text-[11px]" style={{ color: 'var(--ink-60)' }}>
                    Confidence {r.aiConfidence.toFixed(2)}
                  </span>
                )}
              </div>
              {r.aiSeverity != null && <SeverityGauge value={r.aiSeverity} />}
              <p className="mt-4 text-[14px] leading-[1.6]">{r.aiSummary}</p>
              {r.aiFlaggedPattern && (
                <div className="mt-3.5 pt-3.5" style={{ borderTop: '1px solid var(--ink-10)' }}>
                  <span className="bav-label mb-1.5 block" style={{ color: 'var(--ink-60)' }}>
                    Pattern flag
                  </span>
                  <p className="m-0 text-[13px]">{r.aiFlaggedPattern}</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-7">
            <div className="bav-label mb-2.5" style={{ color: 'var(--ink-60)' }}>
              — Proposed refund
            </div>
            <div className="flex items-baseline gap-3.5">
              <span
                className="font-mono"
                style={{ fontSize: 28, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}
              >
                {r.refundAmountGbp > 0 ? gbp(r.refundAmountGbp) : '—'}
              </span>
              {r.restockingFeeGbp > 0 && (
                <span className="text-[12px]" style={{ color: 'var(--ink-60)' }}>
                  less {gbp(r.restockingFeeGbp)} restocking
                </span>
              )}
            </div>
          </div>

          <div className="mb-9">
            <div className="bav-label mb-2" style={{ color: 'var(--ink-60)' }}>
              — Resolution notes
            </div>
            <textarea
              className="bav-input"
              placeholder="Internal, visible to staff only."
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>

          {/* TODO: wire approve/reject to /api/admin/returns/[id]/decision */}
          <div className="mb-4 flex gap-3">
            <button type="button" className="bav-cta" style={{ flex: 1, width: 'auto', padding: '18px 36px' }}>
              Approve
            </button>
            <button
              type="button"
              className="bav-cta-secondary"
              style={{ flex: 1, width: 'auto', padding: '17px 36px' }}
            >
              Reject
            </button>
          </div>
          <button
            type="button"
            className="bav-label bav-underline bav-hover-opa"
            style={{ color: 'var(--ink-60)' }}
          >
            Escalate to senior staff
          </button>
        </div>
      </aside>
    </>
  );
}
