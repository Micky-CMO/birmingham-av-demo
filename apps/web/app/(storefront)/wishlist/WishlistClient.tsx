'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore, type WishlistItem } from '@/stores/wishlist';

type SortKey = 'recent' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'recent', label: 'Recently added' },
  { value: 'price_asc', label: 'Price · low to high' },
  { value: 'price_desc', label: 'Price · high to low' },
];

function formatGbp(n: number) {
  return '£' + Number(n).toLocaleString('en-GB');
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function WishlistClient() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.remove);
  const addToCart = useCartStore((s) => s.add);

  const [sort, setSort] = useState<SortKey>('recent');

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === 'price_asc') copy.sort((a, b) => a.priceGbp - b.priceGbp);
    else if (sort === 'price_desc') copy.sort((a, b) => b.priceGbp - a.priceGbp);
    else copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    return copy;
  }, [items, sort]);

  function moveToCart(item: WishlistItem) {
    addToCart({
      productId: item.productId,
      title: item.title,
      slug: item.slug,
      pricePerUnitGbp: item.priceGbp,
      qty: 1,
      imageUrl: item.imageUrl,
      buildNumber: item.buildNumber ?? undefined,
    });
    removeItem(item.productId);
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-12 pb-32 pt-20">
        {/* HEADER */}
        <div
          className="bav-fade grid grid-cols-1 items-end gap-12 border-b border-ink-10 pb-8 md:grid-cols-[7fr_5fr]"
        >
          <div>
            <div className="bav-label mb-6 text-ink-60">— Saved for later</div>
            <h1 className="m-0 font-display text-[clamp(48px,6.2vw,96px)] font-light leading-[1.02] tracking-[-0.02em]">
              The <span className="bav-italic">wishlist</span>.
            </h1>
          </div>
          <div className="flex items-center justify-end gap-8">
            <span className="font-mono text-[12px] tabular-nums text-ink-60">
              {String(items.length).padStart(2, '0')} items
            </span>
            {items.length > 0 && (
              <label className="flex items-center gap-3">
                <span className="sr-only">Sort wishlist</span>
                <select
                  className="bav-label cursor-pointer appearance-none border-0 border-b border-ink-10 bg-transparent pb-2 pr-5 text-ink outline-none"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bav-fade border-b border-ink-10 py-[160px] text-center">
            <div className="bav-label mb-6 text-ink-30">— Nothing here</div>
            <h2 className="m-0 font-display text-[clamp(44px,5vw,72px)] font-light leading-[1.02] tracking-[-0.02em] text-ink">
              Nothing saved <span className="bav-italic">yet</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-[480px] text-[15px] leading-[1.6] text-ink-60">
              Tap the heart on any product to set it aside. Saved items wait here until you need them.
            </p>
            <Link
              href="/shop"
              className="bav-underline mt-10 inline-flex text-[14px] text-ink no-underline"
            >
              <span>Shop everything</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        ) : (
          <>
            <div
              className="bav-fade mt-14 grid gap-14 sm:grid-cols-2 lg:grid-cols-3"
              style={{ rowGap: 56 }}
            >
              {sorted.map((item, idx) => (
                <WishCard
                  key={item.productId}
                  item={item}
                  index={idx}
                  onRemove={() => removeItem(item.productId)}
                  onMoveToCart={() => moveToCart(item)}
                />
              ))}
            </div>

            <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-ink-10 pt-8">
              <p className="m-0 max-w-[520px] text-[13px] leading-[1.55] text-ink-60">
                Items in your wishlist aren&rsquo;t held in stock. We&rsquo;ll notify you if anything saved
                here is about to sell out, provided you&rsquo;ve opted in on the{' '}
                <Link
                  href="/account/notifications"
                  className="bav-underline text-ink no-underline"
                >
                  <span>notifications page</span>
                </Link>
                .
              </p>
              <Link href="/shop" className="bav-underline text-[13px] text-ink no-underline">
                <span>Continue browsing</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WishCard({
  item,
  index,
  onRemove,
  onMoveToCart,
}: {
  item: WishlistItem;
  index: number;
  onRemove: () => void;
  onMoveToCart: () => void;
}) {
  return (
    <article
      className="group relative"
      style={{ animation: `bavFade 600ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms backwards` }}
    >
      <button
        onClick={onRemove}
        aria-label="Remove from wishlist"
        className="absolute right-[14px] top-[14px] z-[2] flex h-8 w-8 cursor-pointer items-center justify-center border border-ink-10 bg-paper opacity-85 transition-all hover:border-ink hover:bg-ink group-hover:opacity-100"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M8 13.5s-5.5-3.4-5.5-7.2A3 3 0 018 4.3a3 3 0 015.5 2A6 6 0 018 13.5z"
            fill="#17140F"
            stroke="#17140F"
            strokeWidth="1"
            strokeLinejoin="round"
            className="group-hover:fill-paper group-hover:stroke-paper"
          />
        </svg>
      </button>

      <Link
        href={`/product/${item.slug}`}
        className="block text-inherit no-underline"
        aria-label={`View ${item.title}`}
      >
        <div
          className="bav-canvas flex w-full items-center justify-center"
          style={{ aspectRatio: '4 / 5', position: 'relative' }}
        >
          <div
            className="bav-italic relative z-[1] flex items-baseline font-display font-light leading-none"
            style={{
              fontSize: 'clamp(120px, 16vw, 240px)',
              color: 'rgba(23,20,15,0.88)',
            }}
          >
            <span style={{ fontSize: '0.5em', marginRight: 4 }}>№</span>
            {item.buildNumber ?? '—'}
          </div>
        </div>
      </Link>

      <div className="pt-[18px]">
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href={`/product/${item.slug}`}
            className="bav-hover-opa min-w-0 flex-1 text-inherit no-underline"
          >
            <div className="font-display text-[18px] font-normal leading-[1.25] tracking-[-0.01em] text-ink">
              {item.title}
            </div>
          </Link>
          <div className="whitespace-nowrap font-mono text-[13px] tabular-nums text-ink">
            {formatGbp(item.priceGbp)}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="bav-label text-ink-60">Saved</span>
          <span className="bav-label text-ink-30">{formatShortDate(item.addedAt)}</span>
        </div>

        <button
          onClick={onMoveToCart}
          className="bav-label mt-[14px] inline-flex w-full cursor-pointer items-center justify-center border border-ink-10 bg-transparent py-[14px] text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper"
        >
          Move to cart
        </button>
      </div>
    </article>
  );
}
