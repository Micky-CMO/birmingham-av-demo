'use client';

import { useEffect, useState } from 'react';

// Artefact 37 — Builder detail slide-over.
// Overlays /admin/builders when a roster row is clicked.
// Mount this component once at the page level and control `open` from the roster.

type Tab = 'performance' | 'builds' | 'returns' | 'flags';

type BuilderData = {
  builderId: string;
  builderCode: string;
  displayName: string;
  legalName?: string | null;
  tier: 'probation' | 'standard' | 'preferred' | 'elite';
  status: string;
  joinedAt: string;
  avatarUrl: string | null;
  bio: string | null;
  specialities: string[];
  yearsBuilding: number;
  favouriteBuild: string | null;
  qualityScore: number;
  rmaRateRolling90d: number;
  totalUnitsBuilt: number;
  totalUnitsSold: number;
  avgBuildMinutes: number;
  avgResponseHours: number;
  activeBuilds: Array<{
    orderNumber: string;
    sku: string;
    title: string;
    customer: string;
    startedAt: string;
    dayInBuild: number;
  }>;
  recentReturns: Array<{
    returnNumber: string;
    reason: string;
    severity: number;
    status: string;
    product: string;
    createdAt: string;
  }>;
  aiFlags: Array<{
    id: string;
    severity: 'notice' | 'alert';
    text: string;
    raisedAt: string;
    acknowledged: boolean;
  }>;
  shipments14d: number[];
  tierHistory: Array<{ date: string; change: string; note: string }>;
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

const TIER_LABEL: Record<BuilderData['tier'], string> = {
  probation: 'Probation',
  standard: 'Standard',
  preferred: 'Preferred',
  elite: 'Elite',
};

export default function BuilderSlideOver({
  builderCode,
  open,
  onClose,
}: {
  builderCode: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('performance');
  const [data, setData] = useState<BuilderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !builderCode) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/admin/builders/${builderCode}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        const json = (await r.json()) as BuilderData;
        setData(json);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load builder');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, builderCode]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="bav-slideover-backdrop" onClick={onClose} />
      <aside
        className="bav-slideover-panel"
        role="dialog"
        aria-label={`Builder ${builderCode ?? ''}`}
      >
        <div className="px-10 pt-8 pb-10">
          <div className="mb-9 flex items-center justify-between">
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Builder
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="bav-hover-opa font-mono text-[12px] tracking-[0.08em]"
            >
              CLOSE ✕
            </button>
          </div>

          {loading && (
            <p className="bav-label" style={{ color: 'var(--ink-60)' }}>
              Loading…
            </p>
          )}
          {error && (
            <p className="text-[13px]" style={{ color: '#C17817' }}>
              {error}
            </p>
          )}
          {data && (
            <BuilderBody data={data} tab={tab} setTab={setTab} />
          )}
        </div>
      </aside>
    </>
  );
}

function BuilderBody({
  data,
  tab,
  setTab,
}: {
  data: BuilderData;
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const unackFlagCount = data.aiFlags.filter((f) => !f.acknowledged).length;
  const tierLabel = TIER_LABEL[data.tier];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'performance', label: 'Performance' },
    { key: 'builds', label: 'Active builds' },
    { key: 'returns', label: 'Returns' },
    { key: 'flags', label: 'AI flags' },
  ];

  return (
    <>
      {/* Identity */}
      <div className="mb-7 flex items-start gap-5">
        <div className="bav-ink-canvas h-20 w-20 flex-shrink-0" />
        <div>
          <div className="mb-1.5 font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
            {data.builderCode}
          </div>
          <h2
            className="font-display text-[32px] font-light leading-[1.05]"
            style={{ letterSpacing: '-0.01em', fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            {splitName(data.displayName)}
          </h2>
          <div
            className="mt-2.5 flex items-center gap-3.5 text-[13px]"
            style={{ color: 'var(--ink-60)' }}
          >
            <span style={{ color: data.tier === 'preferred' || data.tier === 'elite' ? 'var(--ink)' : 'var(--ink-60)' }}>
              {tierLabel}
            </span>
            <span style={{ color: 'var(--ink-30)' }}>·</span>
            <span>{data.yearsBuilding} years</span>
            <span style={{ color: 'var(--ink-30)' }}>·</span>
            <span>
              Joined {new Date(data.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {data.bio && (
        <p className="mb-7 text-[14px] leading-[1.6]" style={{ color: 'var(--ink-60)' }}>
          {data.bio}
        </p>
      )}

      {/* Stat grid */}
      <div
        className="mb-8 grid grid-cols-2"
        style={{ border: '1px solid var(--ink-10)' }}
      >
        <Stat label="Units built" value={data.totalUnitsBuilt.toString()} />
        <Stat label="Quality" value={data.qualityScore.toFixed(2)} borderLeft />
        <Stat
          label="RMA · 90d"
          value={`${(data.rmaRateRolling90d * 100).toFixed(1)}%`}
          borderTop
        />
        <Stat label="Avg build" value={`${data.avgBuildMinutes}m`} borderTop borderLeft />
      </div>

      {/* Tab nav */}
      <div
        className="mb-6 flex gap-7"
        style={{ borderBottom: '1px solid var(--ink-10)' }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={'bav-tab-link pb-2.5' + (tab === t.key ? ' active' : '')}
          >
            {t.label}
            {t.key === 'flags' && unackFlagCount > 0 && (
              <span className="ml-1.5 font-mono text-[11px]" style={{ color: 'var(--ink)' }}>
                ·{unackFlagCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'performance' && <PerformanceTab data={data} />}
      {tab === 'builds' && <BuildsTab builds={data.activeBuilds} />}
      {tab === 'returns' && <ReturnsTab returns={data.recentReturns} />}
      {tab === 'flags' && <FlagsTab flags={data.aiFlags} />}

      {/* Actions footer */}
      <div
        className="mt-9 flex gap-3 pt-6"
        style={{ borderTop: '1px solid var(--ink-10)' }}
      >
        <a
          href={`/builders/${data.builderCode}`}
          className="bav-cta-secondary"
          style={{ flex: 1, width: 'auto', padding: '17px 36px' }}
        >
          View public profile
        </a>
        <button className="bav-cta" style={{ flex: 1, width: 'auto', padding: '18px 36px' }}>
          Message builder
        </button>
      </div>
      <div
        className="mt-4 flex justify-between text-[12px]"
        style={{ color: 'var(--ink-30)' }}
      >
        <button type="button" className="bav-hover-opa">
          Change tier
        </button>
        <button type="button" className="bav-hover-opa">
          Suspend
        </button>
      </div>
    </>
  );
}

function splitName(displayName: string) {
  const parts = displayName.split(' ');
  if (parts.length < 2) return displayName;
  const first = parts[0];
  const rest = parts.slice(1).join(' ');
  return (
    <>
      {first} <span className="bav-italic">{rest}</span>
    </>
  );
}

function PerformanceTab({ data }: { data: BuilderData }) {
  const total14d = data.shipments14d.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="mb-7">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            14-day shipments
          </span>
          <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
            {total14d} units
          </span>
        </div>
        <Sparkline data={data.shipments14d} width={440} height={72} />
      </div>

      {data.specialities.length > 0 && (
        <div className="mb-7">
          <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>
            — Specialities
          </div>
          <div className="flex flex-wrap gap-2">
            {data.specialities.map((s) => (
              <span
                key={s}
                className="text-[12px]"
                style={{ border: '1px solid var(--ink-10)', padding: '6px 12px', color: 'var(--ink-60)' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.favouriteBuild && (
        <div className="mb-7">
          <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>
            — Favourite build
          </div>
          <p
            className="m-0 text-[18px] italic leading-[1.4]"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 300, color: 'var(--ink)' }}
          >
            &ldquo;{data.favouriteBuild}&rdquo;
          </p>
        </div>
      )}

      {data.tierHistory.length > 0 && (
        <div>
          <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>
            — Tier history
          </div>
          <div>
            {data.tierHistory.map((h, i) => (
              <div
                key={i}
                className="grid gap-3.5 py-3"
                style={{ gridTemplateColumns: '100px 1fr', borderTop: '1px solid var(--ink-10)' }}
              >
                <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
                  {h.date}
                </span>
                <div>
                  <div className="text-[13px]">{h.change}</div>
                  <div className="mt-1 text-[12px]" style={{ color: 'var(--ink-60)' }}>
                    {h.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BuildsTab({ builds }: { builds: BuilderData['activeBuilds'] }) {
  if (builds.length === 0) {
    return (
      <p className="bav-label py-6" style={{ color: 'var(--ink-30)' }}>
        — No active builds
      </p>
    );
  }
  return (
    <div>
      {builds.map((b) => (
        <a
          key={b.orderNumber}
          href={`/admin/orders/${b.orderNumber}`}
          className="bav-admin-row block py-[18px]"
          style={{ borderTop: '1px solid var(--ink-10)' }}
        >
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
              {b.orderNumber}
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              Day {b.dayInBuild}
            </span>
          </div>
          <div className="mb-1 text-[14px]">{b.title}</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-60)' }}>
            {b.customer} · started {b.startedAt}
          </div>
        </a>
      ))}
      <div style={{ borderTop: '1px solid var(--ink-10)' }} />
    </div>
  );
}

function ReturnsTab({ returns }: { returns: BuilderData['recentReturns'] }) {
  if (returns.length === 0) {
    return (
      <p className="bav-label py-6" style={{ color: 'var(--ink-30)' }}>
        — No recent returns
      </p>
    );
  }
  return (
    <div>
      {returns.map((r) => (
        <a
          key={r.returnNumber}
          href={`/admin/returns/${r.returnNumber}`}
          className="bav-admin-row block py-[18px]"
          style={{ borderTop: '1px solid var(--ink-10)' }}
        >
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-mono text-[12px]" style={{ color: 'var(--ink-60)' }}>
              {r.returnNumber}
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              {r.status}
            </span>
          </div>
          <div className="mb-1.5 text-[14px]">{r.product}</div>
          <div className="flex items-center gap-3.5">
            <span className="text-[12px]" style={{ color: 'var(--ink-60)' }}>
              {REASON_LABEL[r.reason] ?? r.reason}
            </span>
            <SeverityBar value={r.severity} />
          </div>
        </a>
      ))}
      <div style={{ borderTop: '1px solid var(--ink-10)' }} />
    </div>
  );
}

function FlagsTab({ flags }: { flags: BuilderData['aiFlags'] }) {
  if (flags.length === 0) {
    return (
      <p className="bav-label py-6" style={{ color: 'var(--ink-30)' }}>
        — No flags
      </p>
    );
  }
  return (
    <div>
      {flags.map((f) => (
        <div
          key={f.id}
          className="py-[18px]"
          style={{ borderTop: '1px solid var(--ink-10)' }}
        >
          <div className="mb-2 flex items-baseline justify-between">
            <span
              className="bav-label"
              style={{ color: f.acknowledged ? 'var(--ink-30)' : 'var(--ink-60)' }}
            >
              {f.severity === 'notice' ? 'AI · Notice' : 'AI · Alert'}
            </span>
            <span className="font-mono text-[12px]" style={{ color: 'var(--ink-30)' }}>
              {f.raisedAt}
            </span>
          </div>
          <p
            className="mb-3.5 text-[14px] leading-[1.55]"
            style={{ color: f.acknowledged ? 'var(--ink-60)' : 'var(--ink)' }}
          >
            {f.text}
          </p>
          {!f.acknowledged ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="bav-label bav-hover-opa"
                style={{ color: 'var(--ink)', borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}
              >
                Acknowledge
              </button>
              <button
                type="button"
                className="bav-label bav-hover-opa"
                style={{
                  color: 'var(--ink-60)',
                  borderBottom: '1px solid var(--ink-10)',
                  paddingBottom: 2,
                }}
              >
                Resolve
              </button>
            </div>
          ) : (
            <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
              — Resolved
            </span>
          )}
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--ink-10)' }} />
    </div>
  );
}

function Stat({
  label,
  value,
  borderTop,
  borderLeft,
}: {
  label: string;
  value: string;
  borderTop?: boolean;
  borderLeft?: boolean;
}) {
  return (
    <div
      style={{
        padding: '20px 22px',
        borderTop: borderTop ? '1px solid var(--ink-10)' : 'none',
        borderLeft: borderLeft ? '1px solid var(--ink-10)' : 'none',
      }}
    >
      <div className="bav-label mb-2" style={{ color: 'var(--ink-60)' }}>
        {label}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 22, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
    </div>
  );
}

function Sparkline({
  data,
  width = 140,
  height = 30,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 6) - 3}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="block">
      <polyline points={points} fill="none" stroke="var(--ink)" strokeWidth="1" />
    </svg>
  );
}

function SeverityBar({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="bav-severity-track" style={{ width: 56 }}>
        <div className="bav-severity-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <span
        className="font-mono text-[11px]"
        style={{ color: 'var(--ink-60)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value.toFixed(2)}
      </span>
    </div>
  );
}
