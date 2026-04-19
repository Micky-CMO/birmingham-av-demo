'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type SupportTicketRow = {
  ticketId: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string | null;
  subject: string;
  lastSnippet: string;
  lastAt: string; // ISO
  status: string;
  unread: boolean;
  aiTurns: number;
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ai_handling', label: 'AI handling' },
  { key: 'awaiting_staff', label: 'Awaiting staff' },
  { key: 'awaiting_customer', label: 'Awaiting customer' },
  { key: 'resolved', label: 'Resolved' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  ai_handling: 'AI handling',
  awaiting_staff: 'Awaiting staff',
  awaiting_customer: 'Awaiting customer',
  resolved: 'Resolved',
  open: 'Open',
  escalated_human: 'Escalated',
  closed: 'Closed',
};

const STATUS_DOT: Record<string, string> = {
  ai_handling: 'var(--ink-30)',
  awaiting_staff: 'var(--accent)',
  awaiting_customer: 'var(--ink-60)',
  resolved: 'var(--ink-10)',
  open: 'var(--accent)',
  escalated_human: '#C17817',
};

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
}

export function SupportInbox({ tickets }: { tickets: SupportTicketRow[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.ticketId ?? null);
  const [takenOver, setTakenOver] = useState(false);
  const [draft, setDraft] = useState('');

  const filtered = useMemo(() => {
    const list = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);
    return list;
  }, [tickets, filter]);

  const selected = tickets.find((t) => t.ticketId === selectedId) ?? filtered[0] ?? null;

  const aiPercent = useMemo(() => {
    if (tickets.length === 0) return 0;
    const ai = tickets.filter((t) => t.status === 'ai_handling' || t.status === 'resolved').length;
    return Math.round((ai / tickets.length) * 100);
  }, [tickets]);

  return (
    <>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 48px 24px' }}>
        <div className="mb-7 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="bav-label mb-3" style={{ color: 'var(--ink-30)' }}>
              / support
            </div>
            <h1
              className="m-0 font-light"
              style={{
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                fontSize: 52,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Customer <span className="bav-italic">inbox</span>
            </h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              <span className="bav-pulse mr-2.5 align-middle" />
              AI resolving · {aiPercent}%
            </span>
          </div>
        </div>

        <div className="flex gap-5 pb-4" style={{ borderBottom: '1px solid var(--ink-10)' }}>
          {STATUS_FILTERS.map((f) => {
            const count = f.key === 'all' ? tickets.length : tickets.filter((t) => t.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="bav-tab-link"
                style={{ color: active ? 'var(--ink)' : 'var(--ink-60)', fontWeight: active ? 500 : 400 }}
              >
                {f.label}
                <span className="bav-label ml-2" style={{ color: 'var(--ink-30)' }}>
                  {String(count).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="grid"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 48px',
          gridTemplateColumns: '380px 1fr',
          borderTop: '1px solid var(--ink-10)',
        }}
      >
        {/* List */}
        <aside style={{ borderRight: '1px solid var(--ink-10)', minHeight: 640 }}>
          {filtered.map((t) => {
            const active = selected && t.ticketId === selected.ticketId;
            return (
              <button
                key={t.ticketId}
                type="button"
                onClick={() => {
                  setSelectedId(t.ticketId);
                  setTakenOver(false);
                }}
                className="block w-full text-left"
                style={{
                  padding: '20px 20px',
                  borderBottom: '1px solid var(--ink-10)',
                  background: active ? 'var(--paper-2)' : 'transparent',
                  transition: 'background 200ms',
                  cursor: 'pointer',
                }}
              >
                <div className="mb-1.5 flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    {t.unread && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                        }}
                      />
                    )}
                    <span className="text-[14px] font-medium">{t.customerName}</span>
                  </div>
                  <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                    {timeAgo(t.lastAt)}
                  </span>
                </div>
                <div
                  className="text-[13px] mb-1.5"
                  style={{ color: 'var(--ink)', fontWeight: t.unread ? 500 : 400 }}
                >
                  {t.subject}
                </div>
                <div
                  className="text-[12.5px] leading-[1.45] mb-2.5 overflow-hidden"
                  style={{
                    color: 'var(--ink-60)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {t.lastSnippet}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                    <span
                      className="bav-status-dot"
                      style={{ background: STATUS_DOT[t.status] ?? 'var(--ink-10)' }}
                    />
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                  {t.aiTurns > 0 && (
                    <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                      · AI {t.aiTurns}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-[13px]" style={{ padding: 48, color: 'var(--ink-30)' }}>
              No tickets in this filter.
            </div>
          )}
        </aside>

        {/* Conversation */}
        <section className="flex flex-col" style={{ minHeight: 640 }}>
          {selected ? (
            <>
              <div
                className="flex justify-between items-start gap-6"
                style={{ padding: '24px 32px', borderBottom: '1px solid var(--ink-10)' }}
              >
                <div>
                  <div className="text-[18px] font-medium mb-1.5">{selected.subject}</div>
                  <div className="flex gap-3.5 items-center flex-wrap">
                    <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      {selected.ticketNumber}
                    </span>
                    {selected.orderNumber && (
                      <>
                        <span style={{ color: 'var(--ink-30)' }}>·</span>
                        <Link
                          href={`/admin/orders/${selected.orderNumber}`}
                          className="bav-underline text-[12px]"
                        >
                          {selected.orderNumber}
                        </Link>
                      </>
                    )}
                    <span style={{ color: 'var(--ink-30)' }}>·</span>
                    <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                      <span
                        className="bav-status-dot"
                        style={{ background: STATUS_DOT[selected.status] ?? 'var(--ink-10)' }}
                      />
                      {takenOver ? 'Human handling' : STATUS_LABEL[selected.status] ?? selected.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2.5 flex-shrink-0">
                  {selected.status === 'ai_handling' && !takenOver && (
                    <button
                      type="button"
                      onClick={() => setTakenOver(true)}
                      className="bav-cta"
                      style={{ width: 'auto', padding: '12px 22px', fontSize: 11 }}
                    >
                      Take over from AI
                    </button>
                  )}
                  {/* TODO: wire mark-resolved to /api/admin/support/[id]/resolve */}
                  <button
                    type="button"
                    className="bav-cta-secondary"
                    style={{ width: 'auto', padding: '11px 22px', fontSize: 11 }}
                  >
                    Mark resolved
                  </button>
                </div>
              </div>

              {/* TODO: wire conversation thread from SupportMessage model — currently placeholder */}
              <div
                className="flex-1 flex flex-col gap-5 overflow-y-auto"
                style={{ padding: '28px 32px' }}
              >
                <div style={{ maxWidth: '78%' }}>
                  <div className="mb-2 flex gap-2.5 items-baseline">
                    <span className="text-[13px] font-medium">{selected.customerName}</span>
                    <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                      {timeAgo(selected.lastAt)}
                    </span>
                  </div>
                  <div
                    className="bav-card text-[14px] leading-[1.65]"
                    style={{ background: 'var(--paper-2)', padding: '16px 20px', border: 'none' }}
                  >
                    {selected.lastSnippet}
                  </div>
                </div>
                {takenOver && (
                  <div
                    className="self-center"
                    style={{
                      padding: '10px 16px',
                      background: 'var(--paper-2)',
                      border: '1px solid var(--ink-10)',
                    }}
                  >
                    <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      AI paused · Conversation handed to staff
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--ink-10)',
                  padding: '20px 32px',
                  background: 'var(--paper)',
                }}
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    takenOver
                      ? 'Reply as staff — customer will see this as a staff reply…'
                      : 'AI is currently handling this ticket. Use “Take over” above to reply as staff.'
                  }
                  disabled={selected.status === 'ai_handling' && !takenOver}
                  rows={4}
                  className="w-full"
                  style={{
                    border: '1px solid var(--ink-10)',
                    background:
                      selected.status === 'ai_handling' && !takenOver
                        ? 'var(--paper-2)'
                        : 'var(--paper)',
                    padding: 14,
                    fontSize: 14,
                    lineHeight: 1.55,
                    fontFamily: 'var(--font-instrument-sans), system-ui, sans-serif',
                    resize: 'vertical',
                    outline: 'none',
                    marginBottom: 12,
                  }}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button type="button" className="bav-underline text-[12px]" style={{ color: 'var(--ink-60)' }}>
                      Canned responses
                    </button>
                    <button type="button" className="bav-underline text-[12px]" style={{ color: 'var(--ink-60)' }}>
                      Attach file
                    </button>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      className="bav-cta-secondary"
                      style={{ width: 'auto', padding: '11px 22px', fontSize: 11 }}
                    >
                      Save draft
                    </button>
                    <button
                      type="button"
                      className="bav-cta"
                      disabled={selected.status === 'ai_handling' && !takenOver}
                      style={{
                        width: 'auto',
                        padding: '12px 24px',
                        fontSize: 11,
                        opacity: selected.status === 'ai_handling' && !takenOver ? 0.3 : 1,
                      }}
                    >
                      Send reply
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex items-center justify-center text-[13px]"
              style={{ color: 'var(--ink-30)' }}
            >
              Select a ticket to view the conversation.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
