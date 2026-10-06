// ============================================================
// ANKU — CartContext (zustand store)
// ============================================================

import { create } from 'zustand'
import cartApi from '../service/api/cart.api'
import type { Cart, CartItem, CartBySeller } from '../types/cart'

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
interface CartState {
  // Données
  items: CartItem[]
  bySeller: CartBySeller[]
  itemsCount: number
  subtotal: number

  // Meta
  isLoaded: boolean
  isLoading: boolean
  error: string | null

  // Actions
  load: () => Promise<void>
  add: (productId: number, quantity?: number) => Promise<boolean>
  update: (productId: number, quantity: number) => Promise<boolean>
  remove: (productId: number) => Promise<boolean>
  clear: () => Promise<void>
  reset: () => void
  setFromCart: (cart: Cart) => void
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const emptyCart = {
  items: [] as CartItem[],
  bySeller: [] as CartBySeller[],
  itemsCount: 0,
  subtotal: 0,
}

// ------------------------------------------------------------
// Store
// ------------------------------------------------------------
export const useCartStore = create<CartState>()((set, get) => ({
  ...emptyCart,
  isLoaded: false,
  isLoading: false,
  error: null,

  // ----------------------------------------------------------
  // SET FROM CART (helper interne)
  // ----------------------------------------------------------
  setFromCart: (cart) => {
    set({
      items: cart.items || [],
      bySeller: cart.by_seller || [],
      itemsCount: cart.items_count || 0,
      subtotal: cart.subtotal || 0,
      isLoaded: true,
      isLoading: false,
      error: null,
    })
  },

  // ----------------------------------------------------------
  // LOAD
  // ----------------------------------------------------------
  load: async () => {
    set({ isLoading: true, error: null })
    try {
      const cart = await cartApi.get()
      get().setFromCart(cart)
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Erreur de chargement du panier'
      set({ isLoading: false, error: message, isLoaded: true })
    }
  },

  // ----------------------------------------------------------
  // ADD
  // ----------------------------------------------------------
  add: async (productId, quantity = 1) => {
    set({ isLoading: true, error: null })
    try {
      const cart = await cartApi.add({ product_id: productId, quantity })
      get().setFromCart(cart)
      return true
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Erreur lors de l'ajout"
      set({ isLoading: false, error: message })
      return false
    }
  },

  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------
  update: async (productId, quantity) => {
    set({ isLoading: true, error: null })
    try {
      const cart = await cartApi.update(productId, { quantity })
      get().setFromCart(cart)
      return true
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Erreur lors de la mise à jour'
      set({ isLoading: false, error: message })
      return false
    }
  },

  // ----------------------------------------------------------
  // REMOVE
  // ----------------------------------------------------------
  remove: async (productId) => {
    set({ isLoading: true, error: null })
    try {
      const cart = await cartApi.remove(productId)
      get().setFromCart(cart)
      return true
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Erreur lors de la suppression'
      set({ isLoading: false, error: message })
      return false
    }
  },

  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------
  clear: async () => {
    set({ isLoading: true, error: null })
    try {
      await cartApi.clear()
      set({ ...emptyCart, isLoaded: true, isLoading: false, error: null })
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Erreur lors du vidage'
      set({ isLoading: false, error: message })
    }
  },

  // ----------------------------------------------------------
  // RESET (au logout)
  // ----------------------------------------------------------
  reset: () => {
    set({ ...emptyCart, isLoaded: false, isLoading: false, error: null })
  },
}))

export default useCartStore
