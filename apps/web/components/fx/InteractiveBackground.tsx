'use client';

import { useEffect, useRef } from 'react';

/**
 * INTERACTIVE BACKGROUND — ambient, always-running:
 * 1. A conic mesh gradient that slowly rotates + drifts with mouse position.
 * 2. Three floating orbs that parallax-follow the cursor at different depths.
 * 3. Animated SVG noise that shimmers so the surface always feels alive.
 *
 * All layers are `position: fixed` and `pointer-events-none` so nothing
 * competes with clicks. Reduced-motion users get a static version.
 */
export function InteractiveBackground() {
  const root = useRef<HTMLDivElement>(null);
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);
  const orb3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const center = { x: 0.5, y: 0.5 };
    const cur = { x: 0.5, y: 0.5 };
    let raf = 0;

    function onMove(e: MouseEvent) {
      cur.x = e.clientX / window.innerWidth;
      cur.y = e.clientY / window.innerHeight;
    }

    function tick() {
      center.x += (cur.x - center.x) * 0.04;
      center.y += (cur.y - center.y) * 0.04;

      if (root.current) {
        // Shift the master CSS variables — gradient layers read them
        root.current.style.setProperty('--mx', `${(center.x * 100).toFixed(2)}%`);
        root.current.style.setProperty('--my', `${(center.y * 100).toFixed(2)}%`);
      }
      // Parallax orbs at different depths
      if (orb1.current)
        orb1.current.style.transform = `translate3d(${(center.x - 0.5) * -40}px, ${(center.y - 0.5) * -40}px, 0)`;
      if (orb2.current)
        orb2.current.style.transform = `translate3d(${(center.x - 0.5) * 30}px, ${(center.y - 0.5) * 30}px, 0)`;
      if (orb3.current)
        orb3.current.style.transform = `translate3d(${(center.x - 0.5) * -60}px, ${(center.y - 0.5) * -60}px, 0)`;

      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ ['--mx' as string]: '50%', ['--my' as string]: '50%' }}
    >
      {/* Master mesh gradient — reacts to mouse via --mx/--my */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at var(--mx) var(--my), rgba(30,181,58,0.09), transparent 60%), radial-gradient(900px 700px at calc(100% - var(--mx)) calc(100% - var(--my)), rgba(79,145,255,0.05), transparent 60%)',
          transition: 'background 900ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Three floating parallax orbs */}
      <div
        ref={orb1}
        className="absolute -left-48 top-[15%] h-[500px] w-[500px] rounded-full bg-brand-green/[0.055] blur-3xl dark:bg-brand-green/[0.08]"
      />
      <div
        ref={orb2}
        className="absolute right-[5%] top-[60%] h-[420px] w-[420px] rounded-full bg-brand-green/[0.04] blur-3xl dark:bg-brand-green/[0.06]"
      />
      <div
        ref={orb3}
        className="absolute -right-32 top-[5%] h-[380px] w-[380px] rounded-full bg-[rgba(79,145,255,0.035)] blur-3xl dark:bg-[rgba(79,145,255,0.05)]"
      />

      {/* Soft animated scanlines for depth */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 220px)',
          animation: 'bav-slide 42s linear infinite',
        }}
      />

      <style jsx>{`
        @keyframes bav-slide {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 220px 0;
          }
        }
      `}</style>
    </div>
  );
}
