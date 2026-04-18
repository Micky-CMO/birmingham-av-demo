import Image from 'next/image';
import { GlassCard, Badge } from '@/components/ui';
import { formatGbp } from '@bav/lib';
import type { TopBuilder } from '@/lib/services/dashboard';

export function TopBuildersList({ builders }: { builders: TopBuilder[] }) {
  const top = builders[0];
  return (
    <GlassCard className="flex h-full flex-col p-0">
      <header className="flex items-center justify-between border-b border-ink-300/50 px-6 py-4 dark:border-obsidian-500/40">
        <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Top builders · 90d</p>
        {top && (
          <span className="font-mono text-caption text-brand-green">
            #{top.builderCode} leading
          </span>
        )}
      </header>
      <ol className="flex-1 divide-y divide-ink-300/40 dark:divide-obsidian-500/30">
        {builders.length === 0 && (
          <li className="px-6 py-12 text-center text-small text-ink-500">No builder activity yet.</li>
        )}
        {builders.map((b, i) => (
          <li key={b.builderCode} className="flex items-center gap-3 px-6 py-3">
            <span className="w-5 font-mono text-caption text-ink-500">{i + 1}</span>
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink-100 dark:bg-obsidian-800">
              {b.avatarUrl && <Image src={b.avatarUrl} alt={b.displayName} fill className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-small font-medium">{b.displayName}</div>
              <div className="font-mono text-caption text-ink-500">{b.builderCode} · {b.unitsSold} sold</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-small font-semibold tabular-nums">{formatGbp(b.marginGbp)}</div>
              <Badge tone={b.rmaRate < 0.02 ? 'positive' : b.rmaRate < 0.04 ? 'info' : 'warning'}>
                {(b.rmaRate * 100).toFixed(2)}% RMA
              </Badge>
            </div>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}
