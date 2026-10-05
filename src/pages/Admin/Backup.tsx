import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Database,
  Play,
  Clock,
  HardDrive,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { backupAdminApi } from '../../service/api/admin.api'
import type { BackupFile, BackupStats } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export default function AdminBackup() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        backupAdminApi.list(),
        backupAdminApi.stats(),
      ])
      setBackups(listRes.backups)
      setStats(statsRes)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleRun = async () => {
    if (
      !confirm(
        'Lancer un backup maintenant ? Cette opération peut prendre 30 secondes.'
      )
    )
      return
    setRunning(true)
    try {
      const res = await backupAdminApi.run()
      toast.success(
        `Backup créé : ${res.filename} (${formatSize(res.size_bytes)})`
      )
      await fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setRunning(false)
    }
  }

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
            <Database size={20} style={{ color: ANKU.greenDark }} />
            <h2 className="text-lg font-bold text-gray-900">Sauvegardes</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Crée et consulte l’historique des sauvegardes BDD.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition flex items-center gap-2 shrink-0 disabled:opacity-50"
          style={{ background: ANKU.green }}
        >
          {running ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              En cours…
            </>
          ) : (
            <>
              <Play size={16} />
              Lancer un backup
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <Database size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Total backups
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.count}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <HardDrive size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Espace utilisé
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.total_size_mb.toFixed(1)} MB
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Dernier backup
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {stats.last_backup
                ? formatDate(stats.last_backup.created_at)
                : '—'}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Rétention
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.retention_days} j
            </p>
          </div>
        </div>
      )}

      {/* Liste des backups */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h3 className="text-sm font-bold text-gray-900">
            Historique des backups ({backups.length})
          </h3>
        </header>

        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : backups.length === 0 ? (
          <div className="p-10 text-center">
            <Database size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun backup disponible</p>
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white transition"
              style={{ background: ANKU.green }}
            >
              Créer le premier
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {backups.map((b, i) => (
              <div
                key={b.filename}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <Database size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-mono text-gray-900 truncate">
                    {b.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(b.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-700">
                    {formatSize(b.size_bytes)}
                  </p>
                  {i === 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      récent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note d'info */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold">💡 À savoir</p>
        <p className="text-xs mt-1">
          Les backups sont stockés localement sur le serveur. La rétention
          actuelle est de <strong>{stats?.retention_days || 30} jours</strong> :
          les backups plus anciens sont automatiquement supprimés.
        </p>
      </div>
    </div>
  )
}
