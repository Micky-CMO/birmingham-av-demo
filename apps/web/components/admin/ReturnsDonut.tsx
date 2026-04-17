import { GlassCard } from '@/components/ui';
import type { ReasonSlice } from '@/lib/services/dashboard';

const PALETTE = ['#1EB53A', '#4F91FF', '#F0B849', '#FF4D5E', '#A78BFA', '#22D3EE', '#F472B6', '#FB923C'];

const REASON_LABEL: Record<string, string> = {
  dead_on_arrival: 'DOA',
  hardware_fault: 'Hardware fault',
  not_as_described: 'Not as described',
  damaged_in_transit: 'Damage in transit',
  changed_mind: 'Changed mind',
  wrong_item: 'Wrong item',
  other: 'Other',
};

export function ReturnsDonut({ slices }: { slices: ReasonSlice[] }) {
  if (slices.length === 0) {
    return (
      <GlassCard className="flex h-full items-center justify-center p-6 text-small text-ink-500">
        No returns data yet.
      </GlassCard>
    );
  }

  const total = slices.reduce((s, x) => s + x.count, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <GlassCard className="p-6">
      <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Returns reasons</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <svg viewBox="-60 -60 120 120" className="h-40 w-full">
          {slices.map((s, i) => {
            const len = (s.pct * circumference);
            const dash = `${len} ${circumference - len}`;
            const el = (
              <circle
                key={s.reason}
                r={radius}
                cx="0"
                cy="0"
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += len;
            return el;
          })}
          <text x="0" y="-2" textAnchor="middle" className="fill-current font-display" fontSize="20" fontWeight="600">
            {total}
          </text>
          <text x="0" y="14" textAnchor="middle" className="fill-current font-mono opacity-50" fontSize="8">
            TOTAL
          </text>
        </svg>
        <ul className="space-y-2 text-small">
          {slices.map((s, i) => (
            <li key={s.reason} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate">{REASON_LABEL[s.reason] ?? s.reason}</span>
              </span>
              <span className="font-mono text-caption text-ink-500 tabular-nums">{(s.pct * 100).toFixed(0)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}
