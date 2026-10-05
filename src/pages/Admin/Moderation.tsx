import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Trash2,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { moderationAdminApi } from '../../service/api/admin.api'
import type { ContentReport, ReportsStats } from '../../types/admin'

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

// ============================================================
// MODAL DÉTAIL
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

  if (!report) return null

  const handleResolve = async () => {
    if (!confirm('Marquer ce signalement comme résolu ?')) return
    setLoading(true)
    try {
      await moderationAdminApi.resolve(report.id, adminNote || undefined, deleteContent)
      toast.success('Signalement résolu')
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (adminNote.trim().length < 3) {
      toast.error('Ajoute une note pour justifier le rejet')
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
              Signalé le {formatDate(report.created_at)}
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
            <p className="text-[10px] font-semibold uppercase text-gray-500">
              Contenu signalé
            </p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {report.target_type} #{report.target_id}
            </p>
          </section>

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

          {/* Actions */}
          {report.status === 'pending' && (
            <section className="rounded-xl border border-gray-200 p-4 space-y-3">
              <label className="block text-sm font-semibold text-gray-800">
                Note admin <span className="text-gray-400">(obligatoire pour rejeter)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Ex : Contenu conforme aux CGU, pas de violation."
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
// PAGE PRINCIPALE
// ============================================================
export default function AdminModeration() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ContentReport[]>([])
  const [stats, setStats] = useState<ReportsStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed' | 'all'>('pending')
  const [selected, setSelected] = useState<ContentReport | null>(null)

  const fetchAll = async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

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
          <AlertTriangle size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Modération</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Traite les signalements de contenu inapproprié.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 border" style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-600" />
              <p className="text-xs font-semibold uppercase text-amber-700">En attente</p>
            </div>
            <p className="text-2xl font-extrabold text-amber-900 mt-1">{stats.pending}</p>
          </div>
          <div className="rounded-2xl p-4 border" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <p className="text-xs font-semibold uppercase text-emerald-700">Résolus</p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.resolved}</p>
          </div>
          <div className="rounded-2xl p-4 border" style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}>
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-gray-500" />
              <p className="text-xs font-semibold uppercase text-gray-600">Rejetés</p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.dismissed}</p>
          </div>
          <div className="rounded-2xl p-4 border" style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-gray-500" />
              <p className="text-xs font-semibold uppercase text-gray-600">Total</p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
          </div>
        </div>
      )}

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
                statusFilter === s ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ background: statusFilter === s ? ANKU.green : '#f3f4f6' }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Aucun signalement {STATUS_LABELS[statusFilter].toLowerCase()} 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
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
        )}
      </div>

      <ReportModal
        report={selected}
        onClose={() => setSelected(null)}
        onUpdated={fetchAll}
      />
    </div>
  )
}
