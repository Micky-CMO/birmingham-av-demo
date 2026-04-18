'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Two slow-drifting conic light beams that sit behind the hero video.
 * Pure CSS gradients animated via Framer. Cheap, atmospheric.
 * Renders static beams when the user prefers reduced motion.
 */
export function AmbientBeams() {
  const prefersReducedMotion = useReducedMotion();

  const beamOneClass =
    'absolute -left-1/4 -top-1/3 h-[120vh] w-[120vh] rounded-full';
  const beamOneStyle = {
    background:
      'radial-gradient(closest-side, rgba(30, 181, 58, 0.22), rgba(30,181,58,0.05) 55%, transparent 70%)',
    filter: 'blur(40px)',
  } as const;

  const beamTwoClass =
    'absolute -bottom-1/3 -right-1/4 h-[120vh] w-[120vh] rounded-full';
  const beamTwoStyle = {
    background:
      'radial-gradient(closest-side, rgba(79, 145, 255, 0.18), rgba(10,10,10,0.04) 55%, transparent 70%)',
    filter: 'blur(40px)',
  } as const;

  if (prefersReducedMotion) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={beamOneClass} style={{ ...beamOneStyle, opacity: 0.4 }} />
        <div className={beamTwoClass} style={{ ...beamTwoStyle, opacity: 0.3 }} />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4, x: ['-20%', '15%', '-20%'], y: ['-10%', '5%', '-10%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        className={beamOneClass}
        style={beamOneStyle}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3, x: ['10%', '-15%', '10%'], y: ['10%', '-5%', '10%'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
        className={beamTwoClass}
        style={beamTwoStyle}
      />
    </div>
  );
}
