import type { ReactNode } from 'react';

export function PageHero({
  eyebrow,
  title,
  lead,
  right,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-10 pt-16 sm:gap-12 sm:px-6 sm:pb-12 sm:pt-24 md:grid-cols-12 md:pb-20 md:pt-32">
      <div className="md:col-span-8">
        {eyebrow && (
          <div className="mb-6 flex items-center gap-3 font-mono text-caption uppercase tracking-[0.3em] text-ink-500">
            <span aria-hidden className="h-px w-10 bg-brand-green" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
          {title}
        </h1>
        {lead && <div className="mt-6 max-w-2xl text-body leading-relaxed text-ink-700 dark:text-ink-300 md:text-lg">{lead}</div>}
      </div>
      {right && <div className="md:col-span-4">{right}</div>}
    </header>
  );
}
