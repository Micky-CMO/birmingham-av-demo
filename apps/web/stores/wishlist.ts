'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WishlistItem = {
  productId: string;
  title: string;
  slug: string;
  priceGbp: number;
  imageUrl: string | null;
  buildNumber: string | null;
  addedAt: string; // ISO
};

type WishlistState = {
  items: WishlistItem[];
  add: (item: Omit<WishlistItem, 'addedAt'> & { addedAt?: string }) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
  has: (productId: string) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          if (s.items.some((i) => i.productId === item.productId)) return s;
          return {
            items: [
              ...s.items,
              { ...item, addedAt: item.addedAt ?? new Date().toISOString() },
            ],
          };
        }),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
      has: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: 'bav-wishlist' },
  ),
);
