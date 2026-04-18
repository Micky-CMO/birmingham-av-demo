'use client';

import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * AmbientBackground: NVIDIA-build-platform-style flowing colour nebula.
 *
 * Three stacked passes, each on its own compositor layer:
 *
 *  1. Slow-rotating conic gradient base, very large, adds low-frequency hue
 *     shift so the canvas is never uniform.
 *  2. Eight heavily-blurred "halo" orbs, the soft atmospheric wash.
 *  3. Three smaller "core" orbs at higher alpha, less blurred, placed to
 *     punch through the halos so the mesh actually reads on bright white.
 *
 * Pointer-events-none, GPU-composited, theme-aware via MutationObserver on
 * <html data-theme>. Respects prefers-reduced-motion and visibilitychange.
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
  const isDark = theme === 'dark';
  const haloBlend: 'screen' | 'normal' = isDark ? 'screen' : 'normal';
  const haloCap = isDark ? 0.95 : 0.78;
  const coreCap = isDark ? 1.0 : 0.9;
  const still = prefersReducedMotion || hidden;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: baseColor }}
    >
      {/* Layer 1: slowly rotating conic base, very large, low frequency hue. */}
      <motion.div
        className="absolute -inset-1/4"
        style={{
          background: isDark
            ? 'conic-gradient(from 180deg at 50% 50%, rgba(30,181,58,0.22), rgba(79,145,255,0.18), rgba(139,92,246,0.22), rgba(34,211,238,0.18), rgba(30,181,58,0.22))'
            : 'conic-gradient(from 180deg at 50% 50%, rgba(30,181,58,0.18), rgba(79,145,255,0.14), rgba(139,92,246,0.16), rgba(34,211,238,0.14), rgba(30,181,58,0.18))',
          filter: 'blur(80px)',
          opacity: isDark ? 0.75 : 0.85,
        }}
        animate={still ? {} : { rotate: [0, 360] }}
        transition={still ? { duration: 0 } : { duration: 160, repeat: Infinity, ease: 'linear' }}
      />

      {/* Layer 2: halo orbs (atmospheric wash). */}
      <div className="absolute inset-0" style={{ mixBlendMode: haloBlend }}>
        {HALO_ORBS.map((orb) => (
          <Orb key={orb.id} orb={orb} opacityCap={haloCap} still={still} />
        ))}
      </div>

      {/* Layer 3: core orbs (punch through halos so the colour actually reads). */}
      <div className="absolute inset-0" style={{ mixBlendMode: haloBlend }}>
        {CORE_ORBS.map((orb) => (
          <Orb key={orb.id} orb={orb} opacityCap={coreCap} still={still} />
        ))}
      </div>
    </div>
  );
}

type OrbDef = {
  id: string;
  color: string;
  size: number;
  left: string;
  top: string;
  blur: number;
  duration: number;
  x: [number, number, number, number];
  y: [number, number, number, number];
  scale: [number, number, number, number];
};

/** Eight large halo orbs. Heavy blur, atmospheric. */
const HALO_ORBS: readonly OrbDef[] = [
  { id: 'h-a', color: '#1EB53A', size: 900, left: '-12%', top: '-18%', blur: 140, duration: 34,
    x: [0, 140, -80, 0], y: [0, 100, 160, 0], scale: [1, 1.15, 0.94, 1] },
  { id: 'h-b', color: '#22D3EE', size: 780, left: '55%', top: '6%', blur: 130, duration: 41,
    x: [0, -160, 80, 0], y: [0, 110, -60, 0], scale: [1, 0.92, 1.12, 1] },
  { id: 'h-c', color: '#8B5CF6', size: 720, left: '20%', top: '48%', blur: 150, duration: 52,
    x: [0, 170, -80, 0], y: [0, -100, 50, 0], scale: [1, 1.10, 0.96, 1] },
  { id: 'h-d', color: '#4CD265', size: 640, left: '72%', top: '58%', blur: 120, duration: 27,
    x: [0, -100, 60, 0], y: [0, -80, 120, 0], scale: [1, 1.08, 0.96, 1] },
  { id: 'h-e', color: '#F0B849', size: 500, left: '4%', top: '72%', blur: 110, duration: 23,
    x: [0, 90, -60, 0], y: [0, -70, 40, 0], scale: [1, 1.18, 0.98, 1] },
  { id: 'h-f', color: '#1EB53A', size: 540, left: '85%', top: '18%', blur: 130, duration: 38,
    x: [0, -120, 70, 0], y: [0, 130, -50, 0], scale: [1, 0.9, 1.12, 1] },
  { id: 'h-g', color: '#4F91FF', size: 620, left: '35%', top: '85%', blur: 140, duration: 45,
    x: [0, 80, -120, 0], y: [0, -50, -100, 0], scale: [1, 1.10, 0.94, 1] },
  { id: 'h-h', color: '#22D3EE', size: 480, left: '65%', top: '35%', blur: 110, duration: 31,
    x: [0, -60, 100, 0], y: [0, 70, -80, 0], scale: [1, 1.06, 0.98, 1] },
];

/** Three brighter cores. Smaller + less blur = they punch through white. */
const CORE_ORBS: readonly OrbDef[] = [
  { id: 'c-a', color: '#1EB53A', size: 360, left: '18%', top: '22%', blur: 60, duration: 19,
    x: [0, 70, -40, 0], y: [0, 50, -30, 0], scale: [1, 1.1, 0.95, 1] },
  { id: 'c-b', color: '#8B5CF6', size: 320, left: '62%', top: '48%', blur: 55, duration: 25,
    x: [0, -80, 40, 0], y: [0, -60, 30, 0], scale: [1, 1.12, 0.92, 1] },
  { id: 'c-c', color: '#22D3EE', size: 300, left: '42%', top: '78%', blur: 50, duration: 21,
    x: [0, 60, -70, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.96, 1] },
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
  const centerAlpha = opacityCap;
  const midAlpha = +(opacityCap * 0.4).toFixed(3);
  const background = `radial-gradient(closest-side, ${hexToRgba(orb.color, centerAlpha)}, ${hexToRgba(orb.color, midAlpha)} 40%, ${hexToRgba(orb.color, 0)} 78%)`;

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

/** Clamp-safe hex to rgba. Accepts `#RGB` and `#RRGGBB`. */
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
