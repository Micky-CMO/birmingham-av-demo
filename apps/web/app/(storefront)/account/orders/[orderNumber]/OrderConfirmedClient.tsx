'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/stores/cart';

/**
 * Post-checkout handshake: clears the cart once the celebration layout has
 * mounted, and strips `?confirmed=1` from the URL via history.replaceState
 * so a refresh or forward-nav doesn't re-trigger the same view. We rewrite
 * the URL in-place rather than router.replace() so the server component
 * doesn't immediately re-render as the standard order-detail branch and
 * flash the UI.
 */
export function OrderConfirmedClient({ orderNumber }: { orderNumber: string }) {
  const ranRef = useRef(false);
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    clearCart();
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/account/orders/${orderNumber}`);
    }
  }, [clearCart, orderNumber]);

  return null;
}
