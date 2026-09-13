"use client";
import { create } from "zustand";

/**
 * État client transversal uniquement (feuille de route, §4) : ce qui n'appartient pas au serveur.
 * La session vit dans TanStack Query (voir lib/auth.ts), jamais ici.
 */
interface CartItem { productId: string; qty: number; }

interface AppState {
  // Panier (La Réserve)
  cart: CartItem[];
  addToCart: (productId: string) => void;
  clearCart: () => void;

  // UI
  menuOpen: boolean;
  toggleMenu: (v?: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  cart: [],
  addToCart: (productId) =>
    set((s) => {
      const found = s.cart.find((c) => c.productId === productId);
      return found
        ? { cart: s.cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c)) }
        : { cart: [...s.cart, { productId, qty: 1 }] };
    }),
  clearCart: () => set({ cart: [] }),

  menuOpen: false,
  toggleMenu: (v) => set((s) => ({ menuOpen: v ?? !s.menuOpen })),
}));
