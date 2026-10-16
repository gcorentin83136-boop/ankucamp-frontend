import { useState } from 'react'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { AlertTriangle, RotateCcw, X, Loader } from 'lucide-react'
import refundsApi from '../../service/api/refunds.api'
import type { Order } from '../../types/order'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
}

const SUGGESTED_REASONS = [
  'Produit non conforme à la description',
  'Produit endommagé à la réception',
  'Produit jamais reçu',
  'Erreur de commande',
  'Autre',
]

interface Props {
  order: Order | null
  onClose: () => void
  onSuccess: () => void
}

export default function RefundRequestModal({ order, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!order) return null

  const handleSubmit = async () => {
    const trimmed = reason.trim()
    if (trimmed.length < 10) {
      toast.error('Décris ton motif en au moins 10 caractères')
      return
    }
    setSubmitting(true)
    try {
      await refundsApi.request({
        order_id: order.id,
        reason: trimmed,
      } as any)
      toast.success('Demande envoyée — un admin va l’examiner ✅')
      setReason('')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          'Impossible d’envoyer la demande de remboursement'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <header
          className="px-5 py-4 border-b flex items-start gap-3 shrink-0"
          style={{ borderColor: '#fde68a', background: '#fffbeb' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#fef3c7', color: '#a16207' }}
          >
            <RotateCcw size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-amber-900">
              Demander un remboursement
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Commande #{order.id} · {parseFloat(order.total_price).toFixed(2).replace('.', ',')} €
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div
            className="rounded-xl p-3 flex gap-3 text-xs"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800 leading-relaxed">
              Ta demande sera examinée par un administrateur ANKU.
              En cas d’acceptation, tu seras remboursé sur ton moyen de
              paiement d’origine sous 5 à 10 jours ouvrés.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">
              Motif suggéré
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition ' +
                    (reason === r
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-100')
                  }
                  style={reason === r ? { background: ANKU.green } : undefined}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Explique ta demande <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Décris précisément le problème rencontré…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">
              {reason.length} / 1000
            </p>
          </div>
        </div>

        <footer
          className="px-5 py-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0"
          style={{ borderColor: '#f3f4f6' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 10}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: ANKU.green }}
          >
            {submitting ? (
              <>
                <Loader size={14} className="animate-spin" /> Envoi…
              </>
            ) : (
              <>
                <RotateCcw size={14} /> Envoyer la demande
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}