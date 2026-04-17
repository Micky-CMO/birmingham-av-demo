'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0%' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollStagger({
  children,
  className,
  delayStep = 0.08,
}: {
  children: ReactNode[];
  className?: string;
  delayStep?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal key={i} delay={i * delayStep}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
