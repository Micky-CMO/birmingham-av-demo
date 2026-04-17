'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Badge, Button, GlassCard } from '@/components/ui';
import { useCartStore } from '@/stores/cart';
import { formatGbp, truncate } from '@bav/lib';

export type ProductCardModel = {
  productId: string;
  slug: string;
  title: string;
  specLine: string | null;
  conditionGrade: string;
  priceGbp: number;
  compareAtGbp: number | null;
  imageUrl: string | null;
  inStock: boolean;
};

export function ProductCard({ product }: { product: ProductCardModel }) {
  const add = useCartStore((s) => s.add);
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 220, damping: 22 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 220, damping: 22 });
  const imgX = useSpring(useTransform(mx, [-0.5, 0.5], ['-3%', '3%']), { stiffness: 180, damping: 22 });
  const imgY = useSpring(useTransform(my, [-0.5, 0.5], ['-3%', '3%']), { stiffness: 180, damping: 22 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function handleLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1000 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="group"
    >
      <GlassCard className="flex h-full flex-col overflow-hidden transition-shadow duration-420 group-hover:shadow-lift">
        <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] w-full overflow-hidden rounded-t-lg">
          {product.imageUrl ? (
            <motion.div className="absolute inset-0" style={{ x: imgX, y: imgY, scale: 1.08 }}>
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 ease-unfold group-hover:scale-[1.04]"
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-ink-100 to-ink-50 dark:from-obsidian-800 dark:to-obsidian-900" />
          )}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent opacity-0 transition-opacity duration-420 group-hover:opacity-100" />
          <div className="absolute left-3 top-3 z-10 flex gap-2">
            <Badge tone={product.inStock ? 'positive' : 'warning'}>{product.inStock ? 'In stock' : 'Low'}</Badge>
            <Badge tone="neutral">{product.conditionGrade}</Badge>
          </div>
        </Link>
        <div className="flex flex-1 flex-col p-4">
          <Link href={`/product/${product.slug}`} className="text-body font-medium leading-snug transition-colors hover:text-brand-green">
            {truncate(product.title, 72)}
          </Link>
          {product.specLine && (
            <p className="mt-1 line-clamp-2 font-mono text-caption uppercase tracking-wider text-ink-500">{product.specLine}</p>
          )}
          <div className="mt-4 flex items-end justify-between">
            <div>
              {product.compareAtGbp && (
                <div className="text-caption text-ink-500 line-through">{formatGbp(product.compareAtGbp)}</div>
              )}
              <div className="text-h3 font-display">{formatGbp(product.priceGbp)}</div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                add({
                  productId: product.productId,
                  title: product.title,
                  slug: product.slug,
                  pricePerUnitGbp: product.priceGbp,
                  qty: 1,
                  imageUrl: product.imageUrl,
                })
              }
            >
              Add to cart
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
