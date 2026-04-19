'use client';

import { useMemo, useState } from 'react';

export type WebhookEventRow = {
  eventId: string;
  source: string;
  eventType: string;
  signatureValid: boolean;
  processed: boolean;
  errorMessage: string | null;
  receivedAt: string;
  processedAt: string | null;
  payload: unknown;
};

type SourceKey = 'all' | 'stripe' | 'paypal' | 'royal_mail' | 'dpd' | 'other';
type StatusKey = 'all' | 'succeeded' | 'failed';

const ink = 'var(--ink)';
const ink60 = 'var(--ink-60)';
const ink30 = 'var(--ink-30)';
const ink10 = 'var(--ink-10)';
const paper = 'var(--paper)';
const paper2 = 'var(--paper-2)';

function statusColor(ev: WebhookEventRow) {
  if (ev.errorMessage) return '#B94040';
  if (!ev.signatureValid) return '#D98D1E';
  if (ev.processed) return '#1EB53A';
  return 'var(--ink-30)';
}

function statusLabel(ev: WebhookEventRow) {
  if (ev.errorMessage) return 'error';
  if (!ev.signatureValid) return 'unsigned';
  if (ev.processed) return 'processed';
  return 'pending';
}

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function WebhookLogClient({ events }: { events: WebhookEventRow[] }) {
  const [sourceFilter, setSourceFilter] = useState<SourceKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const sources = useMemo(
    () => ['all', ...Array.from(new Set(events.map((e) => e.source)))] as SourceKey[],
    [events],
  );

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (sourceFilter !== 'all' && ev.source !== sourceFilter) return false;
      if (statusFilter === 'succeeded' && (!ev.processed || ev.errorMessage)) return false;
      if (statusFilter === 'failed' && !ev.errorMessage && ev.processed) return false;
      return true;
    });
  }, [events, sourceFilter, statusFilter]);

  const open = openId ? events.find((e) => e.eventId === openId) ?? null : null;

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-4"
        style={{ padding: '24px 32px', borderBottom: `1px solid ${ink10}` }}
      >
        <div className="bav-label" style={{ color: ink60 }}>Source</div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as SourceKey)}
          className="font-mono"
          style={{
            background: 'transparent',
            border: `1px solid ${ink10}`,
            padding: '8px 14px',
            fontSize: 12,
            color: ink,
            cursor: 'pointer',
            minWidth: 160,
          }}
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="bav-label ml-3" style={{ color: ink60 }}>Status</div>
        <div style={{ display: 'flex', border: `1px solid ${ink10}` }}>
          {(['all', 'succeeded', 'failed'] as StatusKey[]).map((s, i, arr) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? ink : 'transparent',
                color: statusFilter === s ? paper : ink,
                padding: '8px 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                borderRight: i < arr.length - 1 ? `1px solid ${ink10}` : 'none',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto font-mono" style={{ fontSize: 11, color: ink30 }}>
          {filtered.length} / {events.length}
        </div>
      </div>

      <div style={{ padding: 32 }}>
        <div style={{ borderTop: `1px solid ${ink}` }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 140px 120px 1fr 140px 80px',
              padding: '12px 0',
              borderBottom: `1px solid ${ink10}`,
              gap: 16,
            }}
          >
            <div className="bav-label" style={{ color: ink60 }}>ID</div>
            <div className="bav-label" style={{ color: ink60 }}>Received</div>
            <div className="bav-label" style={{ color: ink60 }}>Source</div>
            <div className="bav-label" style={{ color: ink60 }}>Event type</div>
            <div className="bav-label" style={{ color: ink60 }}>Status</div>
            <div className="bav-label" style={{ color: ink60, textAlign: 'right' }}>Actions</div>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-[13px]" style={{ color: ink60 }}>
              No webhook events logged yet.
            </div>
          )}
          {filtered.map((ev) => {
            const color = statusColor(ev);
            return (
              <div
                key={ev.eventId}
                onClick={() => setOpenId(ev.eventId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 140px 120px 1fr 140px 80px',
                  padding: '16px 0',
                  borderBottom: `1px solid ${ink10}`,
                  gap: 16,
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = paper2;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: ink60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ev.eventId.slice(0, 14)}
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 11, color: ink }}>
                    {relative(ev.receivedAt)}
                  </div>
                  <div className="font-mono" style={{ fontSize: 9, color: ink30, marginTop: 2 }}>
                    {new Date(ev.receivedAt).toISOString().slice(11, 19)} UTC
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: ink60 }}>{ev.source}</div>
                <div className="font-mono" style={{ fontSize: 13, color: ink }}>{ev.eventType}</div>
                <div className="flex items-center gap-1.5">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <span className="font-mono" style={{ fontSize: 11, color }}>{statusLabel(ev)}</span>
                </div>
                <div className="bav-underline justify-self-end" style={{ fontSize: 11 }}>
                  Open <span className="arrow">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <>
          <div
            onClick={() => setOpenId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(23,20,15,0.35)', zIndex: 59 }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 640,
              maxWidth: '100%',
              height: '100vh',
              background: paper,
              borderLeft: `1px solid ${ink10}`,
              zIndex: 60,
              overflowY: 'auto',
              animation: 'bavSlideInRight 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards',
            }}
          >
            <div style={{ padding: 40 }}>
              <div className="mb-6 flex items-center justify-between">
                <div className="bav-label" style={{ color: ink60 }}>— Event</div>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: ink60 }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div
                className="font-display font-light"
                style={{ fontSize: 28, letterSpacing: '-0.01em', marginBottom: 6, fontVariationSettings: "'opsz' 144" }}
              >
                {open.eventType}
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: ink60 }}>{open.eventId}</div>

              <div style={{ marginTop: 32, borderTop: `1px solid ${ink10}` }}>
                {[
                  {
                    l: 'Status',
                    v: (
                      <span style={{ color: statusColor(open) }}>
                        {statusLabel(open)}
                        {open.errorMessage ? ` · ${open.errorMessage}` : ''}
                      </span>
                    ),
                  },
                  { l: 'Source', v: open.source },
                  { l: 'Received', v: formatTs(open.receivedAt) },
                  { l: 'Processed', v: open.processedAt ? formatTs(open.processedAt) : '—' },
                  { l: 'Signature', v: open.signatureValid ? 'valid' : 'unverified' },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr',
                      padding: '12px 0',
                      borderBottom: `1px solid ${ink10}`,
                    }}
                  >
                    <div className="bav-label" style={{ color: ink60 }}>{row.l}</div>
                    <div className="font-mono" style={{ fontSize: 12, color: ink }}>{row.v}</div>
                  </div>
                ))}
              </div>

              <div className="bav-label mt-8 mb-3" style={{ color: ink60 }}>Payload</div>
              <pre
                className="font-mono"
                style={{
                  background: paper2,
                  padding: 16,
                  fontSize: 12,
                  color: ink,
                  margin: 0,
                  overflow: 'auto',
                  lineHeight: 1.55,
                  maxHeight: 480,
                }}
              >
                {JSON.stringify(open.payload, null, 2)}
              </pre>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
