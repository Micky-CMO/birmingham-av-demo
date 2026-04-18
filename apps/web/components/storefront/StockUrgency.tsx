'use client';

import { motion } from 'framer-motion';

export function StockUrgency({ stockQty }: { stockQty: number }) {
  if (stockQty <= 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-sm bg-semantic-critical/15 px-3 py-1.5 font-mono text-caption uppercase tracking-[0.2em] text-semantic-critical">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-semantic-critical" />
        Sold out — next batch arriving soon
      </div>
    );
  }
  if (stockQty === 1) {
    return (
      <motion.div
        initial={{ scale: 0.94 }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex items-center gap-2 rounded-sm bg-semantic-warning/15 px-3 py-1.5 font-mono text-caption uppercase tracking-[0.2em] text-semantic-warning"
      >
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-semantic-warning" />
        Only 1 left — going fast
      </motion.div>
    );
  }
  if (stockQty <= 3) {
    return (
      <div className="inline-flex items-center gap-2 rounded-sm bg-semantic-warning/15 px-3 py-1.5 font-mono text-caption uppercase tracking-[0.2em] text-semantic-warning">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-semantic-warning" />
        Only {stockQty} left
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-sm bg-brand-green-100 px-3 py-1.5 font-mono text-caption uppercase tracking-[0.2em] text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400">
      <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
      In stock · ships today
    </div>
  );
}

export function SavingsBadge({ priceGbp, compareAtGbp }: { priceGbp: number; compareAtGbp: number }) {
  if (compareAtGbp <= priceGbp) return null;
  const pct = Math.round(((compareAtGbp - priceGbp) / compareAtGbp) * 100);
  const saved = compareAtGbp - priceGbp;
  return (
    <div className="inline-flex items-center gap-2 rounded-sm bg-brand-green px-3 py-1.5 font-mono text-caption uppercase tracking-[0.2em] text-white">
      Save £{saved.toFixed(0)} · {pct}% off
    </div>
  );
}
