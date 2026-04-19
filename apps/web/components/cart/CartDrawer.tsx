'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const remove = useCartStore((s) => s.remove);

  const close = () => setOpen(false);
  const subtotal = lines.reduce((acc, l) => acc + l.pricePerUnitGbp * l.qty, 0);
  const itemCount = lines.reduce((acc, l) => acc + l.qty, 0);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 z-[60] animate-bav-backdrop-in bg-ink/40"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className="bav-cart-drawer fixed right-0 top-0 bottom-0 z-[70] flex w-[420px] flex-col overflow-hidden border-l border-ink-10 bg-paper"
      >
        {/* Header */}
        <div className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-ink-10 px-7">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[22px] tracking-[-0.015em]">Your cart</span>
            {lines.length > 0 && (
              <span className="bav-label text-ink-60">{itemCount} items</span>
            )}
          </div>
          <button
            onClick={close}
            aria-label="Close cart"
            type="button"
            className="flex cursor-pointer items-center border-none bg-transparent p-1 text-ink"
          >
            <IconClose />
          </button>
        </div>

        {/* Empty state */}
        {lines.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center px-7 py-10 text-center">
            <div className="bav-canvas relative mb-7 h-[100px] w-[80px]">
              <div className="absolute inset-0 flex items-center justify-center font-display text-[40px] font-light italic tracking-[-0.04em] text-[rgba(23,20,15,0.12)]">
                —
              </div>
            </div>
            <h2 className="mb-3 font-display text-[28px] font-light tracking-[-0.02em]">
              Nothing here <span className="bav-italic">yet</span>.
            </h2>
            <p className="mb-8 text-[15px] leading-[1.5] text-ink-60">
              Browse the catalogue to find your next build.
            </p>
            <Link
              href="/shop"
              onClick={close}
              className="bav-underline text-[13px] text-ink no-underline"
            >
              <span>Browse the catalogue</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        )}

        {/* Items */}
        {lines.length > 0 && (
          <div className="flex flex-1 flex-col gap-0 overflow-y-auto px-7 py-5">
            {lines.map((line, idx) => (
              <div key={line.productId}>
                {idx > 0 && <div className="my-5 border-t border-ink-10" />}

                <Link
                  href={`/product/${line.slug}`}
                  onClick={close}
                  className="flex items-start gap-4 text-ink no-underline"
                >
                  {/* Mini canvas thumbnail */}
                  <div className="bav-canvas relative h-[70px] w-[56px] flex-shrink-0">
                    {line.buildNumber && (
                      <div className="absolute inset-0 flex select-none items-center justify-center font-display text-[22px] font-light italic leading-none tracking-[-0.03em] text-[rgba(23,20,15,0.15)]">
                        {line.buildNumber}
                      </div>
                    )}
                  </div>

                  {/* Three-line text column */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-[5px] line-clamp-2 text-[14px] font-medium leading-[1.3]">
                      {line.title}
                    </div>

                    {line.conditionGrade && (
                      <div className="bav-label mb-2 text-ink-60">{line.conditionGrade}</div>
                    )}

                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[12px] tabular-nums text-ink-60">
                        Qty {line.qty}&nbsp;×&nbsp;£{line.pricePerUnitGbp.toLocaleString('en-GB')}
                      </span>
                      <span className="font-mono text-[15px] tabular-nums">
                        £{(line.pricePerUnitGbp * line.qty).toLocaleString('en-GB')}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Remove — right-aligned below the row */}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="bav-label cursor-pointer border-none bg-transparent p-0 text-[9px] text-ink-30 transition-colors hover:text-ink-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {lines.length > 0 && (
          <div className="flex-shrink-0 border-t border-ink-10 bg-paper px-7 pb-7 pt-5">
            {/* Subtotal row */}
            <div className="mb-[6px] flex items-baseline justify-between">
              <span className="text-[13px] text-ink-60">Subtotal</span>
              <span className="font-mono text-[20px] tabular-nums tracking-[-0.01em]">
                £{subtotal.toLocaleString('en-GB')}
              </span>
            </div>

            <div className="bav-label mb-5 text-right text-ink-30">
              Shipping and tax calculated at checkout
            </div>

            <div className="bav-label mb-4 flex items-center justify-center gap-3 text-ink-60">
              <span>12 mo warranty</span>
              <span className="text-ink-30">·</span>
              <span>Free UK delivery over £500</span>
            </div>

            <div className="flex flex-col gap-[10px]">
              <Link
                href="/checkout"
                onClick={close}
                className="bav-cta no-underline"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={close}
                className="bav-cta-secondary no-underline"
              >
                View cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function IconClose({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
