import Link from 'next/link';
import { GlassCard } from '@/components/ui';

const ACTIONS = [
  { href: '/admin/orders', label: 'Process orders', icon: '⌥' },
  { href: '/admin/returns', label: 'Review RMAs', icon: '↺' },
  { href: '/admin/support', label: 'Open tickets', icon: '☰' },
  { href: '/admin/products', label: 'Add a product', icon: '＋' },
  { href: '/admin/builders', label: 'Builder roster', icon: '☉' },
  { href: '/api/ops/ingest/ebay', label: 'Pull from eBay', icon: '↧' },
];

export function QuickActions() {
  return (
    <GlassCard className="p-6">
      <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Quick actions</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.href + a.label}
            href={a.href}
            className="group flex items-center gap-3 rounded-md border border-ink-300/60 bg-white/40 px-3 py-3 text-small font-medium transition-all hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-lift dark:border-obsidian-500/60 dark:bg-obsidian-900/40"
          >
            <span aria-hidden className="font-mono text-base text-ink-500 group-hover:text-brand-green">
              {a.icon}
            </span>
            <span className="truncate">{a.label}</span>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
