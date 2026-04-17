'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui';
import { MagneticButton } from '@/components/fx/MagneticButton';
import { AmbientBeams } from '@/components/fx/AmbientBeams';

const HEADLINE = 'Refurbished PCs, built by people who know them.';

export function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <section
      ref={ref}
      className="relative h-[100dvh] min-h-[720px] w-full overflow-hidden bg-ink-50 dark:bg-obsidian-950"
    >
      {/* Animated atmospheric beams behind everything */}
      <AmbientBeams />

      <motion.div style={{ y, scale }} className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/brand/hero-poster.jpg"
          className="h-full w-full object-cover"
        >
          <source src="/brand/hero.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Atmospheric fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-50/70 to-transparent dark:from-obsidian-950/70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink-50 via-ink-50/85 to-transparent dark:from-obsidian-950 dark:via-obsidian-950/85" />

      {/* Side vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 320px rgba(0,0,0,0.22)' }}
      />

      {/* Subtle scanline + grain on the video itself for cinema feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 md:pb-28"
      >
        <KineticHeadline text={HEADLINE} />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-xl text-body text-ink-700 dark:text-ink-300 md:text-lg"
        >
          Tested, warrantied, and shipped from Birmingham. Over twenty in-house builders assemble every machine you buy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <MagneticButton strength={18}>
            <Link href="/shop">
              <Button size="lg" className="px-8 text-base">
                Shop PCs
              </Button>
            </Link>
          </MagneticButton>
          <MagneticButton strength={18}>
            <Link href="/shop/gaming-pc-bundles">
              <Button size="lg" variant="outline" className="px-8 text-base backdrop-blur-sm">
                Gaming bundles
              </Button>
            </Link>
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.2 }}
          className="mt-14 flex items-center gap-6 font-mono text-caption uppercase tracking-widest text-ink-500 dark:text-ink-300"
        >
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
            Built in Birmingham
          </span>
          <span className="hidden md:inline" aria-hidden>
            ·
          </span>
          <span className="hidden md:inline">Est. 2020</span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-caption uppercase tracking-widest text-ink-500"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
          scroll
        </motion.div>
      </motion.div>
    </section>
  );
}

function KineticHeadline({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
      {words.map((w, i) => (
        <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
          <motion.span
            initial={{ opacity: 0, y: '110%', filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.4 + i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`inline-block ${i === 5 ? 'text-brand-green' : ''}`}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
