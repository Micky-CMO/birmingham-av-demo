import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-md bg-ink-100 dark:bg-obsidian-800',
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </div>
  );
}
