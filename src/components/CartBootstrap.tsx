// ============================================================
// ANKU — CartBootstrap
// Charge / reset le panier selon l'état d'auth
// ============================================================

import { useEffect, useRef } from 'react'
import { useAuthStore } from '../context/AuthContext'
import { useCartStore } from '../context/CartContext'

export default function CartBootstrap({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loadCart = useCartStore((s) => s.load)
  const resetCart = useCartStore((s) => s.reset)
  const prevAuth = useRef<boolean | null>(null)

  useEffect(() => {
    // Premier mount : on ne fait rien si pas auth, on charge si auth
    if (prevAuth.current === null) {
      prevAuth.current = isAuthenticated
      if (isAuthenticated) loadCart()
      return
    }

    // Transition false → true (login)
    if (!prevAuth.current && isAuthenticated) {
      loadCart()
    }
    // Transition true → false (logout)
    else if (prevAuth.current && !isAuthenticated) {
      resetCart()
    }

    prevAuth.current = isAuthenticated
  }, [isAuthenticated, loadCart, resetCart])

  return <>{children}</>
}
