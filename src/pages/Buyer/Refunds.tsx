import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { RotateCcw, Loader, Clock, CheckCircle2, XCircle, Package } from 'lucide-react'
import refundsApi from '../../service/api/refunds.api'
import type { RefundRequest, RefundStatus } from '../../types/refund'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function formatEuro(v: string | null): string {
  if (!v) return '—'
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return n.toFixed(2).replace('.', ',') + ' €'
}

const STATUS_CONFIG: Record<RefundStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'En attente', color: '#d97706', bg: '#fef3c7', icon: Clock },
  approved: { label: 'Approuvé', color: '#059669', bg: '#d1fae5', icon: CheckCircle2 },
  refunded: { label: 'Remboursé', color: '#0ea5e9', bg: '#e0f2fe', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
}

export default function BuyerRefunds() {
  const [loading, setLoading] = useState(true)
  const [refunds, setRefunds] = useState<RefundRequest[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await refundsApi.listMine()
        setRefunds(res.refunds)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)', border: '1px solid rgba(106,168,79,0.13)' }}>
        <div className="flex items-center gap-2">
          <RotateCcw size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Mes retours</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {refunds.length} demande{refunds.length > 1 ? 's' : ''} de remboursement
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : refunds.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <RotateCcw size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">Aucune demande de remboursement</p>
          <p className="text-xs text-gray-500 mt-1">Les retours se demandent depuis une commande livrée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => {
            const config = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending ?? STATUS_CONFIG.pending
            const StatusIcon = config.icon
            return (
              <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Package size={12} className="text-gray-400" />
                      Commande #{r.order_id}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Demandé le {formatDate(r.requested_at)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0" style={{ background: config.bg, color: config.color }}>
                    <StatusIcon size={9} /> {config.label}
                  </span>
                </div>
                {r.reason && (
                  <p className="text-sm text-gray-700 italic">« {r.reason} »</p>
                )}
                {r.refund_amount && (
                  <p className="text-sm font-bold" style={{ color: ANKU.greenDark }}>
                    Montant : {formatEuro(r.refund_amount)}
                  </p>
                )}
                {r.admin_comment && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <strong>Admin :</strong> {r.admin_comment}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
