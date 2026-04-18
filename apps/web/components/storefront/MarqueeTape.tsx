'use client';

import { motion } from 'framer-motion';

const PHRASES = [
  'Hand-built in Birmingham',
  'Tested on every bench',
  '12-month warranty',
  'Free UK delivery',
  'Serialised & traceable',
  'Built by real engineers',
];

export function MarqueeTape() {
  const content = (
    <div className="flex shrink-0 items-center gap-6 pr-6 sm:gap-12 sm:pr-12">
      {PHRASES.map((p) => (
        <span key={p} className="flex items-center gap-6 whitespace-nowrap font-display text-[clamp(1.25rem,4vw,3rem)] font-semibold uppercase tracking-[-0.02em] sm:gap-12">
          {p}
          <span aria-hidden className="h-2 w-2 rotate-45 bg-brand-green sm:h-2.5 sm:w-2.5" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative w-full overflow-hidden border-y border-ink-900/80 bg-ink-900 py-5 text-ink-50 sm:py-6 dark:border-ink-50/10 dark:bg-obsidian-950">
      <motion.div
        className="flex"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        {content}
        {content}
      </motion.div>
    </div>
  );
}
