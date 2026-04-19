'use client';

import { useMemo, useState } from 'react';

export type DiscountRow = {
  codeId: string;
  code: string;
  type: string; // percentage | fixed | free_shipping
  value: number | null;
  minSpend: number | null;
  maxUses: number | null;
  usesCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

type DiscountStatus = 'active' | 'scheduled' | 'expired' | 'used_up';

const TYPE_LABEL: Record<string, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed amount',
  free_shipping: 'Free shipping',
};

function statusOf(c: DiscountRow, now = new Date()): DiscountStatus {
  if (c.maxUses !== null && c.usesCount >= c.maxUses) return 'used_up';
  const start = c.startsAt ? new Date(c.startsAt) : null;
  const end = c.endsAt ? new Date(c.endsAt) : null;
  if (start && start > now) return 'scheduled';
  if (end && end < now) return 'expired';
  if (!c.isActive) return 'expired';
  return 'active';
}

function formatValue(c: DiscountRow): string {
  if (c.type === 'percentage') return `${c.value ?? 0}%`;
  if (c.type === 'fixed') return `£${c.value ?? 0}`;
  return 'free shipping';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DiscountsManager({
  codes,
  kpis,
}: {
  codes: DiscountRow[];
  kpis: { active: number; redemptionsMonth: number; revenueAttributed: number };
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'redeemed'>('newest');
  const [editing, setEditing] = useState<string | null>(null); // codeId | 'new' | null

  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [formValue, setFormValue] = useState('');
  const [formMinSpend, setFormMinSpend] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeCode = useMemo(
    () => (editing && editing !== 'new' ? codes.find((c) => c.codeId === editing) ?? null : null),
    [editing, codes]
  );
  const editMode: 'new' | 'edit' | null = editing === 'new' ? 'new' : editing ? 'edit' : null;

  const filtered = useMemo(() => {
    const list = codes.filter((c) =>
      statusFilter === 'all' ? true : statusOf(c) === statusFilter
    );
    return list.sort((a, b) => {
      if (sortBy === 'newest')
        return (
          new Date(b.startsAt ?? 0).getTime() - new Date(a.startsAt ?? 0).getTime()
        );
      if (sortBy === 'ending')
        return (
          new Date(a.endsAt ?? '2099-01-01').getTime() -
          new Date(b.endsAt ?? '2099-01-01').getTime()
        );
      if (sortBy === 'redeemed') return b.usesCount - a.usesCount;
      return 0;
    });
  }, [codes, statusFilter, sortBy]);

  const openNew = () => {
    setEditing('new');
    setFormCode('');
    setFormType('percentage');
    setFormValue('');
    setFormMinSpend('');
    setFormMaxUses('');
    setFormActive(true);
    setErr(null);
  };
  const openEdit = (c: DiscountRow) => {
    setEditing(c.codeId);
    setFormCode(c.code);
    setFormType(c.type as 'percentage' | 'fixed' | 'free_shipping');
    setFormValue(c.value === null ? '' : String(c.value));
    setFormMinSpend(c.minSpend === null ? '' : String(c.minSpend));
    setFormMaxUses(c.maxUses === null ? '' : String(c.maxUses));
    setFormActive(c.isActive);
    setErr(null);
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        code: formCode,
        type: formType,
        value: formType === 'free_shipping' ? null : Number(formValue || 0),
        minSpend: formMinSpend ? Number(formMinSpend) : null,
        maxUses: formMaxUses ? Number(formMaxUses) : null,
        isActive: formActive,
      };
      if (editMode === 'new') {
        const res = await fetch('/api/admin/discounts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErr(body?.error?.message ?? 'create failed');
          return;
        }
      } else if (activeCode) {
        const res = await fetch(`/api/admin/discounts/${activeCode.codeId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErr(body?.error?.message ?? 'update failed');
          return;
        }
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    if (!activeCode) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/discounts/${activeCode.codeId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !activeCode.isActive }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErr(body?.error?.message ?? 'toggle failed');
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
          — Admin · Marketing · Discounts
        </div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            fontVariationSettings: "'opsz' 144",
          }}
        >
          Discount codes.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-60)',
            marginTop: 14,
            marginBottom: 40,
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Codes live here. Stripe Checkout honours any active code the customer enters at step 3.
        </p>

        <div className="flex flex-wrap items-stretch justify-between" style={{ gap: 20 }}>
          <div className="flex flex-wrap" style={{ gap: 20 }}>
            {[
              { label: 'Active codes', value: kpis.active.toString() },
              { label: 'Redemptions all-time', value: kpis.redemptionsMonth.toString() },
              {
                label: 'Revenue attributed',
                value: `£${kpis.revenueAttributed.toLocaleString('en-GB')}`,
              },
            ].map((k) => (
              <div
                key={k.label}
                style={{ border: '1px solid var(--ink-10)', padding: 20, minWidth: 200 }}
              >
                <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  {k.label.toUpperCase()}
                </div>
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 20, fontWeight: 500, marginTop: 10 }}
                >
                  {k.value}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="bav-cta" onClick={openNew}>
            New code
          </button>
        </div>

        <div
          className="flex flex-wrap items-center justify-between"
          style={{
            borderTop: '1px solid var(--ink-10)',
            borderBottom: '1px solid var(--ink-10)',
            padding: '16px 0',
            marginTop: 40,
            gap: 24,
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            {[
              { k: 'all', label: 'All' },
              { k: 'active', label: 'Active' },
              { k: 'scheduled', label: 'Scheduled' },
              { k: 'expired', label: 'Expired' },
              { k: 'used_up', label: 'Used up' },
            ].map((f) => {
              const isOn = statusFilter === f.k;
              return (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setStatusFilter(f.k)}
                  style={{
                    fontSize: 12,
                    padding: '6px 14px',
                    border: `1px solid ${isOn ? 'var(--ink)' : 'var(--ink-10)'}`,
                    background: isOn ? 'var(--ink)' : 'transparent',
                    color: isOn ? 'var(--paper)' : 'var(--ink)',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              SORT
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'ending' | 'redeemed')}
              style={{
                fontSize: 13,
                border: '1px solid var(--ink-10)',
                background: 'transparent',
                padding: '6px 10px',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest</option>
              <option value="ending">Ending soonest</option>
              <option value="redeemed">Most redeemed</option>
            </select>
          </div>
        </div>

        <div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 140px 100px 120px',
              gap: 16,
              padding: '14px 0',
              borderBottom: '1px solid var(--ink-10)',
            }}
          >
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              CODE
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              TYPE
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)', textAlign: 'right' }}>
              VALUE
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              MIN SPEND
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              WINDOW
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              USES
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              STATUS
            </span>
          </div>

          {filtered.length === 0 && (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--ink-60)',
                fontSize: 13,
              }}
            >
              No codes match this filter.
            </div>
          )}

          {filtered.map((c) => {
            const s = statusOf(c);
            const usesDisplay =
              c.maxUses === null ? `${c.usesCount} / ∞` : `${c.usesCount} / ${c.maxUses}`;
            return (
              <div
                key={c.codeId}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openEdit(c);
                }}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 140px 100px 120px',
                  gap: 16,
                  padding: '22px 0',
                  borderBottom: '1px solid var(--ink-10)',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  {c.code}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-60)' }}>
                  {TYPE_LABEL[c.type] ?? c.type}
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, textAlign: 'right' }}
                >
                  {formatValue(c)}
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, color: 'var(--ink-60)' }}
                >
                  {c.minSpend ? `£${c.minSpend}` : '—'}
                </span>
                <div>
                  <div className="font-mono tabular-nums" style={{ fontSize: 11 }}>
                    {formatDate(c.startsAt)}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 11, color: 'var(--ink-60)', marginTop: 2 }}
                  >
                    {c.endsAt ? formatDate(c.endsAt) : 'no end'}
                  </div>
                </div>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, color: 'var(--ink-60)' }}
                >
                  {usesDisplay}
                </span>
                <div className="flex items-center" style={{ gap: 8 }}>
                  {s === 'active' && (
                    <>
                      <span className="bav-pulse" />
                      <span className="font-mono tabular-nums" style={{ fontSize: 11 }}>
                        ACTIVE
                      </span>
                    </>
                  )}
                  {s === 'scheduled' && (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--ink-30)',
                        }}
                      />
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink-30)' }}
                      >
                        SCHEDULED
                      </span>
                    </>
                  )}
                  {s === 'expired' && (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--ink-30)',
                        }}
                      />
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink-30)' }}
                      >
                        EXPIRED
                      </span>
                    </>
                  )}
                  {s === 'used_up' && (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#B94040',
                        }}
                      />
                      <span className="font-mono tabular-nums" style={{ fontSize: 11 }}>
                        USED UP
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 96 }} />
      </div>

      {editMode && (
        <>
          <div
            className="bav-slideover-backdrop"
            onClick={() => setEditing(null)}
            role="presentation"
          />
          <aside className="bav-slideover-panel" aria-label="Discount code editor">
            <div style={{ padding: 40 }}>
              <div className="flex justify-between items-start">
                <div
                  className="font-display font-light"
                  style={{
                    fontSize: 32,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {editMode === 'new' ? 'New code.' : 'Edit code.'}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="font-mono tabular-nums"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    color: 'var(--ink-60)',
                  }}
                >
                  CLOSE ✕
                </button>
              </div>

              <div style={{ marginTop: 32 }}>
                <FieldRow label="CODE">
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="LAUNCH24"
                    className="font-mono tabular-nums"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      width: '100%',
                      padding: '6px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-30)',
                      marginTop: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    Customers paste this at checkout. Avoid ambiguous characters — no 0 O 1 I.
                  </div>
                </FieldRow>

                <FieldRow label="TYPE">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(
                      [
                        ['percentage', 'Percentage'],
                        ['fixed', 'Fixed amount'],
                        ['free_shipping', 'Free shipping'],
                      ] as const
                    ).map(([k, label]) => (
                      <label
                        key={k}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            border: `1px solid ${formType === k ? 'var(--ink)' : 'var(--ink-30)'}`,
                            background: formType === k ? 'var(--ink)' : 'transparent',
                            position: 'relative',
                          }}
                        >
                          {formType === k && (
                            <span
                              style={{
                                position: 'absolute',
                                inset: 3,
                                background: 'var(--paper)',
                              }}
                            />
                          )}
                        </span>
                        <input
                          type="radio"
                          name="dc-type"
                          checked={formType === k}
                          onChange={() => setFormType(k)}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: 14 }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </FieldRow>

                {formType !== 'free_shipping' && (
                  <FieldRow label="VALUE">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {formType === 'fixed' && (
                        <span className="font-mono" style={{ fontSize: 14 }}>
                          £
                        </span>
                      )}
                      <input
                        type="text"
                        value={formValue}
                        onChange={(e) => setFormValue(e.target.value)}
                        placeholder={formType === 'percentage' ? '15' : '50'}
                        className="font-mono tabular-nums"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: 14,
                          width: '100%',
                          padding: '6px 0',
                        }}
                      />
                      {formType === 'percentage' && (
                        <span className="font-mono" style={{ fontSize: 14 }}>
                          %
                        </span>
                      )}
                    </div>
                  </FieldRow>
                )}

                <FieldRow label="MINIMUM SPEND">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-mono" style={{ fontSize: 14 }}>
                      £
                    </span>
                    <input
                      type="text"
                      value={formMinSpend}
                      onChange={(e) => setFormMinSpend(e.target.value)}
                      placeholder="500 (optional)"
                      className="font-mono tabular-nums"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 14,
                        width: '100%',
                        padding: '6px 0',
                      }}
                    />
                  </div>
                </FieldRow>

                <FieldRow label="MAXIMUM USES">
                  <input
                    type="text"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="unlimited"
                    className="font-mono tabular-nums"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      width: '100%',
                      padding: '6px 0',
                    }}
                  />
                </FieldRow>

                <FieldRow label="ACTIVE">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: `1px solid ${formActive ? 'var(--ink)' : 'var(--ink-30)'}`,
                        background: formActive ? 'var(--ink)' : 'transparent',
                        position: 'relative',
                      }}
                    >
                      {formActive && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: 4,
                            width: 4,
                            height: 7,
                            borderRight: `2px solid var(--paper)`,
                            borderBottom: `2px solid var(--paper)`,
                            transform: 'rotate(45deg)',
                          }}
                        />
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: 14 }}>
                      Customers can redeem immediately when active
                    </span>
                  </label>
                </FieldRow>
              </div>

              {err && (
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 12, color: '#B94040', marginTop: 16 }}
                >
                  {err}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
                <button
                  type="button"
                  className="bav-cta"
                  style={{ width: '100%' }}
                  onClick={save}
                  disabled={busy}
                >
                  {busy ? 'Saving…' : 'Save code'}
                </button>
                <button
                  type="button"
                  className="bav-cta-secondary"
                  style={{ width: '100%' }}
                  onClick={() => setEditing(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>

              {editMode === 'edit' && activeCode && (
                <div
                  style={{
                    marginTop: 56,
                    paddingTop: 24,
                    borderTop: '1px solid var(--ink-10)',
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleActive}
                    disabled={busy}
                    className="bav-label bav-hover-opa"
                    style={{
                      color: 'var(--ink-30)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {activeCode.isActive ? 'DEACTIVATE CODE' : 'ACTIVATE CODE'}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </main>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '200px 1fr',
        gap: 16,
        padding: '18px 0',
        borderBottom: '1px solid var(--ink-10)',
      }}
    >
      <span className="bav-label" style={{ color: 'var(--ink-60)', paddingTop: 8 }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
