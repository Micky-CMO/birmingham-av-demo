'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Badge, Button, GlassCard } from '@/components/ui';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';
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

type IconKey = 'laptop' | 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'gpu' | 'storage' | 'tower';

function inferIcon(title: string): IconKey {
  const t = title.toLowerCase();
  if (/\blaptop|notebook|macbook|thinkpad|ultrabook\b/.test(t)) return 'laptop';
  if (/\bmonitor|display|screen|lcd|oled\b/.test(t)) return 'monitor';
  if (/\bkeyboard|keycap|mechanical\b/.test(t)) return 'keyboard';
  if (/\bmouse|mice\b/.test(t)) return 'mouse';
  if (/\bheadset|headphone|earphone|earbud\b/.test(t)) return 'headset';
  if (/\bgpu|graphics|rtx|gtx|radeon|geforce\b/.test(t)) return 'gpu';
  if (/\bssd|hdd|nvme|drive|storage\b/.test(t)) return 'storage';
  return 'tower';
}

function PlaceholderIcon({ icon }: { icon: IconKey }) {
  const common = {
    width: '42%',
    height: '42%',
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (icon) {
    case 'laptop':
      return (
        <svg {...common} aria-hidden="true"><rect x="12" y="16" width="40" height="26" rx="2" /><path d="M6 46h52l-3 6H9z" /></svg>
      );
    case 'monitor':
      return (
        <svg {...common} aria-hidden="true"><rect x="8" y="12" width="48" height="32" rx="2" /><path d="M24 52h16M32 44v8" /></svg>
      );
    case 'keyboard':
      return (
        <svg {...common} aria-hidden="true"><rect x="6" y="20" width="52" height="24" rx="3" /><path d="M14 28h4M24 28h4M34 28h4M44 28h4M20 36h24" /></svg>
      );
    case 'mouse':
      return (
        <svg {...common} aria-hidden="true"><rect x="20" y="10" width="24" height="44" rx="12" /><path d="M32 14v14" /></svg>
      );
    case 'headset':
      return (
        <svg {...common} aria-hidden="true"><path d="M12 36v-4a20 20 0 0 1 40 0v4" /><rect x="8" y="36" width="10" height="16" rx="2" /><rect x="46" y="36" width="10" height="16" rx="2" /></svg>
      );
    case 'gpu':
      return (
        <svg {...common} aria-hidden="true"><rect x="4" y="22" width="52" height="20" rx="2" /><circle cx="20" cy="32" r="5" /><circle cx="40" cy="32" r="5" /><path d="M56 28h4v8h-4" /></svg>
      );
    case 'storage':
      return (
        <svg {...common} aria-hidden="true"><rect x="10" y="14" width="44" height="36" rx="2" /><path d="M10 26h44M10 38h44" /><circle cx="48" cy="20" r="1" /><circle cx="48" cy="32" r="1" /><circle cx="48" cy="44" r="1" /></svg>
      );
    case 'tower':
    default:
      return (
        <svg {...common} aria-hidden="true"><rect x="18" y="6" width="28" height="52" rx="2" /><path d="M24 14h16M24 20h16" /><circle cx="32" cy="32" r="4" /><path d="M28 46h8" /></svg>
      );
  }
}

function ImagePlaceholder({ title }: { title: string }) {
  const icon = inferIcon(title);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-100 to-ink-50 dark:from-obsidian-800 dark:to-obsidian-900">
      <div className="text-brand-green opacity-20 flex h-full w-full items-center justify-center">
        <PlaceholderIcon icon={icon} />
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardModel }) {
  const add = useCartStore((s) => s.add);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const [justAdded, setJustAdded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 220, damping: 22 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 220, damping: 22 });
  const imgX = useSpring(useTransform(mx, [-0.5, 0.5], ['-3%', '3%']), { stiffness: 180, damping: 22 });
  const imgY = useSpring(useTransform(my, [-0.5, 0.5], ['-3%', '3%']), { stiffness: 180, damping: 22 });

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imgFailed;

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
          {showImage ? (
            <>
              {!imgLoaded && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%] dark:from-obsidian-800 dark:via-obsidian-900 dark:to-obsidian-800"
                  style={{ animation: 'shimmer 1.6s ease-in-out infinite' }}
                />
              )}
              <motion.div className="absolute inset-0" style={{ x: imgX, y: imgY, scale: 1.08 }}>
                <Image
                  src={product.imageUrl as string}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className={`object-cover transition-all duration-700 ease-unfold group-hover:scale-[1.04] ${imgLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}`}
                  onLoadingComplete={() => setImgLoaded(true)}
                  onError={() => setImgFailed(true)}
                />
              </motion.div>
            </>
          ) : (
            <ImagePlaceholder title={product.title} />
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                add({
                  productId: product.productId,
                  title: product.title,
                  slug: product.slug,
                  pricePerUnitGbp: product.priceGbp,
                  qty: 1,
                  imageUrl: product.imageUrl,
                });
                setCartOpen(true);
                setJustAdded(true);
                window.setTimeout(() => setJustAdded(false), 1800);
              }}
              className={justAdded ? 'bg-brand-green-600' : ''}
            >
              {justAdded ? '✓ Added' : 'Add to cart'}
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
