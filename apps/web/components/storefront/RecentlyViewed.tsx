'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui';
import { formatGbp, truncate } from '@bav/lib';

type RecentItem = {
  productId: string;
  slug: string;
  title: string;
  priceGbp: number;
  imageUrl: string | null;
  viewedAt: number;
};

const KEY = 'bav-recently-viewed';
const MAX = 12;

export function recordView(item: Omit<RecentItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const without = list.filter((l) => l.productId !== item.productId);
    const next: RecentItem[] = [{ ...item, viewedAt: Date.now() }, ...without].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore storage errors */
  }
}

export function RecentlyViewed({ excludeId }: { excludeId?: string } = {}) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const list: RecentItem[] = JSON.parse(raw);
      setItems(list.filter((l) => l.productId !== excludeId));
    } catch {
      /* ignore */
    }
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Recently viewed</p>
          <h2 className="mt-2 font-display text-h2 font-semibold tracking-[-0.02em]">Pick up where you left off</h2>
        </div>
      </div>
      <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none]">
        <div className="flex snap-x snap-mandatory gap-4 pb-2">
          {items.map((i) => (
            <motion.div
              key={i.productId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32 }}
              className="w-[220px] shrink-0 snap-start"
            >
              <Link href={`/product/${i.slug}`}>
                <GlassCard className="flex h-full flex-col overflow-hidden transition-transform duration-240 hover:-translate-y-0.5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-ink-100 dark:bg-obsidian-800">
                    {i.imageUrl && (
                      <Image src={i.imageUrl} alt={i.title} fill sizes="220px" className="object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-small font-medium leading-snug">{truncate(i.title, 64)}</p>
                    <p className="mt-1 font-display text-body font-semibold">{formatGbp(i.priceGbp)}</p>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
