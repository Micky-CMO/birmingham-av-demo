'use client';

import { motion } from 'framer-motion';

/**
 * Two slow-drifting conic light beams that sit behind the hero video.
 * Pure CSS gradients animated via Framer. Cheap, atmospheric.
 */
export function AmbientBeams() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55, x: ['-20%', '15%', '-20%'], y: ['-10%', '5%', '-10%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-1/4 -top-1/3 h-[120vh] w-[120vh] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(30, 181, 58, 0.22), rgba(30,181,58,0.05) 55%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45, x: ['10%', '-15%', '10%'], y: ['10%', '-5%', '10%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-1/3 -right-1/4 h-[120vh] w-[120vh] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(79, 145, 255, 0.18), rgba(10,10,10,0.04) 55%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}
