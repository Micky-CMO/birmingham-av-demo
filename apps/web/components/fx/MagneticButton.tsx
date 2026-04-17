'use client';

import { useRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function MagneticButton({
  children,
  className,
  strength = 24,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 200, damping: 20, mass: 0.6 });
  const rotateX = useTransform(sy, (v) => v * -0.2);
  const rotateY = useTransform(sx, (v) => v * 0.2);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, rotateX, rotateY, transformPerspective: 800 }}
      className={className}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
}
