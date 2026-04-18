'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui';
import { MagneticButton } from '@/components/fx/MagneticButton';
import { AmbientBeams } from '@/components/fx/AmbientBeams';

/**
 * Hero with the logo video as its own clean block on top, then the kinetic
 * headline and CTAs in a dedicated section below. No overlap. The video
 * gently parallaxes on scroll so there's still a premium feel.
 */
export function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden bg-ink-50 pb-28 dark:bg-obsidian-950"
    >
      <AmbientBeams />

      {/* Video block — clean, prominent, its own rectangle at the top */}
      <div className="relative mx-auto max-w-7xl px-6 pt-8 md:pt-14">
        <motion.div
          style={{ y: videoY, scale: videoScale }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-ink-300/50 bg-white shadow-glass-light dark:border-obsidian-500/50 dark:bg-obsidian-900 dark:shadow-glass-dark md:aspect-[21/8]"
        >
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

          {/* Subtle inner vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 160px rgba(0,0,0,0.18)' }}
          />

          {/* Scanline for cinema feel */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
            }}
          />

          {/* Floating brand chip top-left of the video */}
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 font-mono text-caption uppercase tracking-widest text-ink-700 backdrop-blur-glass dark:bg-obsidian-900/60 dark:text-ink-300">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
            Built in Birmingham
          </div>
        </motion.div>
      </div>

      {/* Text + CTAs block — full width, below the video */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 mx-auto mt-16 max-w-7xl px-6 md:mt-20"
      >
        <KineticHeadline text="Refurbished PCs, built by people who know them." />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-body text-ink-700 dark:text-ink-300 md:text-lg"
        >
          Tested, warrantied, and shipped from Birmingham. Over twenty in-house builders assemble every machine you buy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
              <Button size="lg" variant="outline" className="px-8 text-base">
                Gaming bundles
              </Button>
            </Link>
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1.2 }}
          className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-caption uppercase tracking-widest text-ink-500 dark:text-ink-300"
        >
          <span>82K sold on eBay</span>
          <span aria-hidden>·</span>
          <span>98.4% positive</span>
          <span aria-hidden>·</span>
          <span>12-month warranty</span>
          <span aria-hidden>·</span>
          <span>Free UK shipping</span>
        </motion.div>
      </motion.div>
    </section>
  );
}

function KineticHeadline({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <h1 className="font-display text-[clamp(2.25rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
      {words.map((w, i) => (
        <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
          <motion.span
            initial={{ opacity: 0, y: '110%', filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`inline-block ${i === 5 ? 'text-brand-green' : ''}`}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
