'use client';

import { useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Spotlight gradient that follows the cursor inside a glass card.
 * Pure CSS variables: no re-render, GPU-cheap.
 */
export function SpotlightCard({
  children,
  className,
  intensity = 0.18,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    el.style.setProperty('--alpha', String(intensity));
  }
  function onLeave() {
    if (ref.current) ref.current.style.setProperty('--alpha', '0');
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('group relative overflow-hidden', className)}
      style={{
        ['--mx' as string]: '50%',
        ['--my' as string]: '50%',
        ['--alpha' as string]: 0,
      }}
      {...rest}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-420"
        style={{
          background:
            'radial-gradient(420px circle at var(--mx) var(--my), rgba(30, 181, 58, var(--alpha)), transparent 60%)',
        }}
      />
      {/* Border glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-420 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(400px circle at var(--mx) var(--my), rgba(30, 181, 58, 0.35), transparent 40%)',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
    </div>
  );
}
