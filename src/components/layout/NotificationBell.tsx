import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Package,
  Star,
  MessageSquare,
  Users,
  Info,
  Sparkles,
  Loader,
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import notificationsApi from '../../service/api/notifications.api'
import type { Notification, NotificationType } from '../../types/notification'

const ANKU = {
  green: '#6aa84f',
  greenLight: '#8bc34a',
  greenDark: '#4a7a35',
  red: '#ef4444',
}

function getTypeConfig(type: NotificationType) {
  switch (type) {
    case 'order':
      return { icon: Package, color: '#0891b2', bg: '#cffafe' }
    case 'review':
      return { icon: Star, color: '#f59e0b', bg: '#fef3c7' }
    case 'message':
      return { icon: MessageSquare, color: '#8b5cf6', bg: '#ede9fe' }
    case 'social':
      return { icon: Users, color: '#0ea5e9', bg: '#e0f2fe' }
    case 'system':
      return { icon: Info, color: '#6b7280', bg: '#f3f4f6' }
    case 'welcome':
      return { icon: Sparkles, color: '#6aa84f', bg: '#f0f9e8' }
    default:
      return { icon: Bell, color: '#6b7280', bg: '#f3f4f6' }
  }
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h} h`
    const j = Math.floor(h / 24)
    if (j < 7) return `${j} j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

export default function NotificationBell() {
  const auth = useAuthStore()
  const { isAuthenticated } = auth
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number
    right: number
  } | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ----- Charger le count -----
  const loadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await notificationsApi.unreadCount()
      setUnreadCount(res.count ?? 0)
    } catch {
      // ignore
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    loadCount()
    const interval = setInterval(loadCount, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, loadCount])

  // ----- Charger la liste quand on ouvre -----
  useEffect(() => {
    if (!open || !isAuthenticated) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await notificationsApi.list({ limit: 5, offset: 0 })
        setNotifications(res.notifications ?? [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [open, isAuthenticated])

  // ----- Calculer la position du dropdown (fixed) -----
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onResize = () => updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, updatePosition])

  // ----- Fermer au clic extérieur -----
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        buttonRef.current?.contains(t) ||
        dropdownRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // ----- Fermer au ESC -----
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!isAuthenticated) return null

  const hasUnread = unreadCount > 0
  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount)

  const handleClickNotif = async (notif: Notification) => {
    setOpen(false)
    if (notif.is_read === 0) {
      try {
        await notificationsApi.markAsRead(notif.id)
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // ignore
      }
    }
    if (notif.link) navigate(notif.link)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
    } catch {
      // ignore
    }
  }

  // ============================================================
  // Dropdown rendu via Portal (sort du header, au-dessus de tout)
  // ============================================================
  const dropdown =
    open && dropdownPos ? (
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 overflow-hidden"
        style={{
          top: dropdownPos.top,
          right: dropdownPos.right,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold hover:underline"
              style={{ color: ANKU.greenDark }}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Liste */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center">
              <Loader
                size={20}
                className="animate-spin text-gray-400 mx-auto"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <Bell size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">
                Aucune notification pour le moment
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const cfg = getTypeConfig(notif.type)
              const Icon = cfg.icon
              const isUnread = notif.is_read === 0
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClickNotif(notif)}
                  className={
                    'w-full text-left flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50 border-b border-gray-50 ' +
                    (isUnread ? 'bg-blue-50/40' : '')
                  }
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={
                        'text-xs truncate text-gray-900 ' +
                        (isUnread ? 'font-extrabold' : 'font-semibold')
                      }
                    >
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                      {notif.content}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  {isUnread && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-2"
                      style={{ background: ANKU.green }}
                    />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block text-center py-3 text-xs font-bold transition border-t border-gray-100 hover:bg-gray-50"
          style={{ color: ANKU.greenDark }}
        >
          Voir toutes les notifications →
        </Link>
      </div>
    ) : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
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
      </button>

      {typeof window !== 'undefined' &&
        dropdown &&
        createPortal(dropdown, document.body)}
    </>
  )
}