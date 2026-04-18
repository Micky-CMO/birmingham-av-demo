'use client';

import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * AmbientBackground: a calm, breathing mesh of soft colour fields inspired by
 * the build.nvidia.com aesthetic. Five heavily-blurred radial orbs drift on
 * individual bezier loops over a flat canvas tint. No grid, no particles, no
 * warping lines. Pointer-events-none, GPU-composited, theme-aware.
 *
 * Layers:
 *   1. Flat canvas tint (#F9FAFB light, #050505 dark)
 *   2. Five morphing gradient orbs in brand palette
 *      Blend: `screen` on dark, `multiply` on light
 *
 * Grain lives in the site-wide `GrainOverlay` component; we do not duplicate.
 */

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function AmbientBackground() {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [theme, setTheme] = useState<Theme>('light');
  const [hidden, setHidden] = useState(false);

  // Hydrate the theme and subscribe to live `data-theme` changes on <html>.
  // Also watch page visibility so Framer animations pause when the tab is
  // backgrounded. We pause by flipping the transition to zero-duration, which
  // stops the motion engine from burning cycles while off-screen.
  useEffect(() => {
    setTheme(readTheme());

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const baseColor = theme === 'dark' ? '#050505' : '#F9FAFB';
  // Light mode: `normal` composite with a mid-strength colour reads as a
  // proper coloured glow against white. `multiply` effectively disappears
  // because bright saturated colours times near-white stay near-white.
  // Dark mode: `screen` makes the orbs additive, lifting black to saturated
  // colour so the nebula glows like the NVIDIA build platform.
  const blendMode: 'screen' | 'normal' = theme === 'dark' ? 'screen' : 'normal';
  const opacityCap = theme === 'dark' ? 0.92 : 0.7;
  const still = prefersReducedMotion || hidden;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: baseColor }}
    >
      {/* Orb mesh. Blend mode is applied to the wrapper so all orbs composite
          against the canvas together, producing the smooth nebula overlap. */}
      <div className="absolute inset-0" style={{ mixBlendMode: blendMode }}>
        {ORBS.map((orb) => (
          <Orb key={orb.id} orb={orb} opacityCap={opacityCap} still={still} />
        ))}
      </div>
    </div>
  );
}

type OrbDef = {
  id: string;
  color: string;
  size: number;
  /** Initial offset from top-left of viewport, in viewport-width percentages. */
  left: string;
  top: string;
  blur: number;
  duration: number;
  /** Translation path in px, relative to initial position. */
  x: [number, number, number, number];
  y: [number, number, number, number];
  scale: [number, number, number, number];
};

/** Five orbs, each on a distinct tempo so the mesh never snaps into phase. */
const ORBS: readonly OrbDef[] = [
  {
    id: 'orb-a',
    color: '#1EB53A', // brand green
    size: 820,
    left: '-10%',
    top: '-15%',
    blur: 130,
    duration: 34,
    x: [0, 120, -60, 0],
    y: [0, 80, 140, 0],
    scale: [1, 1.12, 0.96, 1],
  },
  {
    id: 'orb-b',
    color: '#22D3EE', // electric cyan
    size: 680,
    left: '52%',
    top: '8%',
    blur: 120,
    duration: 41,
    x: [0, -140, 60, 0],
    y: [0, 90, -50, 0],
    scale: [1, 0.94, 1.1, 1],
  },
  {
    id: 'orb-c',
    color: '#8B5CF6', // violet
    size: 580,
    left: '28%',
    top: '55%',
    blur: 140,
    duration: 52,
    x: [0, 150, -70, 0],
    y: [0, -90, 40, 0],
    scale: [1, 1.08, 0.97, 1],
  },
  {
    id: 'orb-d',
    color: '#4CD265', // secondary brand green
    size: 540,
    left: '70%',
    top: '62%',
    blur: 110,
    duration: 27,
    x: [0, -90, 50, 0],
    y: [0, -60, 100, 0],
    scale: [1, 1.05, 0.98, 1],
  },
  {
    id: 'orb-e',
    color: '#F0B849', // warm amber spark, deliberately smallest + subtlest
    size: 420,
    left: '6%',
    top: '68%',
    blur: 100,
    duration: 18,
    x: [0, 70, -40, 0],
    y: [0, -50, 30, 0],
    scale: [1, 1.15, 1.0, 1],
  },
];

function Orb({
  orb,
  opacityCap,
  still,
}: {
  orb: OrbDef;
  opacityCap: number;
  still: boolean;
}) {
  // Radial gradient: full-strength at centre, fading out. `closest-side` keeps
  // the falloff independent of aspect ratio. Tighter falloff keeps the orb
  // densely coloured so the NVIDIA-style glow actually reads on a dark canvas.
  const centerAlpha = opacityCap;
  const midAlpha = +(opacityCap * 0.35).toFixed(3);
  const background = `radial-gradient(closest-side, ${hexToRgba(orb.color, centerAlpha)}, ${hexToRgba(orb.color, midAlpha)} 45%, ${hexToRgba(orb.color, 0)} 80%)`;

  // Static mode: render at the first keyframe and do not animate. This
  // honours `prefers-reduced-motion` and pauses while the tab is hidden.
  const animate = still
    ? { x: orb.x[0], y: orb.y[0], scale: orb.scale[0] }
    : { x: [...orb.x], y: [...orb.y], scale: [...orb.scale] };

  const transition: Transition = still
    ? { duration: 0 }
    : {
        duration: orb.duration,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
      };

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: orb.size,
        height: orb.size,
        left: orb.left,
        top: orb.top,
        background,
        filter: `blur(${orb.blur}px)`,
        willChange: 'transform, opacity',
      }}
      initial={false}
      animate={animate}
      transition={transition}
    />
  );
}

/** Clamp-safe hex -> rgba. Accepts `#RGB` and `#RRGGBB`. */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
