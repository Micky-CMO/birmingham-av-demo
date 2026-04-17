'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassCard, Badge } from '@/components/ui';
import type { ActivityItem } from '@/lib/services/dashboard';

const TYPE_ICON = {
  order: '⌥',
  return: '↺',
  ticket: '☰',
  build: '⚙',
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <GlassCard className="flex h-full flex-col p-0">
      <header className="flex items-center justify-between border-b border-ink-300/50 px-6 py-4 dark:border-obsidian-500/40">
        <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Live activity</p>
        <span className="flex items-center gap-2 font-mono text-caption text-ink-500">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
          Streaming
        </span>
      </header>
      <ul className="flex-1 divide-y divide-ink-300/40 overflow-y-auto dark:divide-obsidian-500/30">
        {items.map((it, i) => (
          <motion.li
            key={`${it.type}-${i}-${it.at}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={it.href}
              className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-ink-50/60 dark:hover:bg-obsidian-800/50"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-100 font-mono text-caption text-ink-700 dark:bg-obsidian-800 dark:text-ink-300">
                {TYPE_ICON[it.type]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-small text-ink-900 dark:text-ink-50">{it.title}</span>
                  <span className="shrink-0 font-mono text-caption text-ink-500">{relTime(it.at)}</span>
                </div>
                <div className="mt-0.5 truncate text-caption text-ink-500">{it.subtitle}</div>
              </div>
              {it.tone && it.tone !== 'neutral' && (
                <Badge tone={it.tone}>{it.type}</Badge>
              )}
            </Link>
          </motion.li>
        ))}
        {items.length === 0 && (
          <li className="px-6 py-12 text-center text-small text-ink-500">No activity yet.</li>
        )}
      </ul>
    </GlassCard>
  );
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}
