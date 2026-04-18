'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/stores/cart';
import { Button, GlassCard } from '@/components/ui';
import { formatGbp } from '@bav/lib';

export default function CartPage() {
  const lines = useCartStore((s) => s.lines);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartStore((s) => s.subtotal());

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] font-semibold tracking-[-0.025em] sm:text-h1">
        Your cart
      </h1>
      {lines.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-ink-300 p-10 text-center text-ink-500 sm:mt-10 sm:p-16 dark:border-obsidian-500">
          Empty.{' '}
          <Link href="/shop" className="text-brand-green">
            Browse the shop.
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:gap-8 md:grid-cols-3">
          <ul className="space-y-3 sm:space-y-4 md:col-span-2">
            {lines.map((l) => (
              <li
                key={l.productId}
                className="rounded-lg border border-ink-300/60 p-3 sm:p-4 dark:border-obsidian-500/60"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-ink-100 dark:bg-obsidian-800">
                    {l.imageUrl && <Image src={l.imageUrl} alt={l.title} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${l.slug}`}
                      className="line-clamp-2 text-small font-medium hover:text-brand-green sm:text-body"
                    >
                      {l.title}
                    </Link>
                    <div className="mt-1 text-caption text-ink-500">{formatGbp(l.pricePerUnitGbp)}</div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center overflow-hidden rounded-md border border-ink-300/60 dark:border-obsidian-500/60">
                        <button
                          onClick={() => update(l.productId, l.qty - 1)}
                          aria-label="Decrease quantity"
                          className="h-10 w-10 hover:bg-ink-100 dark:hover:bg-obsidian-800"
                        >
                          &minus;
                        </button>
                        <span className="w-9 text-center font-mono">{l.qty}</span>
                        <button
                          onClick={() => update(l.productId, l.qty + 1)}
                          aria-label="Increase quantity"
                          className="h-10 w-10 hover:bg-ink-100 dark:hover:bg-obsidian-800"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(l.productId)}
                        className="inline-flex min-h-11 items-center px-2 text-caption text-ink-500 hover:text-semantic-critical"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <GlassCard className="h-fit p-5 sm:p-6">
            <h2 className="text-h3 font-display">Summary</h2>
            <dl className="mt-4 space-y-2 text-small">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd>{formatGbp(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="text-ink-500">At checkout</dd>
              </div>
            </dl>
            <Link href="/checkout" className="block">
              <Button size="lg" className="mt-5 h-12 w-full sm:mt-6">
                Checkout
              </Button>
            </Link>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
