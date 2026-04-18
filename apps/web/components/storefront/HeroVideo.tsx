'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { MagneticButton } from '@/components/fx/MagneticButton';
import { AmbientBeams } from '@/components/fx/AmbientBeams';

/**
 * Cinematic hero. On tablet+ we run the full-bleed video plate with kinetic
 * parallax. On narrow portrait phones we render a dedicated mobile hero that
 * anchors the poster image inside a rounded card (video clipping a 9:19 phone
 * is brutal), stacks headline and CTAs vertically, and keeps the editorial
 * band legible at 360px. The mobile path also skips the heaviest Framer
 * transforms to protect the frame rate on mid-range Android.
 */
export function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  return (
    <section ref={ref} className="relative w-full overflow-hidden">
      <AmbientBeams />

      {/* ============ VIDEO PLATE (sm+) ============ */}
      <div className="relative hidden h-[72vh] min-h-[560px] w-full overflow-hidden sm:block md:h-[78vh]">
        <motion.div style={{ y: videoY, scale: videoScale, opacity: videoOpacity }} className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/brand/hero-poster.jpg"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 62%' }}
          >
            <source src="/brand/hero.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Inner vignette for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: 'inset 0 0 260px rgba(0,0,0,0.22)' }}
        />

        {/* Scanlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* Bottom fade into the editorial band */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-ink-50/75 to-ink-50 dark:via-obsidian-950/75 dark:to-obsidian-950" />

        {/* Floating brand chip */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-1/2 top-8 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/60 px-4 py-2 font-mono text-caption uppercase tracking-[0.2em] text-ink-900 backdrop-blur-glass dark:border-white/10 dark:bg-obsidian-900/60 dark:text-ink-50"
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
          <span>Since 2020 &middot; Hand-built in Birmingham</span>
        </motion.div>

        {/* Corner metadata (cinema style) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.5 }}
          className="absolute left-6 top-8 z-10 hidden items-center gap-2 font-mono text-caption uppercase tracking-[0.2em] text-ink-500 md:flex"
        >
          <span>BAV</span>
          <span>&middot;</span>
          <span>REEL 01</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.5 }}
          className="absolute right-6 top-8 z-10 hidden items-center gap-2 font-mono text-caption uppercase tracking-[0.2em] text-ink-500 md:flex"
        >
          <span>B&apos;HAM &middot; UK</span>
          <span>&middot;</span>
          <span>NEW + REFURB</span>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 font-mono text-caption uppercase tracking-[0.3em] text-ink-500"
        >
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
            scroll &darr;
          </motion.span>
        </motion.div>
      </div>

      {/* ============ MOBILE HERO (<sm) ============ */}
      {/* A dedicated compact hero for portrait phones. Replaces the 16:9 video
          with a tall rounded poster card so the crop stays flattering, keeps
          the headline to a readable clamp, and shows stacked full-width CTAs. */}
      <div className="relative block px-4 pb-6 pt-5 sm:hidden">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-ink-300/60 bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-900 backdrop-blur-sm dark:border-obsidian-500/60 dark:bg-obsidian-900/70 dark:text-ink-50"
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
          <span className="truncate">Since 2020 &middot; Birmingham built</span>
        </motion.div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink-300/40 bg-obsidian-950 shadow-glass-light dark:border-obsidian-500/50">
          {isMobile && !prefersReducedMotion ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/brand/hero-poster.jpg"
              className="h-full w-full object-cover object-center"
              aria-hidden="true"
            >
              <source src="/brand/hero.mp4" type="video/mp4" />
            </video>
          ) : (
            <Image
              src="/brand/hero-poster.jpg"
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2 text-white">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">
              Spring 2026 catalogue
            </span>
            <h1 className="font-display text-[clamp(1.85rem,8.2vw,2.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-white">
              PCs and tech, built by people who know them.
            </h1>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <Link href="/shop" className="block">
            <Button size="lg" className="h-12 w-full text-base">
              Shop all PCs
            </Button>
          </Link>
          <Link href="/shop/gaming-pc-bundles" className="block">
            <Button size="lg" variant="outline" className="h-12 w-full text-base">
              Gaming bundles
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-small leading-relaxed text-ink-700 dark:text-ink-300">
          New and refurbished, tested, warrantied, and shipped worldwide from the United Kingdom. Over twenty in-house builders assemble
          every machine you buy.
        </p>
      </div>

      {/* ============ EDITORIAL BAND (sm+ only) ============ */}
      <div className="relative mx-auto hidden max-w-7xl px-4 pb-20 pt-6 sm:block sm:px-6 md:pb-32 md:pt-12">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center gap-3 font-mono text-caption uppercase tracking-[0.3em] text-ink-500"
        >
          <span aria-hidden className="h-px w-10 bg-brand-green" />
          <span>The Birmingham AV catalogue &middot; Spring 2026</span>
        </motion.div>

        <KineticHeadline />

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-body leading-relaxed text-ink-700 dark:text-ink-300 md:col-span-5 md:text-lg"
          >
            New and refurbished machines, tested, warrantied, and shipped worldwide from the United Kingdom. Over twenty in-house builders
            assemble your kit, sign their name against it, and stand behind it for twelve months.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-4 md:col-span-7 md:items-end"
          >
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <MagneticButton strength={18}>
                <Link href="/shop" className="block">
                  <Button size="lg" className="w-full px-9 text-base sm:w-auto">
                    Shop all PCs
                  </Button>
                </Link>
              </MagneticButton>
              <MagneticButton strength={18}>
                <Link href="/shop/gaming-pc-bundles" className="block">
                  <Button size="lg" variant="outline" className="w-full px-9 text-base sm:w-auto">
                    Gaming bundles
                  </Button>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>
        </div>

        {/* Data strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-300/50 bg-ink-300/50 md:mt-20 md:grid-cols-4 dark:border-obsidian-500/40 dark:bg-obsidian-500/30"
        >
          {[
            { k: 'Units sold', v: '82K', sub: 'lifetime on eBay' },
            { k: 'Positive', v: '98.4%', sub: 'customer feedback' },
            { k: 'Builders', v: '22', sub: 'in-house, signed' },
            { k: 'Warranty', v: '12mo', sub: 'parts + labour' },
          ].map((s) => (
            <div
              key={s.k}
              className="group relative flex flex-col gap-1 bg-ink-50 p-4 transition-colors hover:bg-white sm:p-6 dark:bg-obsidian-950 dark:hover:bg-obsidian-900"
            >
              <span className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500">{s.k}</span>
              <span className="font-display text-[clamp(2rem,3.2vw,2.75rem)] font-semibold leading-none tracking-[-0.02em]">
                {s.v}
              </span>
              <span className="text-caption text-ink-500">{s.sub}</span>
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-px w-0 bg-brand-green transition-all duration-700 group-hover:w-full"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const LINE_1 = 'PCs and tech,';
const LINE_2 = 'built by people';
const LINE_3 = 'who know them.';

function KineticHeadline() {
  return (
    <h1 className="font-display text-[clamp(2.5rem,8vw,8rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
      <Line text={LINE_1} startDelay={0.25} />
      <Line text={LINE_2} startDelay={0.55} highlight={['people']} />
      <Line text={LINE_3} startDelay={0.95} />
    </h1>
  );
}

function Line({ text, startDelay, highlight }: { text: string; startDelay: number; highlight?: string[] }) {
  const words = text.split(' ');
  return (
    <span className="block">
      {words.map((w, i) => {
        const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
        const isHighlight = highlight?.includes(clean);
        return (
          <span key={i} className="mr-[0.22em] inline-block overflow-hidden align-bottom">
            <motion.span
              initial={{ opacity: 0, y: '110%', filter: 'blur(14px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: startDelay + i * 0.06, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`inline-block ${isHighlight ? 'text-brand-green' : ''}`}
            >
              {w}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
