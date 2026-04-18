'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';
import { formatGbp } from '@bav/lib';
import { Button } from '@/components/ui';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartStore((s) => s.subtotal());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.aside
            role="dialog"
            aria-label="Cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex h-full w-full max-w-[480px] flex-col border-l border-ink-300/60 bg-white shadow-glass-light dark:border-obsidian-500/60 dark:bg-obsidian-900 dark:shadow-glass-dark"
          >
            <header className="flex items-center justify-between border-b border-ink-300/60 px-4 py-3 sm:px-6 sm:py-4 dark:border-obsidian-500/60">
              <h2 className="text-h3 font-display">Your cart</h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-xl text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-obsidian-800 dark:hover:text-ink-50"
              >
                &times;
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
                <p className="text-ink-500">Your cart is empty.</p>
                <Link href="/shop" onClick={() => setOpen(false)}>
                  <Button>Browse shop</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                  <ul className="space-y-4">
                    {lines.map((l) => (
                      <li key={l.productId} className="flex gap-3">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-ink-100 dark:bg-obsidian-800">
                          {l.imageUrl && <Image src={l.imageUrl} alt={l.title} fill className="object-cover" />}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <Link href={`/product/${l.slug}`} className="line-clamp-2 text-small font-medium hover:text-brand-green">
                            {l.title}
                          </Link>
                          <div className="mt-1 text-caption text-ink-500">{formatGbp(l.pricePerUnitGbp)}</div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="inline-flex items-center overflow-hidden rounded-md border border-ink-300/60 dark:border-obsidian-500/60">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => update(l.productId, l.qty - 1)}
                                className="h-10 w-10 text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800"
                              >
                                &minus;
                              </button>
                              <span className="w-9 text-center font-mono text-small">{l.qty}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => update(l.productId, l.qty + 1)}
                                className="h-10 w-10 text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(l.productId)}
                              className="inline-flex min-h-11 items-center px-2 text-caption text-ink-500 hover:text-semantic-critical"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <footer
                  className="border-t border-ink-300/60 px-4 py-4 sm:px-6 dark:border-obsidian-500/60"
                  style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-small text-ink-500">Subtotal</span>
                    <span className="text-h3 font-display">{formatGbp(subtotal)}</span>
                  </div>
                  <Link href="/checkout" onClick={() => setOpen(false)} className="block">
                    <Button size="lg" className="h-12 w-full">
                      Checkout
                    </Button>
                  </Link>
                  <p className="mt-2 text-center text-caption text-ink-500">Shipping + tax at checkout.</p>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
