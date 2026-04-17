import { GlassCard } from '@/components/ui';

/**
 * Half-circle gauge showing build-queue utilisation. Pure SVG.
 */
export function BuildQueueGauge({ load }: { load: number }) {
  const pct = Math.max(0, Math.min(1, load));
  const radius = 80;
  const circumference = Math.PI * radius;
  const dash = circumference * pct;

  const tone = pct < 0.6 ? '#1EB53A' : pct < 0.85 ? '#F0B849' : '#FF4D5E';
  const status = pct < 0.6 ? 'Healthy' : pct < 0.85 ? 'Busy' : 'At capacity';

  return (
    <GlassCard className="flex h-full flex-col items-center justify-between p-6">
      <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Build queue load</p>
      <svg viewBox="-100 -100 200 110" className="my-2 h-32 w-full">
        <path
          d="M -80 0 A 80 80 0 0 1 80 0"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M -80 0 A 80 80 0 0 1 80 0"
          fill="none"
          stroke={tone}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <text x="0" y="-12" textAnchor="middle" className="font-display fill-current" fontSize="32" fontWeight="600">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="flex items-center gap-2 font-mono text-caption uppercase tracking-widest" style={{ color: tone }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
        {status}
      </div>
    </GlassCard>
  );
}
