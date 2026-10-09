import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  ArrowUpDown,
  User as UserIcon,
  Store,
  ShoppingBag,
  CreditCard,
  Calendar,
  Mail,
} from 'lucide-react'
import { refundsAdminApi } from '../../service/api/admin.api'
import type { RefundRequest } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'failed'
type SortOption = 'recent' | 'oldest' | 'amount_desc' | 'amount_asc'

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatEuro(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return `${n.toFixed(2).replace('.', ',')} €`
}

// ============================================================
// MODAL DÉTAIL ENRICHI
// ============================================================
function RefundModal({
  refund,
  onClose,
  onUpdated,
}: {
  refund: RefundRequest | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)

  useEffect(() => {
    setRejectOpen(false)
    setRejectNote('')
    setApproveNote('')
  }, [refund])

  if (!refund) return null

  const handleApprove = async () => {
    if (
      !confirm(
        `Approuver le remboursement de ${formatEuro(refund.refund_amount)} ?`
      )
    )
      return
    setLoading(true)
    try {
      await refundsAdminApi.approve(refund.id, approveNote.trim() || undefined)
      toast.success('Remboursement approuvé et effectué via Stripe')
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (rejectNote.trim().length < 3) {
      toast.error('Motif obligatoire (min 3 caractères)')
      return
    }
    setLoading(true)
    try {
      await refundsAdminApi.reject(refund.id, rejectNote.trim())
      toast.success('Remboursement rejeté')
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Remboursement #{refund.id}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Demandé le {formatDate(refund.requested_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0"
          >
            ✕
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* 👤 Demandeur */}
          {refund.buyer && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <UserIcon size={14} style={{ color: ANKU.greenDark }} />
                Demandeur
              </h4>
              <div className="flex items-center gap-3">
                {refund.buyer.avatar_url ? (
                  <img
                    src={refund.buyer.avatar_url}
                    alt={refund.buyer.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                  >
                    <UserIcon size={18} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {refund.buyer.first_name} {refund.buyer.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{refund.buyer.username}
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                    <Mail size={10} /> {refund.buyer.email}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 🏪 Boutique + Commande */}
          {(refund.shop || refund.order) && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag size={14} style={{ color: ANKU.greenDark }} />
                Commande & boutique
              </h4>
              <div className="flex items-center gap-3">
                {refund.shop?.logo_url ? (
                  <img
                    src={refund.shop.logo_url}
                    alt={refund.shop.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                  >
                    <Store size={18} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {refund.shop?.name ?? `Boutique #${refund.order?.seller_id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Commande #{refund.order_id} ·{' '}
                    {formatEuro(refund.order?.total_price)}
                  </p>
                  {refund.order && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> Commandé le{' '}
                      {formatDate(refund.order.created_at)}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 💳 Paiement */}
          {refund.payment && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={14} style={{ color: ANKU.greenDark }} />
                Paiement
              </h4>
              <div className="space-y-1 text-xs">
                <p className="text-gray-500">
                  Montant TTC :{' '}
                  <span className="font-bold text-gray-900">
                    {formatEuro(refund.payment.amount_ttc)}
                  </span>
                </p>
                <p className="text-gray-500">
                  Statut :{' '}
                  <span
                    className={`font-bold ${
                      refund.payment.status === 'succeeded'
                        ? 'text-emerald-600'
                        : refund.payment.status === 'refunded'
                        ? 'text-sky-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {refund.payment.status}
                  </span>
                </p>
                <p className="text-gray-500 font-mono text-[10px] break-all">
                  PI: {refund.payment.stripe_payment_intent}
                </p>
                {refund.stripe_refund_id && (
                  <p className="text-gray-500 font-mono text-[10px] break-all">
                    Refund Stripe: {refund.stripe_refund_id}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 📝 Motif */}
          <section className="rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-semibold uppercase text-gray-500">
              Motif de la demande
            </p>
            <p className="text-sm text-gray-900 mt-1 italic">
              « {refund.reason ?? '—'} »
            </p>
          </section>

          {/* Admin comment existant (si traité) */}
          {refund.status !== 'pending' && refund.admin_comment && (
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-[10px] font-semibold uppercase text-gray-500">
                Commentaire admin
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {refund.admin_comment}
              </p>
              {refund.processed_at && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Traité le {formatDate(refund.processed_at)}
                </p>
              )}
            </section>
          )}

          {/* Actions : pending uniquement */}
          {refund.status === 'pending' && !rejectOpen && (
            <section className="rounded-xl border border-gray-200 p-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Commentaire admin{' '}
                <span className="text-gray-400">
                  (optionnel pour approuver)
                </span>
              </label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={2}
                placeholder="Ex : Remboursement validé après vérification des photos."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
              />
            </section>
          )}

          {refund.status === 'pending' && rejectOpen && (
            <section className="rounded-xl border border-red-200 p-4 bg-red-50">
              <label className="block text-sm font-semibold text-red-800 mb-2">
                Motif du rejet
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                placeholder="Ex : La commande a déjà été livrée, hors délai de rétractation."
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition resize-none"
                autoFocus
              />
            </section>
          )}
        </div>

        {refund.status === 'pending' && (
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
              Fermer
            </button>
            {!rejectOpen ? (
              <>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={loading}
                  className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle size={14} />
                  Rejeter
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                  style={{ background: ANKU.green }}
                >
                  <CheckCircle2 size={14} />
                  {loading ? '...' : 'Approuver'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRejectOpen(false)
                    setRejectNote('')
                  }}
                  disabled={loading}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading || rejectNote.trim().length < 3}
                  className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                >
                  {loading ? '...' : 'Confirmer le rejet'}
                </button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function AdminRefunds() {
  const [loading, setLoading] = useState(true)
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('recent')
  const [selected, setSelected] = useState<RefundRequest | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await refundsAdminApi.list()
      setRefunds(res.refunds)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // -------- Stats --------
  const stats = useMemo(
    () => ({
      pending: refunds.filter((r) => r.status === 'pending').length,
      approved: refunds.filter(
        (r) => r.status === 'approved' || r.status === 'refunded'
      ).length,
      rejected: refunds.filter((r) => r.status === 'rejected').length,
      failed: refunds.filter((r) => r.status === 'failed').length,
      total: refunds.length,
    }),
    [refunds]
  )

  // -------- Filtre + recherche + tri --------
  const filtered = useMemo(() => {
    let list = [...refunds]

    // Filtre statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        list = list.filter(
          (r) => r.status === 'approved' || r.status === 'refunded'
        )
      } else {
        list = list.filter((r) => r.status === statusFilter)
      }
    }

    // Recherche
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => {
        const buyerName = r.buyer
          ? `${r.buyer.first_name} ${r.buyer.last_name} ${r.buyer.username} ${r.buyer.email}`.toLowerCase()
          : ''
        const shopName = r.shop?.name?.toLowerCase() ?? ''
        const reason = r.reason?.toLowerCase() ?? ''
        const orderId = String(r.order_id)
        const refundId = String(r.id)
        return (
          buyerName.includes(q) ||
          shopName.includes(q) ||
          reason.includes(q) ||
          orderId.includes(q) ||
          refundId.includes(q)
        )
      })
    }

    // Tri
    switch (sort) {
      case 'oldest':
        list.sort(
          (a, b) =>
            new Date(a.requested_at).getTime() -
            new Date(b.requested_at).getTime()
        )
        break
      case 'amount_desc':
        list.sort(
          (a, b) =>
            parseFloat(b.refund_amount ?? '0') -
            parseFloat(a.refund_amount ?? '0')
        )
        break
      case 'amount_asc':
        list.sort(
          (a, b) =>
            parseFloat(a.refund_amount ?? '0') -
            parseFloat(b.refund_amount ?? '0')
        )
        break
      case 'recent':
      default:
        list.sort(
          (a, b) =>
            new Date(b.requested_at).getTime() -
            new Date(a.requested_at).getTime()
        )
        break
    }

    return list
  }, [refunds, statusFilter, search, sort])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <RotateCcw size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Remboursements</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Traite les demandes de remboursement des acheteurs.
        </p>
      </div>

      {/* Stats cliquables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`rounded-2xl p-4 border text-left transition hover:shadow-md ${
            statusFilter === 'pending' ? 'ring-2 ring-amber-400' : ''
          }`}
          style={{ borderColor: '#fde68a', background: '#fffbeb' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-600" />
            <p className="text-xs font-semibold uppercase text-amber-700">
              En attente
            </p>
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">
            {stats.pending}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`rounded-2xl p-4 border text-left transition hover:shadow-md ${
            statusFilter === 'approved' ? 'ring-2 ring-emerald-400' : ''
          }`}
          style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Approuvés
            </p>
          </div>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">
            {stats.approved}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`rounded-2xl p-4 border text-left transition hover:shadow-md ${
            statusFilter === 'rejected' ? 'ring-2 ring-red-400' : ''
          }`}
          style={{ borderColor: '#fecaca', background: '#fef2f2' }}
        >
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-red-600" />
            <p className="text-xs font-semibold uppercase text-red-700">
              Rejetés
            </p>
          </div>
          <p className="text-2xl font-extrabold text-red-900 mt-1">
            {stats.rejected}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`rounded-2xl p-4 border text-left transition hover:shadow-md ${
            statusFilter === 'all' ? 'ring-2 ring-gray-400' : ''
          }`}
          style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-gray-500" />
            <p className="text-xs font-semibold uppercase text-gray-600">
              Total
            </p>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {stats.total}
          </p>
        </button>
      </div>

      {/* Filtres + recherche + tri */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={14} />
          <span className="font-semibold">Filtres :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: 'pending', label: 'En attente' },
              { v: 'approved', label: 'Approuvés' },
              { v: 'rejected', label: 'Rejetés' },
              { v: 'failed', label: 'Échoués' },
              { v: 'all', label: 'Tous' },
            ] as const
          ).map((s) => (
            <button
              key={s.v}
              type="button"
              onClick={() => setStatusFilter(s.v as StatusFilter)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                statusFilter === s.v
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                background: statusFilter === s.v ? ANKU.green : '#f3f4f6',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (n° commande, acheteur, boutique, motif)…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition"
            />
          </div>
          <div className="relative shrink-0">
            <ArrowUpDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:border-emerald-400 focus:bg-white transition appearance-none cursor-pointer"
            >
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="amount_desc">Montant ↓</option>
              <option value="amount_asc">Montant ↑</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <RotateCcw size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Aucun remboursement à afficher
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
                className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                {/* Avatar buyer */}
                {r.buyer?.avatar_url ? (
                  <img
                    src={r.buyer.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: ANKU.greenPale,
                      color: ANKU.greenDark,
                    }}
                  >
                    <UserIcon size={18} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {r.buyer
                        ? `${r.buyer.first_name} ${r.buyer.last_name}`
                        : `Demandeur #${r.requested_by}`}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : r.status === 'approved' || r.status === 'refunded'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status === 'failed'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.status === 'refunded' ? 'Approuvé' : r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Commande #{r.order_id}
                    {r.shop?.name ? ` · ${r.shop.name}` : ''}
                    {' · '}
                    {formatDate(r.requested_at)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate italic">
                    « {r.reason} »
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-gray-900">
                    {formatEuro(r.refund_amount)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Voir</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <RefundModal
        refund={selected}
        onClose={() => setSelected(null)}
        onUpdated={fetchAll}
      />
    </div>
  )
}