import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'critical' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-240 ease-unfold disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 dark:focus-visible:ring-offset-obsidian-900';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-green text-white hover:bg-brand-green-600 active:bg-brand-green-600 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]',
  secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-300/60 dark:bg-obsidian-800 dark:text-ink-50 dark:hover:bg-obsidian-700',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800',
  critical: 'bg-semantic-critical text-white hover:brightness-95',
  outline:
    'border border-ink-300 bg-transparent text-ink-900 hover:bg-ink-50 dark:border-obsidian-500 dark:text-ink-50 dark:hover:bg-obsidian-800',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-6 text-body',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, leading, trailing, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leading
      )}
      <span>{children}</span>
      {trailing}
    </button>
  );
});
