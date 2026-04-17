import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'raised';
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, tone = 'default', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border backdrop-blur-glass',
        'bg-white/70 border-ink-300/60 shadow-glass-light',
        'dark:bg-obsidian-900/70 dark:border-obsidian-500/60 dark:shadow-glass-dark',
        tone === 'raised' && 'bg-white/80 dark:bg-obsidian-800/80',
        className,
      )}
      {...rest}
    />
  );
});
