import { GlassCard } from '@/components/ui';
import { cn } from '@/lib/cn';

export type KpiTileProps = {
  label: string;
  value: string;
  deltaPct?: number;
  spark?: number[];
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  hint?: string;
};

export function KpiTile({ label, value, deltaPct, spark, tone = 'default', hint }: KpiTileProps) {
  const up = (deltaPct ?? 0) >= 0;
  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="font-mono text-caption uppercase tracking-widest text-ink-500">{label}</div>
        {deltaPct !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-caption tabular-nums',
              up ? 'bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400' : 'bg-semantic-critical/15 text-semantic-critical',
            )}
          >
            <span aria-hidden>{up ? '▲' : '▼'}</span>
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>
      <div
        className={cn(
          'mt-3 font-display text-data-lg font-semibold tabular-nums tracking-[-0.02em]',
          tone === 'positive' && 'text-brand-green',
          tone === 'warning' && 'text-semantic-warning',
          tone === 'critical' && 'text-semantic-critical',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-caption text-ink-500">{hint}</div>}
      {spark && spark.length > 1 && <Sparkline values={spark} positive={up} />}
    </GlassCard>
  );
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-7 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${positive ? 'p' : 'n'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? '#1EB53A' : '#FF4D5E'} stopOpacity="0.4" />
          <stop offset="100%" stopColor={positive ? '#1EB53A' : '#FF4D5E'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#sp-${positive ? 'p' : 'n'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#1EB53A' : '#FF4D5E'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
