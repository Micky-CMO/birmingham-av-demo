'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useCartStore } from '@/stores/cart';

export type AddToCartButtonProps = {
  productId: string;
  title: string;
  slug: string;
  pricePerUnitGbp: number;
  imageUrl: string | null;
  inStock: boolean;
};

/**
 * Renders the "Add to cart" / quantity stepper / "Add to wishlist" cluster.
 * Split into a client subcomponent so the owning product page can stay an
 * async server component (for direct Prisma access + generateMetadata).
 */
export function AddToCartButton(props: AddToCartButtonProps) {
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add({
      productId: props.productId,
      title: props.title,
      slug: props.slug,
      pricePerUnitGbp: props.pricePerUnitGbp,
      qty,
      imageUrl: props.imageUrl,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div
        role="group"
        aria-label="Quantity"
        className="inline-flex items-stretch overflow-hidden rounded-md border border-ink-300/70 dark:border-obsidian-500/70"
      >
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-12 w-10 text-body text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-obsidian-800"
          aria-label="Decrease quantity"
          disabled={qty <= 1}
        >
          -
        </button>
        <div
          className="flex h-12 w-10 items-center justify-center border-x border-ink-300/70 font-mono text-body tabular-nums dark:border-obsidian-500/70"
          aria-live="polite"
          aria-atomic="true"
        >
          {qty}
        </div>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(10, q + 1))}
          className="h-12 w-10 text-body text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-obsidian-800"
          aria-label="Increase quantity"
          disabled={qty >= 10}
        >
          +
        </button>
      </div>
      <Button size="lg" onClick={onAdd} disabled={!props.inStock}>
        {added ? 'Added to cart' : props.inStock ? 'Add to cart' : 'Out of stock'}
      </Button>
      <Button
        size="lg"
        variant="outline"
        aria-disabled="true"
        disabled
        title="Wishlists coming soon"
        className="cursor-not-allowed"
      >
        Add to wishlist
      </Button>
    </div>
  );
}
