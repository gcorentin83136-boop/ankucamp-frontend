import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
} from 'lucide-react'
import { kycAdminApi } from '../../service/api/admin.api'
import type { KycRequest, KycStats } from '../../types/admin'
import KycDetailModal from '../../components/admin/KycDetailModal'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvés',
  rejected: 'Refusés',
  all: 'Tous',
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Tous les types',
  agriculteur: '🌾 Agriculteur',
  artisan: '🔨 Artisan',
  createur: '🎨 Créateur',
  autre: '📦 Autre',
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

export default function AdminKyc() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<KycRequest[]>([])
  const [stats, setStats] = useState<KycStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [typeFilter, setTypeFilter] = useState<'all' | 'agriculteur' | 'artisan' | 'createur' | 'autre'>('all')
  const [selected, setSelected] = useState<KycRequest | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        kycAdminApi.list({ status: statusFilter, type: typeFilter, limit: 100 }),
        kycAdminApi.stats(),
      ])
      setRequests(listRes.requests)
      setStats(statsRes.stats)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter])

  const handleUpdated = () => {
    // Recharge tout après approbation/refus
    fetchAll()
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
          <FileCheck size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Validation KYC</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Valide ou refuse les demandes de vérification professionnelle.
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
                Refusés
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
              <User size={14} className="text-gray-500" />
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

      {/* Filtres */}
      <div
        className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3"
      >
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
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 cursor-pointer focus:outline-none focus:border-emerald-400"
        >
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste */}
      <div
        className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
      >
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            Chargement…
          </p>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <FileCheck
              size={40}
              className="mx-auto text-gray-300 mb-3"
            />
            <p className="text-sm text-gray-500">
              Aucune demande {STATUS_LABELS[statusFilter].toLowerCase()} pour le
              moment 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
                className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt={r.first_name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: ANKU.green }}
                  >
                    {r.first_name?.[0]?.toUpperCase()}
                    {r.last_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {r.first_name} {r.last_name}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      @{r.username}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {TYPE_LABELS[r.type] || r.type} · SIRET {r.siret}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : r.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
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

      {/* Modal détail */}
      <KycDetailModal
        request={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
