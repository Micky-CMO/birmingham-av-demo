import Link from 'next/link';
import { GlassCard, Badge } from '@/components/ui';
import type { StockAlert } from '@/lib/services/dashboard';

export function StockAlerts({ alerts }: { alerts: StockAlert[] }) {
  return (
    <GlassCard className="flex h-full flex-col p-0">
      <header className="flex items-center justify-between border-b border-ink-300/50 px-6 py-4 dark:border-obsidian-500/40">
        <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Low stock</p>
        <span className="font-mono text-caption text-ink-500">{alerts.length} alerts</span>
      </header>
      <ul className="flex-1 divide-y divide-ink-300/40 dark:divide-obsidian-500/30">
        {alerts.length === 0 && <li className="px-6 py-10 text-center text-small text-ink-500">All stock healthy.</li>}
        {alerts.map((a) => (
          <li key={a.productId} className="flex items-center gap-3 px-6 py-3">
            <div className="min-w-0 flex-1">
              <Link href="/admin/products" className="block truncate text-small font-medium hover:text-brand-green">
                {a.title}
              </Link>
              <div className="font-mono text-caption text-ink-500">{a.sku}</div>
            </div>
            <Badge tone={a.stockQty === 0 ? 'critical' : a.stockQty <= 1 ? 'warning' : 'info'}>
              {a.stockQty} left
            </Badge>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
