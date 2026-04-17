import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'positive' | 'warning' | 'critical' | 'info' | 'tier-probation' | 'tier-standard' | 'tier-preferred' | 'tier-elite';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  children: ReactNode;
};

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-obsidian-800 dark:text-ink-300',
  positive: 'bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400',
  warning: 'bg-semantic-warning/15 text-[#8B6516] dark:text-semantic-warning',
  critical: 'bg-semantic-critical/15 text-semantic-critical',
  info: 'bg-semantic-info/15 text-semantic-info',
  'tier-probation': 'bg-tier-probation/15 text-tier-probation',
  'tier-standard': 'bg-tier-standard/15 text-tier-standard',
  'tier-preferred': 'bg-tier-preferred/15 text-tier-preferred',
  'tier-elite': 'bg-tier-elite/15 text-tier-elite',
};

export function Badge({ className, tone = 'neutral', children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-caption font-medium',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
