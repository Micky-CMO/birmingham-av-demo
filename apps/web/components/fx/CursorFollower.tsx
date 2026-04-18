'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor: a 6px brand-green dot that lerps to the mouse and a thin ring
 * that expands when over anything matching the interactive selector. Uses a
 * two-layer approach (solid brand dot + soft outer glow + thin translucent
 * ring) so it stays visible on white, grey, and dark backgrounds without
 * relying on mix-blend-difference. Hidden on touch / no-hover devices.
 */
export function CursorFollower() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    setVisible(true);

    // Detect current theme by reading the data-theme attribute on <html>.
    // Re-run when it changes so the drop-shadow flips correctly.
    function readTheme() {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    }
    readTheme();
    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

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
        ring.current.style.opacity = hovering ? '0.9' : '0.5';
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      themeObserver.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!visible) return null;

  // Dot: solid brand-green with a halo that contrasts against the opposite
  // side of the luminance spectrum. On light themes we pair it with a dark
  // halo; on dark themes a white halo. The inner white/black 1px stroke
  // guarantees contrast even on mid-grey where the halo alone is subtle.
  const dotShadow = isDark
    ? '0 0 0 1.5px rgba(10,10,10,0.85), 0 0 8px rgba(255,255,255,0.55), 0 0 18px rgba(30,181,58,0.45)'
    : '0 0 0 1.5px rgba(255,255,255,0.95), 0 0 8px rgba(10,10,10,0.35), 0 0 18px rgba(30,181,58,0.35)';

  // Ring: brand-green border at 50% opacity with a contrasting outer hairline
  // so it reads on neutrals. Uses two box-shadows to fake a double stroke
  // (inner dark/light + outer soft glow).
  const ringShadow = isDark
    ? 'inset 0 0 0 1px rgba(10,10,10,0.6), 0 0 0 1px rgba(255,255,255,0.25), 0 0 10px rgba(30,181,58,0.25)'
    : 'inset 0 0 0 1px rgba(255,255,255,0.85), 0 0 0 1px rgba(10,10,10,0.18), 0 0 10px rgba(30,181,58,0.25)';

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-8 w-8 rounded-full border transition-[transform,opacity] duration-100 ease-out"
        style={{
          willChange: 'transform',
          borderColor: 'rgba(30, 181, 58, 0.5)',
          boxShadow: ringShadow,
        }}
      />
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-1.5 w-1.5 rounded-full"
        style={{
          willChange: 'transform',
          backgroundColor: '#1EB53A',
          boxShadow: dotShadow,
        }}
      />
    </>
  );
}
