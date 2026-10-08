// ============================================================
// ANKU — CartIcon
// Icône panier avec badge compteur, à côté de la cloche
// ============================================================

import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import { useCartStore } from '../../context/CartContext'

const ANKU = {
  green: '#6aa84f',
  greenLight: '#8bc34a',
  greenDark: '#4a7a35',
}

export default function CartIcon() {
  const { isAuthenticated } = useAuthStore()
  const itemsCount = useCartStore((s) => s.itemsCount)

  if (!isAuthenticated) return null

  const hasItems = itemsCount > 0
  const displayCount = itemsCount > 99 ? '99+' : String(itemsCount)

  return (
    <Link
      to="/cart"
      title="Mon panier"
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110"
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: `1px solid ${hasItems ? ANKU.greenLight : 'rgba(255,255,255,0.25)'}`,
        boxShadow: hasItems ? `0 0 16px ${ANKU.green}88` : 'none',
      }}
    >
      <ShoppingCart
        size={18}
        style={{ color: hasItems ? ANKU.greenLight : '#ffffff' }}
        strokeWidth={2.2}
      />

      {/* Badge compteur */}
      {hasItems && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            background: ANKU.green,
            boxShadow: `0 0 0 2px rgba(0,0,0,0.3)`,
          }}
        >
          {displayCount}
        </span>
      )}
    </Link>
  )
}
