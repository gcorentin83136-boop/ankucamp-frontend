import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { refundsAdminApi } from '../../service/api/admin.api'
import type { RefundRequest } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

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
// MODAL DÉTAIL
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

  if (!refund) return null

  const handleApprove = async () => {
    if (!confirm(`Approuver le remboursement de ${formatEuro(refund.refund_amount)} ?`))
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
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-500">
                  Commande
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  #{refund.order_id}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-500">
                  Montant
                </p>
                <p className="text-lg font-extrabold text-gray-900 mt-0.5">
                  {formatEuro(refund.refund_amount)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-semibold uppercase text-gray-500">
              Motif de la demande
            </p>
            <p className="text-sm text-gray-900 mt-1 italic">
              « {refund.reason} »
            </p>
          </section>

          {!rejectOpen && (
            <section className="rounded-xl border border-gray-200 p-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Commentaire admin{' '}
                <span className="text-gray-400">(optionnel pour approuver)</span>
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

          {rejectOpen && (
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
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending')
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

  const filtered = refunds.filter((r) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'approved') {
      return r.status === 'approved' || r.status === 'refunded'
    }
    return r.status === statusFilter
  })

  const stats = {
    pending: refunds.filter((r) => r.status === 'pending').length,
    approved: refunds.filter(
      (r) => r.status === 'approved' || r.status === 'refunded'
    ).length,
    rejected: refunds.filter((r) => r.status === 'rejected').length,
    total: refunds.length,
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
          <RotateCcw size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Remboursements</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Traite les demandes de remboursement des acheteurs.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="rounded-2xl p-4 border"
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
        </div>
        <div
          className="rounded-2xl p-4 border"
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
        </div>
        <div
          className="rounded-2xl p-4 border"
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
        </div>
        <div
          className="rounded-2xl p-4 border"
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
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={14} />
          <span className="font-semibold">Filtres :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                statusFilter === s
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                background: statusFilter === s ? ANKU.green : '#f3f4f6',
              }}
            >
              {s === 'pending'
                ? 'En attente'
                : s === 'approved'
                ? 'Approuvés'
                : s === 'rejected'
                ? 'Rejetés'
                : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <RotateCcw size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun remboursement 🎉</p>
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
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <RotateCcw size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    Commande #{r.order_id}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {r.reason}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-gray-900">
                    {formatEuro(r.refund_amount)}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : r.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {r.status === 'refunded' ? 'approuvé' : r.status}
                  </span>
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
