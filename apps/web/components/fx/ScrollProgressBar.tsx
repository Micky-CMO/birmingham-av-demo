'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Hairline progress bar that fills as the page scrolls. 1px tall, brand green.
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 220, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: x }}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[55] h-[2px] origin-left bg-brand-green"
    />
  );
}
