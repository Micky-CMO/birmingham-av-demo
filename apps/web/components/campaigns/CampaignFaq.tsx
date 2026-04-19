'use client';

import { useState } from 'react';

/**
 * Shared FAQ accordion used by campaign landing pages (artefacts 83/84/85).
 * Client component because only one panel is open at a time.
 */
export type CampaignFaqItem = { q: string; a: string };

export function CampaignFaq({ items }: { items: CampaignFaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map((row, i) => {
        const isOpen = open === i;
        const isLast = i === items.length - 1;
        return (
          <div
            key={i}
            className={`border-t border-ink-10 ${isLast ? 'border-b' : ''}`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-left text-[16px] text-ink"
            >
              <span>{row.q}</span>
              <span className="font-mono text-[11px] text-ink-30">{isOpen ? '—' : '+'}</span>
            </button>
            {isOpen && (
              <div className="max-w-[640px] pb-6 text-[14px] leading-[1.7] text-ink-60">
                {row.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CampaignFaq;
