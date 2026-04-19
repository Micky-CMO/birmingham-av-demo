'use client';

import { useMemo, useState } from 'react';

export type PayoutRow = {
  payoutId: string;
  builderId: string;
  builderCode: string;
  builderName: string;
  tier: string;
  periodStart: string;
  periodEnd: string;
  totalBuildsCompleted: number;
  totalRevenueGbp: number;
  commissionRateBp: number;
  commissionGbp: number;
  status: string; // pending | paid | cancelled
  paidAt: string | null;
  stripeTransferId: string | null;
};

const TIER_LABEL: Record<string, string> = {
  probation: 'Probation',
  standard: 'Standard',
  preferred: 'Preferred',
  elite: 'Elite',
};

function fmtGbp(n: number): string {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtGbp2(n: number): string {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PayoutsManager({
  rows,
  kpis,
}: {
  rows: PayoutRow[];
  kpis: {
    builders: number;
    totalBuilds: number;
    totalRevenue: number;
    totalCommission: number;
  };
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const active = useMemo(() => rows.find((r) => r.payoutId === open) ?? null, [rows, open]);

  const runCalculation = async () => {
    if (!periodStart || !periodEnd) {
      setErr('Provide period start and end (ISO datetime)');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErr(body?.error?.message ?? 'run failed');
        return;
      }
      const body = (await res.json()) as { created?: number };
      setMsg(`Created ${body.created ?? 0} payout rows.`);
      setTimeout(() => window.location.reload(), 1000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
          — Admin · Builders · Payouts
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
          Builder payouts.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-60)',
            marginTop: 14,
            maxWidth: 680,
            lineHeight: 1.55,
          }}
        >
          Monthly commission statements. Finalised statements lock the underlying orders from edit.
          Mark as paid to mirror the outbound Stripe transfer.
        </p>

        <div
          className="flex flex-wrap items-end justify-between"
          style={{
            borderBottom: '1px solid var(--ink-10)',
            padding: '28px 0',
            marginTop: 40,
            gap: 20,
          }}
        >
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Run calculation for window
            </div>
            <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="font-mono tabular-nums"
                style={{
                  fontSize: 12,
                  padding: '8px 12px',
                  border: '1px solid var(--ink-10)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 11, color: 'var(--ink-30)' }}
              >
                →
              </span>
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="font-mono tabular-nums"
                style={{
                  fontSize: 12,
                  padding: '8px 12px',
                  border: '1px solid var(--ink-10)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <button
            type="button"
            className="bav-cta"
            onClick={runCalculation}
            disabled={busy}
          >
            {busy ? 'Running…' : 'Run calculation'}
          </button>
        </div>

        {err && (
          <div
            className="font-mono tabular-nums"
            style={{ fontSize: 12, color: '#B94040', marginTop: 16 }}
          >
            {err}
          </div>
        )}
        {msg && (
          <div
            className="font-mono tabular-nums"
            style={{ fontSize: 12, color: 'var(--ink)', marginTop: 16 }}
          >
            {msg}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginTop: 32,
          }}
        >
          {[
            { label: 'Builders', value: kpis.builders.toString() },
            { label: 'Builds completed', value: kpis.totalBuilds.toString() },
            { label: 'Gross attributed', value: fmtGbp(kpis.totalRevenue) },
            { label: 'Commission owed', value: fmtGbp(kpis.totalCommission) },
          ].map((k) => (
            <div key={k.label} style={{ border: '1px solid var(--ink-10)', padding: 20 }}>
              <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                {k.label.toUpperCase()}
              </div>
              <div
                className="font-mono tabular-nums"
                style={{ fontSize: 22, fontWeight: 500, marginTop: 10 }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: '200px 0.7fr 100px 120px 120px 160px 100px 100px',
              gap: 16,
              padding: '14px 0',
              borderBottom: '1px solid var(--ink-10)',
            }}
          >
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              BUILDER
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              PERIOD
            </span>
            <span
              className="bav-label"
              style={{ color: 'var(--ink-60)', textAlign: 'right' }}
            >
              BUILDS
            </span>
            <span
              className="bav-label"
              style={{ color: 'var(--ink-60)', textAlign: 'right' }}
            >
              GROSS
            </span>
            <span
              className="bav-label"
              style={{ color: 'var(--ink-60)', textAlign: 'right' }}
            >
              RATE
            </span>
            <span
              className="bav-label"
              style={{ color: 'var(--ink-60)', textAlign: 'right' }}
            >
              DUE
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              STATUS
            </span>
            <span />
          </div>

          {rows.length === 0 && (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--ink-60)',
                fontSize: 13,
              }}
            >
              No payouts yet. Run a calculation for a period above.
            </div>
          )}

          {rows.map((s) => {
            const ratePct = (s.commissionRateBp / 100).toFixed(1);
            return (
              <div
                key={s.payoutId}
                role="button"
                tabIndex={0}
                onClick={() => setOpen(s.payoutId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setOpen(s.payoutId);
                }}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '200px 0.7fr 100px 120px 120px 160px 100px 100px',
                  gap: 16,
                  padding: '22px 0',
                  borderBottom: '1px solid var(--ink-10)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 18,
                      letterSpacing: '-0.01em',
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {s.builderName}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: 'var(--ink-60)', marginTop: 2 }}
                  >
                    {s.builderCode} · {TIER_LABEL[s.tier] ?? s.tier}
                  </div>
                </div>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 11, color: 'var(--ink-60)' }}
                >
                  {fmtDate(s.periodStart)} → {fmtDate(s.periodEnd)}
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, textAlign: 'right' }}
                >
                  {s.totalBuildsCompleted}
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, textAlign: 'right' }}
                >
                  {fmtGbp(s.totalRevenueGbp)}
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, textAlign: 'right' }}
                >
                  {ratePct}%
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13, textAlign: 'right', fontWeight: 500 }}
                >
                  {fmtGbp2(s.commissionGbp)}
                </span>
                <div className="flex items-center" style={{ gap: 8 }}>
                  {s.status === 'pending' && (
                    <>
                      <span className="bav-pulse" />
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink)' }}
                      >
                        PENDING
                      </span>
                    </>
                  )}
                  {s.status === 'paid' && (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#1EB53A',
                        }}
                      />
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink)' }}
                      >
                        PAID
                      </span>
                    </>
                  )}
                  {s.status === 'cancelled' && (
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
                        CANCELLED
                      </span>
                    </>
                  )}
                </div>
                <span
                  className="bav-underline justify-self-end"
                  style={{ fontSize: 13, color: 'var(--ink)' }}
                >
                  Open <span className="arrow">→</span>
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 96 }} />
      </div>

      {active && (
        <>
          <div
            className="bav-slideover-backdrop"
            onClick={() => setOpen(null)}
            role="presentation"
          />
          <aside className="bav-slideover-panel" aria-label="Payout detail">
            <div style={{ padding: 40 }}>
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="bav-label"
                    style={{ color: 'var(--ink-60)', marginBottom: 10 }}
                  >
                    — {active.builderCode} · {TIER_LABEL[active.tier] ?? active.tier} tier ·{' '}
                    {(active.commissionRateBp / 100).toFixed(1)}% commission
                  </div>
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 32,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {active.builderName}.
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 12, color: 'var(--ink-60)', marginTop: 6 }}
                  >
                    {fmtDate(active.periodStart)} → {fmtDate(active.periodEnd)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
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
                {(
                  [
                    ['Builds completed', active.totalBuildsCompleted.toString()],
                    ['Gross revenue', fmtGbp(active.totalRevenueGbp)],
                    ['Commission rate', `${(active.commissionRateBp / 100).toFixed(1)}%`],
                    ['Amount due', fmtGbp2(active.commissionGbp)],
                    ['VAT status', 'Not registered · no VAT applied'],
                    [
                      'Stripe transfer',
                      active.stripeTransferId ?? '—',
                    ],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="grid"
                    style={{
                      gridTemplateColumns: '180px 1fr',
                      gap: 16,
                      padding: '14px 0',
                      borderBottom: '1px solid var(--ink-10)',
                    }}
                  >
                    <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      {k.toUpperCase()}
                    </span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ fontSize: 13, textAlign: 'right' }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {active.status === 'paid' && (
                <div style={{ marginTop: 32 }}>
                  <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 12 }}>
                    — Transfer history
                  </div>
                  <div
                    className="flex items-center justify-between flex-wrap"
                    style={{
                      padding: '14px 0',
                      borderTop: '1px solid var(--ink-10)',
                      borderBottom: '1px solid var(--ink-10)',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div className="font-mono tabular-nums" style={{ fontSize: 12 }}>
                        {fmtDate(active.paidAt)}
                      </div>
                      <div
                        className="font-mono tabular-nums"
                        style={{ fontSize: 10, color: 'var(--ink-60)', marginTop: 2 }}
                      >
                        {active.stripeTransferId ?? '—'}
                      </div>
                    </div>
                    <span
                      className="font-mono tabular-nums"
                      style={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {fmtGbp2(active.commissionGbp)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
