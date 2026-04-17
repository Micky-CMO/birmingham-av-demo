import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border bg-white px-3 text-body text-ink-900 placeholder:text-ink-500',
        'border-ink-300 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/25',
        'dark:bg-obsidian-900 dark:text-ink-50 dark:border-obsidian-500 dark:placeholder:text-ink-500',
        invalid && 'border-semantic-critical focus:border-semantic-critical focus:ring-semantic-critical/25',
        className,
      )}
      {...rest}
    />
  );
});
