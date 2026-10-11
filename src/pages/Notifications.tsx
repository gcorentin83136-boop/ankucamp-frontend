import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Bell,
  Package,
  Star,
  MessageSquare,
  Users,
  Info,
  Sparkles,
  CheckCheck,
  Check,
  Trash2,
  Loader,
  Filter,
} from 'lucide-react'
import notificationsApi from '../service/api/notifications.api'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import type { Notification, NotificationType } from '../types/notification'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type FilterType = 'all' | 'unread'

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `il y a ${h} h`
    const j = Math.floor(h / 24)
    if (j < 7) return `il y a ${j} j`
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
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

export default function Notifications() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<FilterType>('all')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list({ limit: 100, offset: 0 }),
        notificationsApi.unreadCount(),
      ])
      setNotifications(listRes.notifications ?? [])
      setUnreadCount(countRes.count ?? 0)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleClick = async (notif: Notification) => {
    if (notif.is_read === 0) {
      try {
        await notificationsApi.markAsRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id
              ? { ...n, is_read: 1, read_at: new Date().toISOString() }
              : n
          )
        )
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
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: 1,
          read_at: n.read_at ?? new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
      toast.success('Toutes marquées comme lues ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (e: React.MouseEvent, notifId: number) => {
    e.stopPropagation()
    try {
      await notificationsApi.remove(notifId)
      const removed = notifications.find((n) => n.id === notifId)
      setNotifications((prev) => prev.filter((n) => n.id !== notifId))
      if (removed && removed.is_read === 0) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const filtered =
    filter === 'unread'
      ? notifications.filter((n) => n.is_read === 0)
      : notifications

  return (
    <div className="relative min-h-screen">
      <AnimatedShopsBackground />

      <div className="relative max-w-4xl mx-auto py-6 px-3 sm:px-5 space-y-4">
        <div
          className="rounded-3xl p-6 sm:p-8 backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenPale}cc 0%, #ffffffcc 100%)`,
            border: `1px solid ${ANKU.green}22`,
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ background: ANKU.greenDark }}
            >
              <Bell size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Notifications
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Tout est à jour ✨'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition shadow-sm hover:shadow"
                style={{ background: ANKU.green }}
              >
                <CheckCheck size={14} />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-3 flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500" />
          <span className="text-xs font-bold text-gray-600 mr-1">Filtrer :</span>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={
              'text-xs font-bold px-3 py-1.5 rounded-full transition ' +
              (filter === 'all'
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200')
            }
            style={filter === 'all' ? { background: ANKU.green } : undefined}
          >
            Toutes ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={
              'text-xs font-bold px-3 py-1.5 rounded-full transition ' +
              (filter === 'unread'
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200')
            }
            style={filter === 'unread' ? { background: ANKU.green } : undefined}
          >
            Non lues ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
            <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
            <Bell size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-800">
              {filter === 'unread'
                ? 'Aucune notification non lue'
                : 'Aucune notification'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tu recevras ici les likes, commentaires et messages.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur overflow-hidden divide-y divide-gray-100">
            {filtered.map((notif) => {
              const cfg = getTypeConfig(notif.type)
              const Icon = cfg.icon
              const isUnread = notif.is_read === 0
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClick(notif)}
                  className={
                    'w-full text-left flex items-start gap-3 p-4 transition hover:bg-gray-50 ' +
                    (isUnread ? 'bg-blue-50/40' : '')
                  }
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={
                          'text-sm truncate text-gray-900 ' +
                          (isUnread ? 'font-extrabold' : 'font-semibold')
                        }
                      >
                        {notif.title}
                      </p>
                      {isUnread && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: ANKU.green }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {notif.content}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClick(notif)
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                        title="Marquer comme lu"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/feed"
            className="text-xs font-bold hover:underline"
            style={{ color: ANKU.greenDark }}
          >
            ← Retour au fil d'actualité
          </Link>
        </div>
      </div>
    </div>
  )
}