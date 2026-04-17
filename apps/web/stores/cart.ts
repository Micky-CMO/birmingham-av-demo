'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine } from '@bav/lib';

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  update: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === line.productId ? { ...l, qty: Math.min(l.qty + line.qty, 10) } : l,
              ),
            };
          }
          return { lines: [...s.lines, line] };
        }),
      update: (productId, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, Math.min(qty, 10)) } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
      subtotal: () => get().lines.reduce((sum, l) => sum + l.pricePerUnitGbp * l.qty, 0),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
    }),
    { name: 'bav-cart' },
  ),
);
