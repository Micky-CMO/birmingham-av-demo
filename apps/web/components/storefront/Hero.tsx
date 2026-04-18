'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { TrustRow } from './TrustRow';
import { FeaturedPc } from './FeaturedPc';

export function Hero() {
  return (
    <section className="hero-mesh relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-16 md:grid-cols-12 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-7"
        >
          <h1 className="font-display text-display-lg md:text-display-xl">
            PCs and tech,<br />
            <span className="text-brand-green">built by people</span> who know them.
          </h1>
          <p className="mt-6 max-w-xl text-body text-ink-700 dark:text-ink-300 md:text-lg">
            New and refurbished, tested, warrantied, shipped worldwide from the United Kingdom. Over 20 in-house builders assemble
            every machine you buy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop">
              <Button size="lg">Shop PCs</Button>
            </Link>
            <Link href="/shop/gaming-pc-bundles">
              <Button size="lg" variant="outline">
                Gaming bundles
              </Button>
            </Link>
          </div>
          <div className="mt-10">
            <TrustRow />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="md:col-span-5"
        >
          <FeaturedPc />
        </motion.div>
      </div>
    </section>
  );
}
