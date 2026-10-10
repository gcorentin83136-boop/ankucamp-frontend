import { useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { X, Flag, Loader, AlertTriangle } from 'lucide-react'
import reportsApi from '../../service/api/reports.api'
import type { ReportTargetType, ReportReason } from '../../types/report'
import { REASON_LABELS, REASON_DESCRIPTIONS } from '../../types/report'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'copyright',
  'fake',
  'other',
]

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: number
  targetLabel?: string
}) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Choisis une raison')
      return
    }
    setSending(true)
    try {
      await reportsApi.create({
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || null,
      })
      toast.success('Signalement envoye. Merci pour ta vigilance')
      setReason(null)
      setDescription('')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div className="flex items-center gap-2">
            <Flag size={18} style={{ color: ANKU.greenDark }} />
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Signaler {targetLabel ?? 'ce contenu'}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Aide-nous a garder ANKU sain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/60 transition shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800">
              Les signalements abusifs peuvent entrainer des sanctions sur ton
              compte. Signale uniquement si tu es sur(e).
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2 block">
              1. Pourquoi signales-tu ce contenu ?
            </label>
            <div className="space-y-1.5">
              {REASONS.map((r) => {
                const active = reason === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={
                      'w-full text-left rounded-xl border p-2.5 transition ' +
                      (active
                        ? 'border-emerald-400 bg-emerald-50/60'
                        : 'border-gray-200 bg-white hover:bg-gray-50')
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={
                          'w-3 h-3 rounded-full border-2 shrink-0 ' +
                          (active
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300')
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">
                          {REASON_LABELS[r]}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {REASON_DESCRIPTIONS[r]}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
              2. Details (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Explique en quelques mots ce qui pose probleme..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {description.length}/1000
            </p>
          </div>
        </div>

        <footer
          className="px-5 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white"
          style={{ borderColor: '#f3f4f6' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || !reason}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: ANKU.green }}
          >
            {sending ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Flag size={14} />
            )}
            Signaler
          </button>
        </footer>
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}