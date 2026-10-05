import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Award,
  X,
  CheckCircle2,
  Ban,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { usersAdminApi } from '../../service/api/admin.api'
import type { AdminUser, BadgeType } from '../../types/admin'
import { ALL_BADGES } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  professionnel: 'bg-emerald-100 text-emerald-700',
  particulier: 'bg-blue-100 text-blue-700',
}

const PROFESSIONAL_ROLES = ['professionnel', 'admin']

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function isSuspended(user: AdminUser): boolean {
  if (!user.suspended_until) return false
  return new Date(user.suspended_until) > new Date()
}

// ============================================================
// Modal détail user + badges + actions admin
// ============================================================
function UserDetailModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUser | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [suspOpen, setSuspOpen] = useState(false)
  const [suspReason, setSuspReason] = useState('')
  const [suspDays, setSuspDays] = useState(15)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setSuspOpen(false)
    setDeleteOpen(false)
    setDeleteConfirm('')
    setSuspReason('')
    setSuspDays(15)

    usersAdminApi
      .listBadges(user.id)
      .then((r) => setBadges(r.badges || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const hasBadge = (b: BadgeType) => badges.includes(b)

  const userIsPro = PROFESSIONAL_ROLES.includes(user.role)
  const suspended = isSuspended(user)

  // ----------------------------------------------------------
  // Badges
  // ----------------------------------------------------------
  const reloadBadges = async () => {
    const r = await usersAdminApi.listBadges(user.id)
    setBadges(r.badges || [])
  }

  const handleGrant = async (badge: BadgeType) => {
    setActionLoading(true)
    try {
      await usersAdminApi.grantBadge(user.id, badge)
      toast.success(`Badge "${badge}" accordé à @${user.username}`)
      await reloadBadges()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevoke = async (badge: BadgeType) => {
    if (!confirm(`Révoquer le badge "${badge}" ?`)) return
    setActionLoading(true)
    try {
      await usersAdminApi.revokeBadge(user.id, badge)
      toast.success(`Badge "${badge}" révoqué`)
      await reloadBadges()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Suspension
  // ----------------------------------------------------------
  const handleSuspend = async () => {
    if (suspReason.trim().length < 3) {
      toast.error('Motif obligatoire (min 3 caractères)')
      return
    }
    setActionLoading(true)
    try {
      await usersAdminApi.suspend(user.id, suspDays, suspReason.trim())
      toast.success(`@${user.username} suspendu pour ${suspDays} jours`)
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    if (!confirm(`Lever la suspension de @${user.username} ?`)) return
    setActionLoading(true)
    try {
      await usersAdminApi.unsuspend(user.id)
      toast.success(`Suspension levée pour @${user.username}`)
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Suppression définitive
  // ----------------------------------------------------------
  const handleDelete = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'SUPPRIMER') {
      toast.error('Tape "SUPPRIMER" pour confirmer')
      return
    }
    setActionLoading(true)
    try {
      await usersAdminApi.deleteUser(user.id)
      toast.success(`Compte de @${user.username} supprimé définitivement`)
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                className="w-12 h-12 rounded-full object-cover"
                alt={user.first_name}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: ANKU.green }}
              >
                {user.first_name?.[0]?.toUpperCase()}
                {user.last_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                {suspended && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                    <Ban size={10} />
                    SUSPENDU
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                @{user.username} · {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* Bandeau suspension */}
          {suspended && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <Ban size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">
                    Compte suspendu jusqu’au{' '}
                    {formatDate(user.suspended_until)}
                  </p>
                  {user.suspension_reason && (
                    <p className="text-xs text-red-700 mt-1">
                      Motif : {user.suspension_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Infos */}
          <section className="rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-500">
                ID
              </p>
              <p className="font-bold text-gray-900">#{user.id}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-500">
                Rôle
              </p>
              <span
                className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                  ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-500">
                Email vérifié
              </p>
              <p className="font-semibold text-gray-900">
                {user.email_verified === 1 ? '✅ Oui' : '❌ Non'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-500">
                Inscrit le
              </p>
              <p className="font-semibold text-gray-900">
                {formatDate(user.created_at)}
              </p>
            </div>
          </section>

          {/* Badges — UNIQUEMENT pour pros / admins */}
          {userIsPro ? (
            <section className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} style={{ color: ANKU.greenDark }} />
                <h4 className="text-sm font-bold text-gray-900">
                  Badges ({badges.length})
                </h4>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Chargement…</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_BADGES.map((badge) => {
                    const owned = hasBadge(badge)
                    return (
                      <button
                        key={badge}
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          owned ? handleRevoke(badge) : handleGrant(badge)
                        }
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition"
                        style={{
                          background: owned ? '#f0fdf4' : '#f9fafb',
                          borderColor: owned ? '#bbf7d0' : '#e5e7eb',
                        }}
                      >
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {badge}
                        </span>
                        {owned ? (
                          <CheckCircle2
                            size={14}
                            className="text-emerald-600 shrink-0"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            +
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <p className="text-[10px] text-gray-500 mt-3">
                Clique sur un badge pour l’accorder ou le révoquer.
              </p>
            </section>
          ) : (
            <section className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-gray-400" />
                <p className="text-sm text-gray-500">
                  Les badges sont réservés aux comptes professionnels.
                </p>
              </div>
            </section>
          )}

          {/* Zone actions admin */}
          <section className="rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-600" />
              <h4 className="text-sm font-bold text-red-800">
                Actions administratives
              </h4>
            </div>

            {/* Suspension en cours */}
            {suspOpen ? (
              <div className="space-y-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Motif de la suspension
                  </label>
                  <textarea
                    value={suspReason}
                    onChange={(e) => setSuspReason(e.target.value)}
                    rows={2}
                    placeholder="Ex : Comportement inapproprié signalé"
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition resize-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Durée (jours)
                  </label>
                  <input
                    type="number"
                    value={suspDays}
                    onChange={(e) =>
                      setSuspDays(parseInt(e.target.value) || 15)
                    }
                    min={1}
                    max={365}
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                  <div className="flex gap-2 mt-2">
                    {[7, 15, 30, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSuspDays(d)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition ${
                          suspDays === d
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-amber-700 border border-amber-200'
                        }`}
                      >
                        {d}j
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSuspOpen(false)}
                    disabled={actionLoading}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSuspend}
                    disabled={actionLoading || suspReason.trim().length < 3}
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-50"
                  >
                    {actionLoading ? '...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            ) : deleteOpen ? (
              <div className="space-y-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <p className="text-sm font-bold text-red-800">
                    ⚠️ Suppression définitive
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Le compte sera anonymisé. Ses contenus (posts, commandes)
                    resteront visibles mais détachés. Cette action est
                    irréversible.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-800 mb-1">
                    Tape <code>SUPPRIMER</code> pour confirmer
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-500 transition"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(false)}
                    disabled={actionLoading}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={
                      actionLoading ||
                      deleteConfirm.trim().toUpperCase() !== 'SUPPRIMER'
                    }
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? '...' : 'Supprimer définitivement'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Suspend / Unsuspend */}
                {suspended ? (
                  <button
                    type="button"
                    onClick={handleUnsuspend}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm transition disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    Lever la suspension
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSuspOpen(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm transition disabled:opacity-50"
                  >
                    <Ban size={14} />
                    Suspendre ce compte
                  </button>
                )}

                {/* Suppression définitive */}
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Supprimer définitivement
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}

// ============================================================
// Page principale
// ============================================================
export default function AdminUsers() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [tab, setTab] = useState<'all' | 'suspended' | 'deleted'>('all')

  const fetchUsers = async (searchTerm = '') => {
    setLoading(true)
    try {
      const res = await usersAdminApi.list({
        search: searchTerm || undefined,
        limit: 100,
      })
      setUsers(res.users)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(search)
  }

  const isDeleted = (u: AdminUser) =>
    u.email.startsWith('deleted-') ||
    u.username.startsWith('deleted_')

  const filteredUsers = users.filter((u) => {
    if (tab === 'suspended') return isSuspended(u)
    if (tab === 'deleted') return isDeleted(u)
    return !isDeleted(u) // "Tous" exclut les supprimés anonymisés
  })

  const counts = {
    all: users.filter((u) => !isDeleted(u)).length,
    suspended: users.filter((u) => isSuspended(u)).length,
    deleted: users.filter((u) => isDeleted(u)).length,
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <Users size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Utilisateurs</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Recherche, consulte et gère les utilisateurs de la plateforme.
        </p>
      </div>

      {/* Onglets */}
      <div className="rounded-2xl p-2 border border-gray-200 bg-white flex gap-1">
        {([
          { key: 'all', label: 'Tous', count: counts.all },
          { key: 'suspended', label: 'Comptes suspendus', count: counts.suspended },
          { key: 'deleted', label: 'Comptes supprimés', count: counts.deleted },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === t.key
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ background: tab === t.key ? ANKU.green : undefined }}
          >
            {t.label}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key
                  ? 'bg-white/30 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <form
        onSubmit={handleSearch}
        className="rounded-2xl p-4 border border-gray-200 bg-white flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, username…"
            className={inputCls + ' !pl-10'}
          />
        </div>
        <button
          type="submit"
          className="rounded-full px-5 py-2 text-sm font-bold text-white transition shrink-0"
          style={{ background: ANKU.green }}
        >
          Rechercher
        </button>
      </form>

      {/* Liste */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((u) => {
              const suspended = isSuspended(u)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelected(u)}
                  className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                >
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.first_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: suspended ? '#dc2626' : ANKU.green }}
                    >
                      {u.first_name?.[0]?.toUpperCase()}
                      {u.last_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      {suspended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                          <Ban size={9} />
                          SUSPENDU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      @{u.username} · {u.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {u.role}
                    </span>
                    {u.email_verified !== 1 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        non vérifié
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <UserDetailModal
        user={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => fetchUsers(search)}
      />
    </div>
  )
}
