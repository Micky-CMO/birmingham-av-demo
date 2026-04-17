'use client';

import { create } from 'zustand';

type UiState = {
  cartOpen: boolean;
  searchOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  searchOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
}));
