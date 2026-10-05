import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users,
  Store,
  Package,
  FolderTree,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Shield,
  ScrollText,
  Database,
  Sparkles,
  TrendingUp,
  Calendar,
  Heart,
} from 'lucide-react'
import { dashboardAdminApi, backupAdminApi } from '../../service/api/admin.api'
import type { AdminSummary, BackupStats } from '../../types/admin'
import StatCard from '../../components/admin/StatCard'
import ToTreatBlock from '../../components/admin/ToTreatBlock'
import MiniBarChart from '../../components/admin/MiniBarChart'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function formatEuro(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return `${n.toFixed(2).replace('.', ',')} €`
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [chart, setChart] = useState<{ month: string; gmv: string; fees: string; count: number }[]>([])
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null)

  const fetchAll = async () => {
    try {
      const [s, c, b] = await Promise.all([
        dashboardAdminApi.summary(),
        dashboardAdminApi.revenueChart(12).catch(() => ({ chart: [] })),
        backupAdminApi.stats().catch(() => null),
      ])
      setSummary(s)
      setChart(c.chart)
      setBackupStats(b)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  if (loading || !summary) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500">Chargement du dashboard…</p>
      </div>
    )
  }

  const chartData = chart.map((c) => ({
    label: c.month.slice(5) + '/' + c.month.slice(2, 4),
    value: parseFloat(c.gmv) || 0,
  }))

  return (
    <div className="space-y-4">
      {/* Header welcome */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Vue d’ensemble de la plateforme
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Toutes les métriques clés d’ANKU en temps réel.
        </p>
      </div>

      {/* À traiter */}
      <ToTreatBlock
        total={summary.to_treat.total}
        items={[
          { label: 'KYC', value: summary.to_treat.kyc_pending, to: '/admin/kyc' },
          { label: 'Signalements', value: summary.to_treat.reports_pending, to: '/admin/moderation' },
          { label: 'Remboursements', value: summary.to_treat.refunds_pending, to: '/admin/refunds' },
          { label: 'Avis signalés', value: summary.to_treat.reviews_flagged, to: '/admin/moderation' },
          { label: 'Exports RGPD', value: summary.to_treat.rgpd_exports_pending, to: '/admin/audit' },
          { label: 'Suppr. compte', value: summary.to_treat.deletions_pending, to: '/admin/users' },
        ]}
      />

      {/* Stats plateforme */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} style={{ color: ANKU.greenDark }} />
            Statistiques plateforme
          </h2>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <StatCard
            label="Utilisateurs"
            value={summary.users.total}
            hint={`${summary.users.verified} vérifiés · ${summary.users.pros} pros`}
            icon={<Users size={18} />}
          />
          <StatCard
            label="Boutiques"
            value={summary.shops}
            icon={<Store size={18} />}
          />
          <StatCard
            label="Produits"
            value={summary.products}
            icon={<Package size={18} />}
          />
          <StatCard
            label="Catégories"
            value={summary.categories}
            icon={<FolderTree size={18} />}
          />
          <StatCard
            label="Articles"
            value={summary.articles.total}
            hint={`${summary.articles.published} publiés`}
            icon={<ScrollText size={18} />}
          />
          <StatCard
            label="Codes promo"
            value={summary.promo.active_codes}
            hint="actifs"
            icon={<Sparkles size={18} />}
          />
          <StatCard
            label="Événements"
            value={summary.events.upcoming}
            hint={`${summary.events.this_week} cette semaine`}
            icon={<Calendar size={18} />}
          />
          <StatCard
            label="Badges actifs"
            value={summary.badges_active}
            icon={<Heart size={18} />}
          />
        </div>
      </section>

      {/* Revenus */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} style={{ color: ANKU.greenDark }} />
            Revenus
          </h2>
          <span className="text-xs text-gray-500">
            {summary.revenue.all_time.count} transactions
          </span>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <StatCard
            label="GMV total"
            value={formatEuro(summary.revenue.all_time.gmv)}
            hint="volume brut marchandises"
            highlight
          />
          <StatCard
            label="Frais ANKU"
            value={formatEuro(summary.revenue.all_time.fees)}
            hint="commissions perçues"
            highlight
          />
          <StatCard
            label="GMV ce mois"
            value={formatEuro(summary.revenue.this_month.gmv)}
            hint={`${summary.revenue.this_month.count} transactions`}
          />
          <StatCard
            label="Frais ce mois"
            value={formatEuro(summary.revenue.this_month.fees)}
          />
        </div>
      </section>

      {/* Graphique CA 12 mois */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h2 className="text-base font-bold text-gray-900">
            Chiffre d’affaires — 12 derniers mois
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Volume GMV par mois (survolez une barre pour le détail)
          </p>
        </header>
        <div className="p-4">
          <MiniBarChart
            data={chartData}
            color={ANKU.green}
            valueFormatter={(v) => formatEuro(v)}
          />
        </div>
      </section>

      {/* Derniers KYC + Signalements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KYC pending */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
        >
          <header
            className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
          >
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileCheck size={16} style={{ color: ANKU.greenDark }} />
              Derniers KYC
            </h2>
            <Link
              to="/admin/kyc"
              className="text-xs font-semibold hover:underline"
              style={{ color: ANKU.greenDark }}
            >
              Tout voir →
            </Link>
          </header>
          <div className="p-3 space-y-2">
            {summary.recent.kyc.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucun KYC en attente 🎉
              </p>
            ) : (
              summary.recent.kyc.map((k) => (
                <Link
                  key={k.id}
                  to="/admin/kyc"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: ANKU.green }}
                  >
                    {k.first_name?.[0]?.toUpperCase()}
                    {k.last_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {k.first_name} {k.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{k.username} · {k.type}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                    pending
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Signalements pending */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
        >
          <header
            className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
          >
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: ANKU.greenDark }} />
              Derniers signalements
            </h2>
            <Link
              to="/admin/moderation"
              className="text-xs font-semibold hover:underline"
              style={{ color: ANKU.greenDark }}
            >
              Tout voir →
            </Link>
          </header>
          <div className="p-3 space-y-2">
            {summary.recent.reports.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucun signalement en attente 🎉
              </p>
            ) : (
              summary.recent.reports.map((r) => (
                <Link
                  key={r.id}
                  to="/admin/moderation"
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#fee2e2' }}
                  >
                    <AlertTriangle size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {r.target_type} #{r.target_id}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {r.reason}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      par @{r.reporter_username || 'inconnu'} · {formatDate(r.created_at)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Backup */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Database size={16} style={{ color: ANKU.greenDark }} />
            Sauvegardes
          </h2>
          <Link
            to="/admin/backup"
            className="text-xs font-semibold hover:underline"
            style={{ color: ANKU.greenDark }}
          >
            Gérer →
          </Link>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <StatCard label="Total backups" value={backupStats?.count ?? 0} />
          <StatCard
            label="Espace utilisé"
            value={`${(backupStats?.total_size_mb ?? 0).toFixed(1)} MB`}
          />
          <StatCard
            label="Dernier backup"
            value={
              backupStats?.last_backup
                ? formatDate(backupStats.last_backup.created_at)
                : '—'
            }
            hint={backupStats?.last_backup?.filename}
          />
          <StatCard
            label="Rétention"
            value={`${backupStats?.retention_days ?? 0} j`}
          />
        </div>
      </section>

      {/* Raccourcis */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h2 className="text-base font-bold text-gray-900">Raccourcis</h2>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
          {[
            { to: '/admin/kyc', label: 'Validation KYC', icon: FileCheck },
            { to: '/admin/moderation', label: 'Modération', icon: AlertTriangle },
            { to: '/admin/refunds', label: 'Remboursements', icon: RotateCcw },
            { to: '/admin/users', label: 'Utilisateurs', icon: Users },
            { to: '/admin/audit', label: 'Journal d’audit', icon: ScrollText },
            { to: '/admin/backup', label: 'Sauvegardes', icon: Database },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <Icon size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {s.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
