import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ScrollText,
  Filter,
  Activity,
  Users as UsersIcon,
  Calendar,
} from 'lucide-react'
import { auditAdminApi } from '../../service/api/admin.api'
import type { AuditLog, AuditStats } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const ACTION_COLORS: Record<string, string> = {
  kyc_approve: 'bg-emerald-100 text-emerald-700',
  kyc_reject: 'bg-red-100 text-red-700',
  report_resolve: 'bg-emerald-100 text-emerald-700',
  report_dismiss: 'bg-gray-100 text-gray-700',
  refund_approve: 'bg-emerald-100 text-emerald-700',
  refund_reject: 'bg-red-100 text-red-700',
  promo_create: 'bg-blue-100 text-blue-700',
  promo_update: 'bg-blue-100 text-blue-700',
  promo_delete: 'bg-red-100 text-red-700',
  category_create: 'bg-blue-100 text-blue-700',
  category_update: 'bg-blue-100 text-blue-700',
  category_delete: 'bg-red-100 text-red-700',
  badge_grant: 'bg-purple-100 text-purple-700',
  badge_revoke: 'bg-orange-100 text-orange-700',
  backup_run: 'bg-amber-100 text-amber-700',
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

export default function AdminAudit() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        auditAdminApi.list({
          limit: 100,
          action: actionFilter || undefined,
        }),
        auditAdminApi.stats(),
      ])
      setLogs(listRes.logs)
      setStats(statsRes)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter])

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
          <ScrollText size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Journal d’audit</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Historique de toutes les actions administratives.
        </p>
      </div>

      {/* Stats globales */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Total actions
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.total}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <UsersIcon size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Admins actifs
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.by_admin.length}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: ANKU.greenDark }} />
              <p className="text-xs font-semibold uppercase text-gray-600">
                Types d’actions
              </p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.by_action.length}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <Filter size={14} />
          <span className="font-semibold">Filtrer par action :</span>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 bg-gray-50 cursor-pointer focus:outline-none focus:border-emerald-400 min-w-[200px]"
        >
          <option value="">Toutes les actions</option>
          {stats?.by_action.map((a) => (
            <option key={a.action} value={a.action}>
              {a.action} ({a.count})
            </option>
          ))}
        </select>
        {actionFilter && (
          <button
            type="button"
            onClick={() => setActionFilter('')}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <ScrollText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucune action enregistrée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <Activity size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    {log.admin_username && (
                      <span className="text-[10px] text-gray-500">
                        par @{log.admin_username}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-1">
                    {log.description}
                  </p>
                  {log.target_type && log.target_id && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {log.target_type} #{log.target_id}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-gray-400">
                    {formatDate(log.created_at)}
                  </p>
                  {log.ip_address && (
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {log.ip_address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
