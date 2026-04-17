'use client';

import { animate, useInView, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function AnimatedNumber({
  value,
  format,
  duration = 1.6,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0%' });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (n) => (format ? format(n) : Math.round(n).toLocaleString('en-GB')));

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return ctrl.stop;
  }, [inView, value, duration, mv]);

  useEffect(() => {
    const unsub = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [display]);

  return <span ref={ref}>{format ? format(0) : '0'}</span>;
}
