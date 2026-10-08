import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Trash2,
  X,
  Star,
  MessageSquare,
  Package,
  User as UserIcon,
  Loader,
} from 'lucide-react'
import {
  moderationAdminApi,
  reviewsAdminApi,
} from '../../service/api/admin.api'
import type {
  ContentReport,
  ReportsStats,
  FlaggedReview,
} from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  resolved: 'Résolus',
  dismissed: 'Rejetés',
  all: 'Tous',
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

function StarRow({ value }: { value: number | null }) {
  const v = value ?? 0
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          fill={n <= v ? '#f59e0b' : 'none'}
          className={n <= v ? 'text-amber-500' : 'text-gray-300'}
        />
      ))}
    </span>
  )
}

// ============================================================
// MODAL : signalement classique (content_reports)
// ============================================================
function ReportModal({
  report,
  onClose,
  onUpdated,
}: {
  report: ContentReport | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [deleteContent, setDeleteContent] = useState(false)

  useEffect(() => {
    setAdminNote('')
    setDeleteContent(false)
  }, [report])

  if (!report) return null

  const handleResolve = async () => {
    if (!confirm('Marquer ce signalement comme résolu ?')) return
    setLoading(true)
    try {
      await moderationAdminApi.resolve(
        report.id,
        adminNote || undefined,
        deleteContent
      )
      toast.success('Signalement résolu ✅')
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (adminNote.trim().length < 10) {
      toast.error('Explique pourquoi tu rejettes (min 10 caractères)')
      return
    }
    if (!confirm('Rejeter ce signalement ?')) return
    setLoading(true)
    try {
      await moderationAdminApi.dismiss(report.id, adminNote.trim())
      toast.success('Signalement rejeté')
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
              Signalement #{report.id}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.target_type} #{report.target_id} · signalé le{' '}
              {formatDate(report.created_at)}
            </p>
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
          <section className="rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-semibold uppercase text-gray-500">
              Raison
            </p>
            <p className="text-sm text-gray-900 mt-1 font-semibold">
              {report.reason}
            </p>
            {report.description && (
              <p className="text-sm text-gray-600 mt-2 italic">
                « {report.description} »
              </p>
            )}
            <p className="text-xs text-gray-500 mt-3">
              Par @{report.reporter_username || 'inconnu'}
            </p>
          </section>

          {report.status === 'pending' && (
            <section className="rounded-xl border border-gray-200 p-4 space-y-3">
              <label className="block text-sm font-semibold text-gray-800">
                Note admin{' '}
                <span className="text-gray-400">
                  (obligatoire pour rejeter)
                </span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Ex : Contenu conforme aux CGU."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteContent}
                  onChange={(e) => setDeleteContent(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Trash2 size={14} className="text-red-500" />
                  Supprimer le contenu signalé
                </span>
              </label>
            </section>
          )}
        </div>

        {report.status === 'pending' && (
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
            <button
              type="button"
              onClick={handleDismiss}
              disabled={loading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-gray-500 hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <XCircle size={14} />
              Rejeter
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={loading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
              style={{ background: ANKU.green }}
            >
              <CheckCircle2 size={14} />
              Résoudre
            </button>
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
// MODAL : avis signalé
// ============================================================
function FlaggedReviewModal({
  review,
  onClose,
  onUpdated,
}: {
  review: FlaggedReview | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [deleteContent, setDeleteContent] = useState(false)

  useEffect(() => {
    setDeleteContent(false)
  }, [review])

  if (!review) return null

  const authorName =
    `${review.author_first_name ?? ''} ${review.author_last_name ?? ''}`.trim() ||
    review.author_username ||
    `Auteur #${review.author_id}`

  const handleResolve = async () => {
    if (!confirm('Traiter ce signalement d’avis ?')) return
    setLoading(true)
    try {
      await reviewsAdminApi.resolve(review.report_id, deleteContent)
      toast.success(
        deleteContent ? 'Avis supprimé ✅' : 'Avis conservé ✅'
      )
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (!confirm('Rejeter le signalement (garder l’avis) ?')) return
    setLoading(true)
    try {
      await reviewsAdminApi.dismiss(review.report_id)
      toast.success('Signalement rejeté — avis conservé ✅')
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
              Signalement #{review.report_id}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Signalé le {formatDate(review.report_created_at)}
            </p>
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
          {/* Produit */}
          <section className="rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-semibold uppercase text-gray-500">
              Produit concerné
            </p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {review.product_name ?? `Produit #${review.product_id}`}
            </p>
          </section>

          {/* Avis complet */}
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase text-gray-500">
                Avis original
              </p>
              <StarRow value={review.rating ?? 0} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              {review.author_avatar_url ? (
                <img
                  src={review.author_avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: ANKU.greenPale,
                    color: ANKU.greenDark,
                  }}
                >
                  <UserIcon size={12} />
                </div>
              )}
              <p className="text-xs font-semibold text-gray-700">
                {authorName}
              </p>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-800 italic whitespace-pre-wrap">
                « {review.comment} »
              </p>
            )}
          </section>

          {/* Raison du signalement */}
          {review.flag_reason && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-[10px] font-semibold uppercase text-red-700">
                Raison du signalement
              </p>
              <p className="text-sm text-red-900 mt-1 font-semibold">
                {review.flag_reason}
              </p>
            </section>
          )}

          {/* Options */}
          <section className="rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900">
              Que faire de cet avis ?
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteContent}
                onChange={(e) => setDeleteContent(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Trash2 size={14} className="text-red-500" />
                Supprimer l’avis (violation des CGU)
              </span>
            </label>
            <p className="text-[11px] text-gray-500">
              Si décoché, l’avis sera <strong>conservé</strong> et le
              signalement du vendeur rejeté.
            </p>
          </section>
        </div>

        <footer
          className="px-5 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white flex-wrap"
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
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-gray-500 hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            <XCircle size={14} />
            Rejeter l’avis
          </button>
          <button
            type="button"
            onClick={handleResolve}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Traiter
          </button>
        </footer>
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
type Tab = 'social' | 'reviews' | 'others'

export default function AdminModeration() {
  const [tab, setTab] = useState<Tab>('social')

  // Signalements classiques (content_reports)
  const [loadingReports, setLoadingReports] = useState(true)
  const [reports, setReports] = useState<ContentReport[]>([])
  const [stats, setStats] = useState<ReportsStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'resolved' | 'dismissed' | 'all'
  >('pending')

  // Avis signalés
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [flagged, setFlagged] = useState<FlaggedReview[]>([])

  // Modals
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(
    null
  )
  const [selectedReview, setSelectedReview] = useState<FlaggedReview | null>(
    null
  )

  const fetchReports = useCallback(async () => {
    setLoadingReports(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        moderationAdminApi.list({ status: statusFilter, limit: 100 }),
        moderationAdminApi.stats(),
      ])
      setReports(listRes.reports)
      setStats(statsRes)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoadingReports(false)
    }
  }, [statusFilter])

  const fetchFlagged = useCallback(async () => {
    setLoadingReviews(true)
    try {
      const res = await reviewsAdminApi.listFlagged(statusFilter)
      setFlagged(res.reviews as any)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoadingReviews(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports, statusFilter])

  useEffect(() => {
    fetchFlagged()
  }, [fetchFlagged, statusFilter])

  // Filtrage des reports par "section"
  const socialReports = useMemo(
    () =>
      reports.filter(
        (r) => r.target_type === 'post' || r.target_type === 'comment'
      ),
    [reports]
  )

  const otherReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.target_type === 'product' ||
          r.target_type === 'shop' ||
          r.target_type === 'user' ||
          r.target_type === 'message'
      ),
    [reports]
  )

  const renderReportsList = (list: ContentReport[]) => {
    if (loadingReports) {
      return (
        <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
      )
    }
    if (list.length === 0) {
      return (
        <div className="p-10 text-center">
          <CheckCircle2 size={40} className="mx-auto text-emerald-300 mb-3" />
          <p className="text-sm text-gray-500">
            Aucun signalement {STATUS_LABELS[statusFilter].toLowerCase()} 🎉
          </p>
        </div>
      )
    }
    return (
      <div className="divide-y divide-gray-100">
        {list.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedReport(r)}
            className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#fee2e2' }}
            >
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {r.target_type} #{r.target_id}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {r.reason}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                par @{r.reporter_username || 'inconnu'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : r.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {r.status}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {formatDate(r.created_at)}
              </p>
            </div>
          </button>
        ))}
      </div>
    )
  }

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
          <AlertTriangle size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Modération</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Traite les signalements de contenu inapproprié.
        </p>
      </div>

      {/* Stats */}
      {stats && (
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
                Résolus
              </p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 mt-1">
              {stats.resolved}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
          >
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-gray-500" />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Rejetés
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.dismissed}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-gray-500" />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Total
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.total}
            </p>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="rounded-2xl p-1 border border-gray-200 bg-white flex gap-1">
        <button
          type="button"
          onClick={() => setTab('social')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            tab === 'social' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ background: tab === 'social' ? ANKU.green : undefined }}
        >
          <MessageSquare size={14} />
          Réseau social
          {socialReports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="text-[10px] font-bold px-1.5 rounded-full bg-white/30">
              {socialReports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            tab === 'reviews' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ background: tab === 'reviews' ? ANKU.green : undefined }}
        >
          <Star size={14} />
          Avis
          {flagged.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 rounded-full bg-white/30">
              {flagged.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('others')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            tab === 'others' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ background: tab === 'others' ? ANKU.green : undefined }}
        >
          <Package size={14} />
          Autres
          {otherReports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="text-[10px] font-bold px-1.5 rounded-full bg-white/30">
              {otherReports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Filtres (sur les 3 onglets) */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={14} />
          <span className="font-semibold">Filtres :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'resolved', 'dismissed', 'all'] as const).map((s) => (
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
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Liste selon l'onglet */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {tab === 'social' && renderReportsList(socialReports)}
        {tab === 'others' && renderReportsList(otherReports)}

        {tab === 'reviews' &&
          (loadingReviews ? (
            <p className="text-sm text-gray-500 p-6 text-center">
              Chargement…
            </p>
          ) : flagged.length === 0 ? (
            <div className="p-10 text-center">
              <Star size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                Aucun avis signalé pour l’instant 🎉
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {flagged.map((r) => {
                const authorName =
                  `${r.author_first_name ?? ''} ${r.author_last_name ?? ''}`.trim() ||
                  r.author_username ||
                  `Auteur #${r.author_id}`
                return (
                  <button
                    key={r.report_id}
                    type="button"
                    onClick={() => setSelectedReview(r)}
                    className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#fef3c7' }}
                    >
                      <Star size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        Signalement #{r.report_id} · {authorName}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {r.product_name ?? `Produit #${r.product_id}`}
                      </p>
                      {r.flag_reason && (
                        <p className="text-[11px] text-red-600 mt-0.5 truncate">
                          ⚠ {r.flag_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <StarRow value={r.rating ?? 0} />
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDate(r.report_created_at)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
      </div>

      {/* Modals */}
      <ReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdated={fetchReports}
      />
      <FlaggedReviewModal
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onUpdated={fetchFlagged}
      />
    </div>
  )
}
