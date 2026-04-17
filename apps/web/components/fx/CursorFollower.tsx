'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor: a 6px dot that lerps to the mouse and a ring that expands
 * when over anything matching the interactive selector. Hidden on touch.
 */
export function CursorFollower() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    setVisible(true);

    const target = { x: 0, y: 0 };
    const ringPos = { x: 0, y: 0 };
    const dotPos = { x: 0, y: 0 };
    let hovering = false;
    let raf = 0;

    function onMove(e: MouseEvent) {
      target.x = e.clientX;
      target.y = e.clientY;
    }

    function onOver(e: MouseEvent) {
      const t = e.target as Element | null;
      hovering = !!t?.closest('button, a, [role="button"], input, textarea, select');
    }

    function tick() {
      dotPos.x += (target.x - dotPos.x) * 0.45;
      dotPos.y += (target.y - dotPos.y) * 0.45;
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${dotPos.x - 3}px, ${dotPos.y - 3}px, 0)`;
      }
      if (ring.current) {
        const s = hovering ? 2.2 : 1;
        ring.current.style.transform = `translate3d(${ringPos.x - 16}px, ${ringPos.y - 16}px, 0) scale(${s})`;
        ring.current.style.opacity = hovering ? '0.9' : '0.45';
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!visible) return null;
  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-8 w-8 rounded-full border border-brand-green/70 mix-blend-difference transition-[transform,opacity] duration-100 ease-out"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-1.5 w-1.5 rounded-full bg-brand-green mix-blend-difference"
        style={{ willChange: 'transform' }}
      />
    </>
  );
}
