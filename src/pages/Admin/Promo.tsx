import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  X,
  Power,
  Percent,
  Euro,
  User as UserIcon,
  Store,
} from 'lucide-react'
import { promoAdminApi } from '../../service/api/admin.api'
import type { PromoCode } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

const LABEL_CLS = 'block text-xs font-semibold text-gray-700 mb-1'

function formatDate(iso: string | null) {
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

// ============================================================
// Modal create/edit
// ============================================================
function PromoModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: PromoCode | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (open) {
      if (editing) {
        setCode(editing.code)
        setDescription(editing.description ?? '')
        setType(editing.type)
        setValue(String(parseFloat(editing.value)))
        setMinAmount(
          editing.min_amount ? String(parseFloat(editing.min_amount)) : ''
        )
        setMaxUses(editing.max_uses ? String(editing.max_uses) : '')
        setMaxUsesPerUser(
          editing.max_uses_per_user ? String(editing.max_uses_per_user) : ''
        )
        setValidFrom(editing.valid_from ? editing.valid_from.slice(0, 10) : '')
        setValidUntil(editing.valid_until ? editing.valid_until.slice(0, 10) : '')
        setIsActive(editing.is_active === 1)
      } else {
        setCode('')
        setDescription('')
        setType('percent')
        setValue('')
        setMinAmount('')
        setMaxUses('')
        setMaxUsesPerUser('')
        setValidFrom('')
        setValidUntil('')
        setIsActive(true)
      }
    }
  }, [open, editing])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !value) {
      toast.error('Code et valeur requis')
      return
    }
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Valeur invalide')
      return
    }

    setLoading(true)
    try {
      if (editing) {
        await promoAdminApi.update(editing.id, {
          description: description.trim() || null,
          type,
          value: numValue,
          min_amount: minAmount ? parseFloat(minAmount) : null,
          max_uses: maxUses ? parseInt(maxUses) : null,
          max_uses_per_user: maxUsesPerUser ? parseInt(maxUsesPerUser) : null,
          valid_from: validFrom ? new Date(validFrom).toISOString() : null,
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          is_active: isActive,
        })
        toast.success('Code promo modifié')
      } else {
        await promoAdminApi.create({
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
          type,
          value: numValue,
          min_amount: minAmount ? parseFloat(minAmount) : null,
          max_uses: maxUses ? parseInt(maxUses) : null,
          max_uses_per_user: maxUsesPerUser ? parseInt(maxUsesPerUser) : null,
          valid_from: validFrom ? new Date(validFrom).toISOString() : null,
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          is_active: isActive,
          notify_users: false,
        })
        toast.success('Code promo créé')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      const errObj: any = err?.response?.data?.errors || {}
      const firstFieldError = Object.values(errObj)[0] as string[] | undefined
      const msg =
        err?.response?.data?.message ||
        firstFieldError?.[0] ||
        'Erreur'
      toast.error(String(msg))
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-center justify-between sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h3 className="text-base font-bold text-gray-900">
            {editing ? 'Modifier' : 'Créer'} un code promo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className={LABEL_CLS}>
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex : PROMO20"
              disabled={!!editing}
              className={inputCls + ' font-mono disabled:opacity-60'}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : 20% sur toute la boutique"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>
                Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('percent')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition text-sm font-semibold ${
                    type === 'percent'
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-200 bg-gray-50'
                  }`}
                  style={{ background: type === 'percent' ? ANKU.green : undefined }}
                >
                  <Percent size={14} />
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setType('fixed')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition text-sm font-semibold ${
                    type === 'fixed'
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-200 bg-gray-50'
                  }`}
                  style={{ background: type === 'fixed' ? ANKU.green : undefined }}
                >
                  <Euro size={14} />
                  €
                </button>
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>
                Valeur <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'percent' ? '20' : '5.00'}
                min="0.01"
                step="0.01"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Montant min. (€)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="Ex : 30"
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Max utilisations</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Ex : 100"
                min="1"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Valide à partir du</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Valide jusqu'au</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Max utilisations / user</label>
            <input
              type="number"
              value={maxUsesPerUser}
              onChange={(e) => setMaxUsesPerUser(e.target.value)}
              placeholder="Ex : 1"
              min="1"
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Code actif immédiatement
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {loading ? '...' : editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null
}

// ============================================================
// Page
// ============================================================
export default function AdminPromo() {
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [activeOnly, setActiveOnly] = useState(false)
  const [scope, setScope] = useState<'all' | 'platform' | 'sellers'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PromoCode | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await promoAdminApi.list({ active_only: activeOnly })
      setPromos(res.promos)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly])

  const handleDelete = async (p: PromoCode) => {
    if (!confirm(`Supprimer le code "${p.code}" ?`)) return
    try {
      await promoAdminApi.delete(p.id)
      toast.success('Code supprimé')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleToggle = async (p: PromoCode) => {
    try {
      await promoAdminApi.update(p.id, { is_active: p.is_active !== 1 })
      toast.success(p.is_active === 1 ? 'Code désactivé' : 'Code activé')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const isExpired = (p: PromoCode) => {
    if (!p.valid_until) return false
    return new Date(p.valid_until).getTime() < Date.now()
  }

  const platformCount = promos.filter((p) => !p.seller_id).length
  const sellersCount = promos.filter((p) => !!p.seller_id).length

  const visiblePromos = promos.filter((p) => {
    if (scope === 'platform') return !p.seller_id
    if (scope === 'sellers') return !!p.seller_id
    return true
  })

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-3"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Ticket size={20} style={{ color: ANKU.greenDark }} />
            <h2 className="text-lg font-bold text-gray-900">Codes promo</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Crée et gère les codes promo de la plateforme.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition flex items-center gap-2 shrink-0"
          style={{ background: ANKU.green }}
        >
          <Plus size={16} />
          Nouveau code
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setScope('all')}
          className={`rounded-2xl p-4 border text-left transition ${
            scope === 'all'
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">
            Total
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {promos.length}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScope('platform')}
          className={`rounded-2xl p-4 border text-left transition ${
            scope === 'platform'
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">
            Plateforme
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {platformCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScope('sellers')}
          className={`rounded-2xl p-4 border text-left transition ${
            scope === 'sellers'
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">
            Vendeurs
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sellersCount}
          </p>
        </button>
      </div>

      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              scope === 'all' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ background: scope === 'all' ? ANKU.green : '#f3f4f6' }}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setScope('platform')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              scope === 'platform'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              background: scope === 'platform' ? ANKU.green : '#f3f4f6',
            }}
          >
            Plateforme
          </button>
          <button
            type="button"
            onClick={() => setScope('sellers')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              scope === 'sellers'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              background: scope === 'sellers' ? ANKU.green : '#f3f4f6',
            }}
          >
            Vendeurs
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-sm font-semibold text-gray-700">
            Actifs uniquement
          </span>
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : promos.length === 0 ? (
          <div className="p-10 text-center">
            <Ticket size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun code promo</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visiblePromos.map((p) => {
              const expired = isExpired(p)
              const isSellerPromo = !!p.seller_id && !!p.seller
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ background: ANKU.greenPale }}
                  >
                    {p.type === 'percent' ? '％' : '€'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold font-mono text-gray-900">
                        {p.code}
                      </p>
                      {p.is_active === 1 && !expired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          actif
                        </span>
                      ) : expired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          expiré
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          inactif
                        </span>
                      )}
                      {isSellerPromo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Store size={9} />
                          Vendeur
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Ticket size={9} />
                          Plateforme
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {p.type === 'percent'
                        ? `-${parseFloat(p.value)}%`
                        : `-${parseFloat(p.value).toFixed(2)}€`}
                      {p.min_amount && ` · min ${parseFloat(p.min_amount).toFixed(2)}€`}
                      {p.max_uses && ` · ${p.uses_count}/${p.max_uses} utilisés`}
                      {p.valid_until && ` · jusqu'au ${formatDate(p.valid_until)}`}
                    </p>
                    {isSellerPromo && p.seller && (
                      <div className="flex items-center gap-2 mt-1">
                        {p.seller.avatar_url ? (
                          <img
                            src={p.seller.avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 text-gray-500">
                            <UserIcon size={10} />
                          </div>
                        )}
                        <span className="text-[11px] text-gray-600">
                          {p.seller.first_name} {p.seller.last_name}
                          {p.seller.username && (
                            <span className="text-gray-400">
                              {' '}
                              @{p.seller.username}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(p)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                      title={p.is_active === 1 ? 'Désactiver' : 'Activer'}
                    >
                      <Power
                        size={15}
                        style={{ color: p.is_active === 1 ? '#059669' : '#9ca3af' }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p)
                        setModalOpen(true)
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                      title="Modifier"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PromoModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />
    </div>
  )
}
