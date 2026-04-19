'use client';

import { useState, useMemo } from 'react';
import type { BuilderRow } from '@bav/lib';
import BuilderSlideOver from '@/components/admin/BuilderSlideOver';

type Tier = 'all' | 'probation' | 'standard' | 'preferred' | 'elite';
type SortKey = 'revenue90d' | 'units90d' | 'margin' | 'roi' | 'rma';

const TIERS: { k: Tier; label: string }[] = [
  { k: 'all', label: 'All' },
  { k: 'elite', label: 'Elite' },
  { k: 'preferred', label: 'Preferred' },
  { k: 'standard', label: 'Standard' },
  { k: 'probation', label: 'Probation' },
];

function fmtGbpK(n: number) {
  return `£${(n / 1000).toFixed(1)}k`;
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}
function fmtRma(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function rmaColour(r: number) {
  if (r > 0.05) return '#B94040';
  if (r > 0.02) return '#A8751C';
  return 'var(--ink)';
}

function initialsFor(name: string) {
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '??';
}

function TierChip({ tier }: { tier: BuilderRow['tier'] }) {
  const base =
    'inline-block font-mono tabular-nums uppercase';
  const common: React.CSSProperties = {
    padding: '3px 10px',
    fontSize: 10,
    letterSpacing: '0.18em',
  };
  if (tier === 'elite') {
    return (
      <span
        className={base}
        style={{ ...common, background: 'var(--ink)', color: 'var(--paper)' }}
      >
        elite
      </span>
    );
  }
  if (tier === 'preferred') {
    return (
      <span
        className={base}
        style={{ ...common, border: '1px solid var(--ink)', color: 'var(--ink)' }}
      >
        preferred
      </span>
    );
  }
  if (tier === 'standard') {
    return (
      <span
        className={base}
        style={{
          ...common,
          border: '1px solid var(--ink-10)',
          color: 'var(--ink-60)',
        }}
      >
        standard
      </span>
    );
  }
  return (
    <span
      className={base}
      style={{
        ...common,
        border: '1px solid var(--ink-10)',
        color: 'var(--ink-30)',
      }}
    >
      probation
    </span>
  );
}

function Sparkline({
  values,
  colour = 'var(--ink)',
  width = 96,
  height = 22,
}: {
  values: number[];
  colour?: string;
  width?: number;
  height?: number;
}) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1 || 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const lastValue = values[values.length - 1] ?? 0;
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((lastValue - min) / range) * height;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={colour}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx={lastX} cy={lastY} r="1.75" fill={colour} />
    </svg>
  );
}

const COLUMNS = '280px 120px 90px 120px 90px 80px 110px 110px 40px';

export function BuilderRoster({ builders }: { builders: BuilderRow[] }) {
  const [tierFilter, setTierFilter] = useState<Tier>('all');
  const [sortKey, setSortKey] = useState<SortKey>('revenue90d');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const filtered = builders.filter((b) =>
      tierFilter === 'all' ? true : b.tier === tierFilter,
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === 'revenue90d') return b.revenueGbp90d - a.revenueGbp90d;
      if (sortKey === 'units90d') return b.unitsSold90d - a.unitsSold90d;
      if (sortKey === 'rma') return a.rmaRate90d - b.rmaRate90d;
      if (sortKey === 'margin') return b.marginGbp90d - a.marginGbp90d;
      if (sortKey === 'roi') return b.roiPct90d - a.roiPct90d;
      return 0;
    });
  }, [builders, tierFilter, sortKey]);

  return (
    <>
      {/* filter / sort row */}
      <div
        className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink-10 pb-5"
        style={{ rowGap: 12 }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="bav-label mr-3 text-ink-30">— Tier</span>
          {TIERS.map((t) => (
            <button
              key={t.k}
              type="button"
              className={`bav-filter-chip ${tierFilter === t.k ? 'on' : ''}`.trim()}
              onClick={() => setTierFilter(t.k)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="bav-label text-ink-30">— Sort</span>
          <select
            className="bav-sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="revenue90d">Revenue (90d)</option>
            <option value="units90d">Units sold (90d)</option>
            <option value="margin">Margin</option>
            <option value="roi">ROI</option>
            <option value="rma">RMA rate (low→high)</option>
          </select>
        </div>
      </div>

      {/* table */}
      <div className="bav-builder-table-scroll">
        <div className="bav-builder-table">
          {/* header row */}
          <div
            className="grid items-center border-b border-ink-10"
            style={{
              gridTemplateColumns: COLUMNS,
              gap: 16,
              padding: '14px 16px',
            }}
          >
            <span className="bav-label text-ink-30">Builder</span>
            <span className="bav-label text-ink-30">Tier</span>
            <span className="bav-label text-right text-ink-30">Units 90d</span>
            <span className="bav-label text-right text-ink-30">Revenue 90d</span>
            <span className="bav-label text-right text-ink-30">Margin</span>
            <span className="bav-label text-right text-ink-30">ROI</span>
            <span className="bav-label text-right text-ink-30">RMA rate</span>
            <span className="bav-label text-center text-ink-30">14d trend</span>
            <span />
          </div>

          {/* body rows */}
          {sorted.map((b) => (
            <button
              type="button"
              key={b.builderId}
              onClick={() => setSelectedCode(b.builderCode)}
              className={`bav-builder-row w-full grid items-center border-b border-ink-10 text-left ${
                selectedCode === b.builderCode ? 'is-active' : ''
              }`.trim()}
              style={{
                gridTemplateColumns: COLUMNS,
                gap: 16,
                padding: '18px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--ink-10)',
              }}
            >
              {/* builder identity */}
              <div className="flex items-center gap-3.5">
                <div
                  className="flex flex-shrink-0 items-center justify-center border border-ink-10 font-mono tabular-nums text-ink"
                  style={{ width: 36, height: 36, fontSize: 11 }}
                >
                  {initialsFor(b.displayName)}
                </div>
                <div className="min-w-0">
                  <div
                    className="truncate whitespace-nowrap text-ink"
                    style={{ fontSize: 13.5 }}
                  >
                    {b.displayName}
                    {b.flagged ? (
                      <span
                        className="ml-2.5 font-mono tabular-nums uppercase"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          color: '#A8751C',
                        }}
                      >
                        Under review
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="mt-0.5 font-mono tabular-nums text-ink-30"
                    style={{ fontSize: 11 }}
                  >
                    {b.builderCode}
                  </div>
                </div>
              </div>

              {/* tier */}
              <div>
                <TierChip tier={b.tier} />
              </div>

              {/* units */}
              <div
                className="text-right font-mono tabular-nums text-ink"
                style={{ fontSize: 13 }}
              >
                {b.unitsSold90d}
              </div>

              {/* revenue */}
              <div
                className="text-right font-mono tabular-nums text-ink"
                style={{ fontSize: 13 }}
              >
                {fmtGbpK(b.revenueGbp90d)}
              </div>

              {/* margin (as gbp) */}
              <div
                className="text-right font-mono tabular-nums text-ink-60"
                style={{ fontSize: 13 }}
              >
                {fmtGbpK(b.marginGbp90d)}
              </div>

              {/* roi */}
              <div
                className="text-right font-mono tabular-nums text-ink-60"
                style={{ fontSize: 13 }}
              >
                {fmtPct(b.roiPct90d)}
              </div>

              {/* rma */}
              <div
                className="flex items-center justify-end gap-2 text-right font-mono tabular-nums"
                style={{ fontSize: 13, color: rmaColour(b.rmaRate90d) }}
              >
                {b.rmaRate90d > 0.05 ? (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: '#B94040' }}
                  />
                ) : b.rmaRate90d > 0.02 ? (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: '#A8751C' }}
                  />
                ) : null}
                {fmtRma(b.rmaRate90d)}
              </div>

              {/* trend */}
              <div className="flex justify-center">
                <Sparkline values={b.trend14d} width={96} height={22} />
              </div>

              {/* chevron */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-30)"
                strokeWidth="1.25"
                aria-hidden="true"
                style={{ justifySelf: 'end' }}
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* footer row */}
      <div
        className="mt-8 flex items-center justify-between font-mono tabular-nums text-ink-30"
        style={{ fontSize: 11 }}
      >
        <span>
          Showing {sorted.length} of {builders.length}
        </span>
        <a
          href="/admin/builders/new"
          className="bav-underline text-ink-60 no-underline"
        >
          Add a builder
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* slide-over */}
      <BuilderSlideOver
        builderCode={selectedCode}
        open={selectedCode !== null}
        onClose={() => setSelectedCode(null)}
      />
    </>
  );
}
