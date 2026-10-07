import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Copy,
  X,
  Save,
  Filter,
  Calendar,
  Percent,
  Euro,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
} from 'lucide-react'
import { promoSellerApi } from '../../service/api/promo.api'
import type {
  PromoCode,
  PromoType,
  CreateSellerPromoPayload,
} from '../../types/promo'
import StatCard from '../../components/seller/StatCard'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatEuro(v: string | number | null): string {
  if (v === null || v === undefined) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return `${n.toFixed(2).replace('.', ',')} €`
}

function formatDate(iso: string | null): string {
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

function toInputDate(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

type PromoStatus =
  | 'active'
  | 'inactive'
  | 'expired'
  | 'exhausted'
  | 'scheduled'

function computeStatus(p: PromoCode): PromoStatus {
  if (p.is_active === 0) return 'inactive'
  if (p.max_uses && p.uses_count >= p.max_uses) return 'exhausted'
  const now = Date.now()
  if (p.valid_until && new Date(p.valid_until).getTime() < now) return 'expired'
  if (p.valid_from && new Date(p.valid_from).getTime() > now) return 'scheduled'
  return 'active'
}

const STATUS_CONFIG: Record<
  PromoStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  active: { label: 'Actif', color: '#059669', bg: '#d1fae5', icon: CheckCircle2 },
  scheduled: { label: 'Programmé', color: '#0891b2', bg: '#cffafe', icon: Clock },
  exhausted: { label: 'Épuisé', color: '#7c3aed', bg: '#ede9fe', icon: XCircle },
  expired: { label: 'Expiré', color: '#9ca3af', bg: '#f3f4f6', icon: Clock },
  inactive: { label: 'Désactivé', color: '#d97706', bg: '#fef3c7', icon: XCircle },
}

function formatPromoValue(p: PromoCode): string {
  const val = parseFloat(p.value)
  if (isNaN(val)) return '—'
  return p.type === 'percent'
    ? `-${val}%`
    : `-${val.toFixed(2).replace('.', ',')} €`
}

// ============================================================
// MODAL
// ============================================================
function PromoModal({
  open,
  promo,
  onClose,
  onSaved,
}: {
  open: boolean
  promo: PromoCode | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!promo
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percent' as PromoType,
    value: '',
    min_amount: '',
    max_uses: '',
    max_uses_per_user: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  })

  useEffect(() => {
    if (!open) return
    if (promo) {
      setForm({
        code: promo.code,
        description: promo.description ?? '',
        type: promo.type,
        value: String(parseFloat(promo.value)),
        min_amount: promo.min_amount ? String(parseFloat(promo.min_amount)) : '',
        max_uses: promo.max_uses ? String(promo.max_uses) : '',
        max_uses_per_user: promo.max_uses_per_user
          ? String(promo.max_uses_per_user)
          : '',
        valid_from: toInputDate(promo.valid_from),
        valid_until: toInputDate(promo.valid_until),
        is_active: promo.is_active === 1,
      })
    } else {
      setForm({
        code: '',
        description: '',
        type: 'percent',
        value: '',
        min_amount: '',
        max_uses: '',
        max_uses_per_user: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
      })
    }
  }, [open, promo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (code.length < 3) {
      toast.error('Le code doit faire au moins 3 caractères')
      return
    }
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      toast.error('Uniquement lettres, chiffres, - et _')
      return
    }
    const val = parseFloat(form.value)
    if (isNaN(val) || val <= 0) {
      toast.error('Valeur invalide (> 0)')
      return
    }
    if (form.type === 'percent' && val > 100) {
      toast.error('Un pourcentage ne peut dépasser 100')
      return
    }
    if (
      form.valid_from &&
      form.valid_until &&
      form.valid_from > form.valid_until
    ) {
      toast.error('Date de début après date de fin')
      return
    }

    setLoading(true)
    try {
      const payload: CreateSellerPromoPayload = {
        code,
        description: form.description.trim() || null,
        type: form.type,
        value: val,
        min_amount: form.min_amount ? parseFloat(form.min_amount) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        max_uses_per_user: form.max_uses_per_user
          ? parseInt(form.max_uses_per_user)
          : null,
        valid_from: form.valid_from
          ? new Date(form.valid_from).toISOString()
          : null,
        valid_until: form.valid_until
          ? new Date(form.valid_until + 'T23:59:59').toISOString()
          : null,
        is_active: form.is_active,
      }

      if (isEdit && promo) {
        await promoSellerApi.update(promo.id, payload)
        toast.success('Code promo modifié ✅')
      } else {
        await promoSellerApi.create(payload)
        toast.success('Code promo créé ✅')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Modifier le code promo' : 'Nouveau code promo'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? `#${promo?.id} · ${promo?.code}`
                : 'Crée un code de réduction pour tes clients'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                })
              }
              placeholder="Ex : BIENVENUE10"
              className={inputCls + ' font-mono tracking-wider'}
              maxLength={50}
              disabled={isEdit}
              autoFocus
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Majuscules, chiffres, - et _ (3 à 50 caractères)
              {isEdit && ' · non modifiable après création'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex : -10% pour les nouveaux clients"
              className={inputCls}
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Type *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'percent' })}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                    form.type === 'percent'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background: form.type === 'percent' ? ANKU.green : undefined,
                  }}
                >
                  <Percent size={14} />%
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'fixed' })}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                    form.type === 'fixed'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background: form.type === 'fixed' ? ANKU.green : undefined,
                  }}
                >
                  <Euro size={14} />
                  Fixe
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {form.type === 'percent' ? 'Pourcentage *' : 'Montant (€) *'}
              </label>
              <input
                type="number"
                step={form.type === 'percent' ? '1' : '0.01'}
                min={form.type === 'percent' ? '1' : '0.01'}
                max={form.type === 'percent' ? '100' : undefined}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'percent' ? '10' : '5.00'}
                className={inputCls}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900">
              Contraintes (optionnel)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Montant minimum (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_amount: e.target.value })
                  }
                  placeholder="Ex : 20"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre max d'utilisations
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Illimité"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max par client
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses_per_user}
                  onChange={(e) =>
                    setForm({ ...form, max_uses_per_user: e.target.value })
                  }
                  placeholder="Illimité"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Valide à partir du
                </label>
                <input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) =>
                    setForm({ ...form, valid_from: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Jusqu'au
                </label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) =>
                    setForm({ ...form, valid_until: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 accent-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Activer immédiatement
              </p>
              <p className="text-[11px] text-gray-500">
                Le code sera utilisable dès la création
              </p>
            </div>
          </label>
        </div>

        <footer
          className="px-5 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white"
          style={{ borderColor: '#f3f4f6' }}
        >
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
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: ANKU.green }}
          >
            <Save size={14} />
            {loading ? '...' : isEdit ? 'Enregistrer' : 'Créer le code'}
          </button>
        </footer>
      </form>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null
}

// ============================================================
// MODAL SUPPRESSION
// ============================================================
function DeletePromoModal({
  promo,
  onClose,
  onConfirm,
  loading,
}: {
  promo: PromoCode | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!promo) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Supprimer le code
            </h3>
            <p className="text-xs text-red-700 mt-0.5 font-mono">{promo.code}</p>
          </div>
        </header>

        <div className="p-5">
          <p className="text-sm text-gray-700">
            Ce code sera <strong>définitivement supprimé</strong> ainsi que son
            historique d'utilisation.
          </p>
        </div>

        <footer className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
            {loading ? '...' : 'Supprimer'}
          </button>
        </footer>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null
}

// ============================================================
// PAGE
// ============================================================
export default function SellerPromo() {
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [filter, setFilter] = useState<PromoStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PromoCode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await promoSellerApi.listMine()
      setPromos(res.promos)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const promosWithStatus = useMemo(
    () => promos.map((p) => ({ ...p, _status: computeStatus(p) })),
    [promos]
  )

  const stats = useMemo(() => {
    const all = promosWithStatus
    return {
      total: all.length,
      active: all.filter((p) => p._status === 'active').length,
      scheduled: all.filter((p) => p._status === 'scheduled').length,
      expired: all.filter(
        (p) => p._status === 'expired' || p._status === 'exhausted'
      ).length,
      inactive: all.filter((p) => p._status === 'inactive').length,
    }
  }, [promosWithStatus])

  const filtered = useMemo(() => {
    if (filter === 'all') return promosWithStatus
    return promosWithStatus.filter((p) => p._status === filter)
  }, [promosWithStatus, filter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await promoSellerApi.delete(deleteTarget.id)
      toast.success('Code supprimé ✅')
      setPromos((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copié 📋')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const handleDuplicate = (p: PromoCode) => {
    setEditing({ ...p, id: 0, code: p.code + '-2', uses_count: 0 } as PromoCode)
    setModalOpen(true)
  }

  const STATUS_FILTERS: { value: PromoStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'scheduled', label: 'Programmés' },
    { value: 'expired', label: 'Expirés' },
    { value: 'exhausted', label: 'Épuisés' },
    { value: 'inactive', label: 'Désactivés' },
  ]

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap"
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
            {promos.length} code{promos.length > 1 ? 's' : ''} créé
            {promos.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition flex items-center gap-2"
          style={{ background: ANKU.green }}
        >
          <Plus size={16} />
          Nouveau code
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Tag size={18} />}
          onClick={() => setFilter('all')}
        />
        <StatCard
          label="Actifs"
          value={stats.active}
          icon={<CheckCircle2 size={18} />}
          highlight={stats.active > 0}
          onClick={() => setFilter('active')}
        />
        <StatCard
          label="Programmés"
          value={stats.scheduled}
          icon={<Clock size={18} />}
          onClick={() => setFilter('scheduled')}
        />
        <StatCard
          label="Expirés"
          value={stats.expired}
          icon={<XCircle size={18} />}
          onClick={() => setFilter('expired')}
        />
        <StatCard
          label="Désactivés"
          value={stats.inactive}
          icon={<XCircle size={18} />}
          onClick={() => setFilter('inactive')}
        />
      </div>

      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <Filter size={14} />
          <span className="font-semibold">Filtrer :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filter === f.value
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                background: filter === f.value ? ANKU.green : '#f3f4f6',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Ticket size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {promos.length === 0
              ? 'Aucun code promo pour l’instant'
              : 'Aucun code dans ce filtre'}
          </p>
          {promos.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white transition"
              style={{ background: ANKU.green }}
            >
              Créer mon premier code
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {filtered.map((p) => {
            const config = STATUS_CONFIG[p._status]
            const StatusIcon = config.icon
            const usagePct =
              p.max_uses && p.max_uses > 0
                ? Math.min(100, Math.round((p.uses_count / p.max_uses) * 100))
                : null

            return (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="rounded-xl px-3 py-2 font-mono font-bold text-sm"
                    style={{
                      background: ANKU.greenPale,
                      color: ANKU.greenDark,
                      border: `1px dashed ${ANKU.green}66`,
                    }}
                  >
                    {p.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(p.code)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                    title="Copier le code"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-bold"
                      style={{ color: ANKU.greenDark }}
                    >
                      {formatPromoValue(p)}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: config.bg, color: config.color }}
                    >
                      <StatusIcon size={9} />
                      {config.label}
                    </span>
                    {p.min_amount && parseFloat(p.min_amount) > 0 && (
                      <span className="text-[10px] text-gray-500">
                        min. {formatEuro(p.min_amount)}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 flex-wrap">
                    <span>
                      {p.uses_count} utilisation{p.uses_count > 1 ? 's' : ''}
                      {p.max_uses ? ` / ${p.max_uses}` : ''}
                    </span>
                    {p.valid_until && (
                      <span>· Expire le {formatDate(p.valid_until)}</span>
                    )}
                  </div>

                  {usagePct !== null && (
                    <div className="mt-1.5 w-full max-w-xs h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${usagePct}%`,
                          background: usagePct >= 100 ? '#dc2626' : ANKU.green,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(p)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                    title="Dupliquer"
                  >
                    <Copy size={15} />
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
                    onClick={() => setDeleteTarget(p)}
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

      <PromoModal
        open={modalOpen}
        promo={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />

      <DeletePromoModal
        promo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
