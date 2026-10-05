import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Building2,
  Calendar,
  User,
  AlertTriangle,
} from 'lucide-react'
import type { KycRequest } from '../../types/admin'
import { kycAdminApi } from '../../service/api/admin.api'
import toast from 'react-hot-toast'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

interface KycDetailModalProps {
  request: KycRequest | null
  onClose: () => void
  onUpdated: () => void
}

const TYPE_LABELS: Record<string, string> = {
  agriculteur: '🌾 Agriculteur',
  artisan: '🔨 Artisan',
  createur: '🎨 Créateur',
  autre: '📦 Autre',
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function KycDetailModal({
  request,
  onClose,
  onUpdated,
}: KycDetailModalProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!request) return null

  const documents = parseJson<string[]>(request.documents) ?? []
  const siretData = parseJson<Record<string, any>>(request.siret_data)

  const handleApprove = async () => {
    if (!confirm(`Approuver le KYC de @${request.username} ?`)) return
    setLoading(true)
    try {
      await kycAdminApi.approve(request.id)
      toast.success(`KYC approuvé pour @${request.username}`)
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (rejectReason.trim().length < 10) {
      toast.error('Le motif doit faire au moins 10 caractères')
      return
    }
    setLoading(true)
    try {
      await kycAdminApi.reject(request.id, rejectReason.trim())
      toast.success(`KYC refusé pour @${request.username}`)
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
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">
                Demande KYC #{request.id}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  request.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : request.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {request.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Soumis le {formatDate(request.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/50 shrink-0 transition"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* User */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={14} style={{ color: ANKU.greenDark }} />
              Demandeur
            </h4>
            <div className="flex items-center gap-3">
              {request.avatar_url ? (
                <img
                  src={request.avatar_url}
                  alt={request.first_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: ANKU.green }}
                >
                  {request.first_name?.[0]?.toUpperCase()}
                  {request.last_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {request.first_name} {request.last_name}
                </p>
                <p className="text-xs text-gray-500">@{request.username}</p>
              </div>
            </div>
          </section>

          {/* Type + SIRET */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 size={14} style={{ color: ANKU.greenDark }} />
              Entreprise
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-500">
                  Type d’activité
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {TYPE_LABELS[request.type] || request.type}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-500">
                  SIRET
                </p>
                <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">
                  {request.siret}
                </p>
              </div>
            </div>
            {request.siret_verified === 1 && (
              <div
                className="mt-3 p-2 rounded-lg flex items-center gap-2 text-xs"
                style={{ background: '#f0fdf4', color: '#065f46' }}
              >
                <CheckCircle2 size={14} />
                SIRET vérifié via l’API Sirene
              </div>
            )}
          </section>

          {/* Données SIRENE */}
          {siretData && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Données SIRENE
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(siretData).slice(0, 10).map(([key, value]) => {
                  if (value === null || value === undefined) return null
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-500 font-semibold">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-800 truncate">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Documents */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={14} style={{ color: ANKU.greenDark }} />
              Documents justificatifs
            </h4>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun document</p>
            ) : (
              <div className="space-y-2">
                {documents.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                    >
                      <FileText size={14} />
                    </div>
                    <span className="text-sm text-gray-700 truncate flex-1">
                      Document {i + 1}
                    </span>
                    <ExternalLink
                      size={14}
                      className="text-gray-400 group-hover:text-gray-700 shrink-0"
                    />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Motif de refus (si déjà refusé) */}
          {request.status === 'rejected' && request.rejection_reason && (
            <section className="rounded-xl border border-red-200 p-4 bg-red-50">
              <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={14} />
                Motif du refus
              </h4>
              <p className="text-sm text-red-700">{request.rejection_reason}</p>
            </section>
          )}

          {/* Infos de traitement (si déjà traité) */}
          {request.status !== 'pending' && request.reviewed_at && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Calendar size={12} />
              Traité le {formatDate(request.reviewed_at)}
            </p>
          )}
        </div>

        {/* Footer actions */}
        {request.status === 'pending' && !rejectOpen && (
          <footer
            className="px-5 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white"
            style={{ borderColor: '#f3f4f6' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              disabled={loading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <XCircle size={14} />
              Refuser
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
          </footer>
        )}

        {/* Formulaire de refus */}
        {request.status === 'pending' && rejectOpen && (
          <footer
            className="px-5 py-4 border-t sticky bottom-0 bg-white"
            style={{ borderColor: '#f3f4f6' }}
          >
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Motif du refus <span className="text-gray-400">(min 10 caractères)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Ex : Les documents fournis sont illisibles. Merci de renvoyer un extrait SIRENE en bonne qualité."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(false)
                  setRejectReason('')
                }}
                disabled={loading}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading || rejectReason.trim().length < 10}
                className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
              >
                {loading ? '...' : 'Confirmer le refus'}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}
