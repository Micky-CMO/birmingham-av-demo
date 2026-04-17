'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui';
import { formatGbp } from '@bav/lib';

type Point = { date: string; revenue: number; orders: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return null;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  const W = 800;
  const H = 240;
  const pad = { top: 16, right: 16, bottom: 28, left: 16 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const stepX = data.length === 1 ? innerW : innerW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + innerH - (d.revenue / maxRev) * innerH,
    d,
    i,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${pad.top + innerH} L ${points[0]!.x} ${pad.top + innerH} Z`;

  const hoveredPoint = hover !== null ? points[hover] : null;

  return (
    <GlassCard className="p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Revenue · 30 days</p>
          <h3 className="mt-1 font-display text-h2 font-semibold tabular-nums">{formatGbp(total)}</h3>
          <p className="mt-1 text-caption text-ink-500">{totalOrders} orders</p>
        </div>
        <div className="hidden gap-4 sm:flex">
          <Legend label="Revenue" colour="#1EB53A" />
        </div>
      </header>

      <div className="relative mt-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[240px] w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1EB53A" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#1EB53A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={pad.left}
              x2={W - pad.right}
              y1={pad.top + innerH * (1 - p)}
              y2={pad.top + innerH * (1 - p)}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2 4"
            />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#rev-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#1EB53A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Hover hit-areas */}
          {points.map((p) => (
            <rect
              key={p.i}
              x={p.x - stepX / 2}
              y={pad.top}
              width={stepX}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(p.i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}

          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1={pad.top}
                y2={pad.top + innerH}
                stroke="#1EB53A"
                strokeOpacity="0.4"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#1EB53A" />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="9" fill="#1EB53A" fillOpacity="0.18" />
            </>
          )}
        </svg>

        {hoveredPoint && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-ink-300/60 bg-white/95 px-3 py-2 shadow-lift backdrop-blur-md dark:border-obsidian-500/60 dark:bg-obsidian-900/95"
            style={{ left: `${(hoveredPoint.x / W) * 100}%`, top: `${(hoveredPoint.y / H) * 100}%` }}
          >
            <div className="font-mono text-caption text-ink-500">{hoveredPoint.d.date}</div>
            <div className="mt-0.5 font-display text-small font-semibold tabular-nums">{formatGbp(hoveredPoint.d.revenue)}</div>
            <div className="font-mono text-caption text-ink-500">{hoveredPoint.d.orders} orders</div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function Legend({ label, colour }: { label: string; colour: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-caption uppercase tracking-widest text-ink-500">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colour }} />
      {label}
    </div>
  );
}
