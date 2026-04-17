'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GlassCard, Badge } from '@/components/ui';
import { formatGbp } from '@bav/lib';

const SPEC_CAROUSEL: Array<{ label: string; value: string; tone: 'green' | 'info' | 'warning' }> = [
  { label: 'CPU', value: 'Ryzen 7 5800X · 8C/16T · 4.7 GHz', tone: 'green' },
  { label: 'GPU', value: 'RTX 4070 · 12GB GDDR6X', tone: 'green' },
  { label: 'RAM', value: '32GB DDR4-3600 CL16', tone: 'info' },
  { label: 'Storage', value: '1TB NVMe Gen4 · 2TB HDD', tone: 'info' },
  { label: 'Cooling', value: '240mm AIO liquid cooler', tone: 'warning' },
];

export function FeaturedPc() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SPEC_CAROUSEL.length), 4000);
    return () => clearInterval(t);
  }, []);

  const spec = SPEC_CAROUSEL[i]!;

  return (
    <GlassCard className="relative overflow-hidden p-8">
      <div className="flex items-center justify-between">
        <Badge tone="positive">In stock</Badge>
        <span className="font-mono text-caption text-ink-500">BAV-FEAT-001</span>
      </div>
      <div className="mt-8">
        <h3 className="text-h2 font-display">Aegis Ultra</h3>
        <p className="mt-2 text-small text-ink-500">Hand-built gaming rig. Assembled in Birmingham.</p>
      </div>
      <div className="mt-8 h-40 rounded-md bg-gradient-to-br from-brand-green/15 via-brand-green/5 to-transparent" />
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col gap-1"
        >
          <span className="text-caption text-ink-500">{spec.label}</span>
          <span className="text-body font-medium">{spec.value}</span>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex items-end justify-between border-t border-ink-300/60 pt-6 dark:border-obsidian-500/60">
        <div>
          <div className="text-caption text-ink-500">From</div>
          <div className="text-data-lg font-display">{formatGbp(1299)}</div>
        </div>
        <a
          href="/shop/gaming-pc-bundles"
          className="text-small font-medium text-brand-green underline-offset-4 hover:underline"
        >
          Explore bundles &rarr;
        </a>
      </div>
    </GlassCard>
  );
}
