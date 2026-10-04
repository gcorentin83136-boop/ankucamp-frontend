// ============================================================
// ANKU — NotificationBell
// Icône cloche avec badge rouge pour les notifications
// ============================================================

import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'

const ANKU = {
  green: '#6aa84f',
  greenLight: '#8bc34a',
  greenDark: '#4a7a35',
  red: '#ef4444',
}

interface NotificationBellProps {
  /** Nombre de notifications non lues */
  count?: number
}

export default function NotificationBell({ count = 0 }: NotificationBellProps) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return null

  const hasUnread = count > 0
  const displayCount = count > 99 ? '99+' : String(count)

  return (
    <Link
      to="/notifications"
      title="Mes notifications"
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110"
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: `1px solid ${hasUnread ? ANKU.red : 'rgba(255,255,255,0.25)'}`,
        boxShadow: hasUnread ? `0 0 16px ${ANKU.red}88` : 'none',
      }}
    >
      <Bell
        size={18}
        style={{ color: hasUnread ? ANKU.red : '#ffffff' }}
        strokeWidth={2.2}
      />

      {/* Badge compteur */}
      {hasUnread && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            background: ANKU.red,
            boxShadow: `0 0 0 2px rgba(0,0,0,0.3)`,
          }}
        >
          {displayCount}
        </span>
      )}
    </Link>
  )
}
