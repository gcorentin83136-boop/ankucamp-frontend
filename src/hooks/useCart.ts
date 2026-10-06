// ============================================================
// ANKU — Hook useCart
// Simple wrapper autour du store zustand pour raccourci
// ============================================================

import { useCartStore } from '../context/CartContext'

export function useCart() {
  const items = useCartStore((s) => s.items)
  const bySeller = useCartStore((s) => s.bySeller)
  const itemsCount = useCartStore((s) => s.itemsCount)
  const subtotal = useCartStore((s) => s.subtotal)
  const isLoading = useCartStore((s) => s.isLoading)
  const isLoaded = useCartStore((s) => s.isLoaded)
  const error = useCartStore((s) => s.error)

  const load = useCartStore((s) => s.load)
  const add = useCartStore((s) => s.add)
  const update = useCartStore((s) => s.update)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)
  const reset = useCartStore((s) => s.reset)

  return {
    items,
    bySeller,
    itemsCount,
    subtotal,
    isLoading,
    isLoaded,
    error,
    load,
    add,
    update,
    remove,
    clear,
    reset,
  }
}

export default useCart
