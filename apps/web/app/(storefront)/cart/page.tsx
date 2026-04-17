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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-h1 font-display">Your cart</h1>
      {lines.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-ink-300 p-16 text-center text-ink-500 dark:border-obsidian-500">
          Empty. <Link href="/shop" className="text-brand-green">Browse the shop.</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <ul className="md:col-span-2 space-y-4">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-4 rounded-lg border border-ink-300/60 p-4 dark:border-obsidian-500/60">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-ink-100 dark:bg-obsidian-800">
                  {l.imageUrl && <Image src={l.imageUrl} alt={l.title} fill className="object-cover" />}
                </div>
                <div className="flex-1">
                  <Link href={`/product/${l.slug}`} className="font-medium hover:text-brand-green">
                    {l.title}
                  </Link>
                  <div className="mt-1 text-caption text-ink-500">{formatGbp(l.pricePerUnitGbp)}</div>
                </div>
                <div className="inline-flex items-center overflow-hidden rounded-md border border-ink-300/60 dark:border-obsidian-500/60">
                  <button onClick={() => update(l.productId, l.qty - 1)} aria-label="decrease" className="h-8 w-8">&minus;</button>
                  <span className="w-8 text-center font-mono">{l.qty}</span>
                  <button onClick={() => update(l.productId, l.qty + 1)} aria-label="increase" className="h-8 w-8">+</button>
                </div>
                <button onClick={() => remove(l.productId)} className="text-caption text-ink-500 hover:text-semantic-critical">
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <GlassCard className="h-fit p-6">
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
            <Link href="/checkout">
              <Button size="lg" className="mt-6 w-full">Checkout</Button>
            </Link>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
