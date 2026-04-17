'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/cn';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
] as const;

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const activeIndex = OPTIONS.findIndex((o) => o.value === mode);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative inline-flex h-8 items-center rounded-md border border-ink-300/70 bg-white/70 p-0.5 backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/60"
    >
      <motion.span
        aria-hidden
        className="absolute bottom-0.5 top-0.5 rounded-sm bg-ink-100 dark:bg-obsidian-700"
        animate={{
          left: `calc(${activeIndex} * (100% / 3) + 0.125rem)`,
          width: `calc(100% / 3 - 0.25rem)`,
        }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      />
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = o.value === mode;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setMode(o.value)}
            className={cn(
              'relative z-10 flex h-7 w-9 items-center justify-center text-ink-500 transition-colors duration-240',
              active && 'text-ink-900 dark:text-ink-50',
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
    </svg>
  );
}
