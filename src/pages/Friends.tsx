import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users,
  UserPlus,
  UserX,
  Search,
  Loader,
  Check,
  X,
  MessageSquare,
  Flag,
  Mail,
  Send,
} from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import friendsApi from '../service/api/friends.api'
import usersApi from '../service/api/users.api'
import { startDirectConversation } from '../service/api/messages.api'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import ReportModal from '../components/common/ReportModal'
import type { Friend, FriendRequest, FriendStats } from '../types/friend'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type Tab = 'friends' | 'received' | 'sent' | 'search'

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function fullName(u: { first_name: string; last_name: string }): string {
  return `${u.first_name} ${u.last_name}`.trim()
}

// ============================================================
// CARTE UTILISATEUR (réutilisable)
// ============================================================
function UserCard({
  user,
  actions,
  onReport,
  subtitle,
}: {
  user: Friend | FriendRequest
  actions?: React.ReactNode
  onReport?: () => void
  subtitle?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 flex items-center gap-3 hover:shadow-sm transition">
      <Link
        to={user.username ? `/u/${user.username}` : '#'}
        className="shrink-0"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: ANKU.greenDark }}
          >
            {(user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={user.username ? `/u/${user.username}` : '#'}
          className="text-sm font-bold text-gray-900 hover:underline truncate block"
        >
          {fullName(user)}
        </Link>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        {subtitle && (
          <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actions}
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition"
            title="Signaler ce profil"
          >
            <Flag size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PAGE FRIENDS
// ============================================================
export default function Friends() {
  const auth = useAuthStore()
  const currentUser = (auth as any)?.user
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('friends')

  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [received, setReceived] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [stats, setStats] = useState<FriendStats>({
    friends_count: 0,
    received_requests_count: 0,
  })

  // Recherche
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Signalement
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTargetId, setReportTargetId] = useState<number>(0)
  const [reportTargetLabel, setReportTargetLabel] = useState<string>('')

  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())

  // ==========================================================
  // Charger les données
  // ==========================================================
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, rRes, sRes, statsRes] = await Promise.allSettled([
        friendsApi.listMine(),
        friendsApi.receivedRequests(),
        friendsApi.sentRequests(),
        friendsApi.stats(),
      ])
      if (fRes.status === 'fulfilled') setFriends(fRes.value.friends ?? [])
      if (rRes.status === 'fulfilled') setReceived(rRes.value.requests ?? [])
      if (sRes.status === 'fulfilled') setSent(sRes.value.requests ?? [])
      if (statsRes.status === 'fulfilled') {
        setStats({
          friends_count: statsRes.value.friends_count ?? 0,
          received_requests_count: statsRes.value.received_requests_count ?? 0,
        })
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ==========================================================
  // Actions
  // ==========================================================
  const wrap = async (userId: number, fn: () => Promise<void>) => {
    if (pendingIds.has(userId)) return
    setPendingIds((p) => new Set(p).add(userId))
    try {
      await fn()
    } finally {
      setPendingIds((p) => {
        const next = new Set(p)
        next.delete(userId)
        return next
      })
    }
  }

  const handleAccept = (request: FriendRequest) =>
    wrap(request.requester_id ?? 0, async () => {
      try {
        await friendsApi.accept(request.id)
        toast.success(`${fullName(request)} est maintenant ton ami ✅`)
        await loadAll()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      }
    })

  const handleDecline = (request: FriendRequest) =>
    wrap(request.requester_id ?? 0, async () => {
      try {
        await friendsApi.decline(request.id)
        toast.success('Demande refusée')
        await loadAll()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      }
    })

  const handleCancel = (request: FriendRequest) =>
    wrap(request.receiver_id ?? 0, async () => {
      try {
        await friendsApi.cancel(request.id)
        toast.success('Demande annulée')
        await loadAll()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      }
    })

  const handleRemoveFriend = (friend: Friend) =>
    wrap(friend.id, async () => {
      if (!confirm(`Retirer ${fullName(friend)} de tes amis ?`)) return
      try {
        await friendsApi.remove(friend.id)
        toast.success('Ami retiré')
        await loadAll()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      }
    })

  const handleMessage = async (friend: Friend) => {
    try {
      const convId = await startDirectConversation(
        friend.id,
        `Salut ${friend.first_name} !`
      )
      navigate(`/messages/${convId}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleSendRequest = (user: any) =>
    wrap(user.id, async () => {
      try {
        await friendsApi.sendRequest(user.id)
        toast.success('Demande envoyée ✅')
        // Retire de la recherche
        setSearchResults((list) => list.filter((u) => u.id !== user.id))
        await loadAll()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      }
    })

  // ==========================================================
  // Recherche
  // ==========================================================
  useEffect(() => {
    if (tab !== 'search') return
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await usersApi.list({ search: q, limit: 20 })
        // Exclut moi-même et mes amis existants
        const friendIds = new Set(friends.map((f) => f.id))
        const filtered = res.users.filter(
          (u: any) => u.id !== currentUser?.id && !friendIds.has(u.id)
        )
        setSearchResults(filtered)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, tab, friends, currentUser?.id])

  // ==========================================================
  // Signalement
  // ==========================================================
  const openReport = (user: Friend | FriendRequest) => {
    setReportTargetId(user.id)
    setReportTargetLabel(`le profil de @${user.username}`)
    setReportOpen(true)
  }

  // ==========================================================
  // Rendus
  // ==========================================================
  const renderFriends = () => {
    if (loading)
      return (
        <div className="py-10 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      )
    if (friends.length === 0)
      return (
        <div className="py-10 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-800">Aucun ami</p>
          <p className="text-xs text-gray-500 mt-1">
            Trouve des amis dans l'onglet "Trouver des amis"
          </p>
        </div>
      )
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {friends.map((f) => (
          <UserCard
            key={f.id}
            user={f}
            subtitle={
              f.created_at
                ? `Ami depuis ${formatDate(f.created_at)}`
                : undefined
            }
            onReport={() => openReport(f)}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => handleMessage(f)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                  title="Envoyer un message"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  type="button"
                  disabled={pendingIds.has(f.id)}
                  onClick={() => handleRemoveFriend(f)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                  title="Retirer de mes amis"
                >
                  <UserX size={14} />
                </button>
              </>
            }
          />
        ))}
      </div>
    )
  }

  const renderReceived = () => {
    if (loading)
      return (
        <div className="py-10 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      )
    if (received.length === 0)
      return (
        <div className="py-10 text-center">
          <Mail size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-800">
            Aucune demande reçue
          </p>
        </div>
      )
    return (
      <div className="space-y-2">
        {received.map((r) => (
          <UserCard
            key={r.id}
            user={r}
            subtitle={`Demande reçue le ${formatDate(r.created_at)}`}
            onReport={() => openReport(r)}
            actions={
              <>
                <button
                  type="button"
                  disabled={pendingIds.has(r.requester_id ?? 0)}
                  onClick={() => handleAccept(r)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-50 inline-flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  <Check size={11} /> Accepter
                </button>
                <button
                  type="button"
                  disabled={pendingIds.has(r.requester_id ?? 0)}
                  onClick={() => handleDecline(r)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <X size={11} /> Refuser
                </button>
              </>
            }
          />
        ))}
      </div>
    )
  }

  const renderSent = () => {
    if (loading)
      return (
        <div className="py-10 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      )
    if (sent.length === 0)
      return (
        <div className="py-10 text-center">
          <Send size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-800">
            Aucune demande envoyée
          </p>
        </div>
      )
    return (
      <div className="space-y-2">
        {sent.map((r) => (
          <UserCard
            key={r.id}
            user={r}
            subtitle={`Envoyée le ${formatDate(r.created_at)}`}
            onReport={() => openReport(r)}
            actions={
              <button
                type="button"
                disabled={pendingIds.has(r.receiver_id ?? 0)}
                onClick={() => handleCancel(r)}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50 inline-flex items-center gap-1"
              >
                <X size={11} /> Annuler
              </button>
            }
          />
        ))}
      </div>
    )
  }

  const renderSearch = () => (
    <>
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom, prénom, @username…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition"
        />
      </div>

      {searching ? (
        <div className="py-10 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : searchQuery.trim().length < 2 ? (
        <div className="py-10 text-center">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            Tape au moins 2 caractères pour chercher
          </p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="py-10 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {searchResults.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onReport={() => openReport(u)}
              actions={
                <button
                  type="button"
                  disabled={pendingIds.has(u.id)}
                  onClick={() => handleSendRequest(u)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-50 inline-flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  <UserPlus size={11} /> Ajouter
                </button>
              }
            />
          ))}
        </div>
      )}
    </>
  )

  // ==========================================================
  // Rendu principal
  // ==========================================================
  const TABS: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'friends', label: 'Mes amis', icon: Users, count: stats.friends_count || friends.length },
    { key: 'received', label: 'Reçues', icon: Mail, count: received.length },
    { key: 'sent', label: 'Envoyées', icon: Send, count: sent.length },
    { key: 'search', label: 'Trouver', icon: Search, count: 0 },
  ]

  return (
    <div className="relative min-h-screen">
      <AnimatedShopsBackground />

      <div className="relative max-w-4xl mx-auto py-6 px-3 sm:px-5 space-y-5">
        {/* Bannière */}
        <div
          className="rounded-3xl p-6 sm:p-8 backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenPale}cc 0%, #ffffffcc 100%)`,
            border: `1px solid ${ANKU.green}22`,
          }}
        >
          <div className="flex items-center gap-2">
            <Users size={22} style={{ color: ANKU.greenDark }} />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Mes amis
            </h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {stats.friends_count || friends.length} ami
            {(stats.friends_count || friends.length) > 1 ? 's' : ''} ·{' '}
            {received.length} demande{received.length > 1 ? 's' : ''} reçue
            {received.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Onglets */}
        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-1 flex flex-wrap gap-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={
                  'flex-1 min-w-[120px] rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ' +
                  (active ? 'text-white' : 'text-gray-600 hover:bg-gray-100')
                }
                style={active ? { background: ANKU.green } : undefined}
              >
                <Icon size={12} />
                {t.label}
                {t.count > 0 && (
                  <span
                    className={
                      'ml-1 text-[10px] font-extrabold px-1.5 rounded-full ' +
                      (active
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-200 text-gray-700')
                    }
                  >
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
          {tab === 'friends' && renderFriends()}
          {tab === 'received' && renderReceived()}
          {tab === 'sent' && renderSent()}
          {tab === 'search' && renderSearch()}
        </div>
      </div>

      {/* Modal signalement */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user"
        targetId={reportTargetId}
        targetLabel={reportTargetLabel}
      />
    </div>
  )
}// TODO: coller le contenu de Friends