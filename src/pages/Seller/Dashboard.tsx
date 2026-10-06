import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  Ticket,
  Calendar,
  FileText,
  Store,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { dashboardSellerApi } from '../../service/api/dashboard.api'
import type { SellerSummary, SellerRevenueChartPoint } from '../../service/api/dashboard.api'
import StatCard from '../../components/seller/StatCard'
import MiniBarChart from '../../components/seller/MiniBarChart'

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

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SellerSummary | null>(null)
  const [chart, setChart] = useState<SellerRevenueChartPoint[]>([])

  const fetchAll = async () => {
    try {
      const [s, c] = await Promise.all([
        dashboardSellerApi.summary(),
        dashboardSellerApi
          .revenueChart(12)
          .catch(() => ({ chart: [] as SellerRevenueChartPoint[] })),
      ])
      setSummary(s)
      setChart(c.chart)
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
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    )
  }

  const chartData = chart.map((c) => ({
    label: c.month.slice(5) + '/' + c.month.slice(2, 4),
    value: parseFloat(c.total) || 0,
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
          <Store size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Tableau de bord vendeur
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Suis ton activité, gère tes commandes et développe ta boutique.
        </p>
      </div>

      {/* À traiter */}
      {summary.to_treat.total > 0 && (
        <section
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #fde68a', background: '#fffbeb' }}
        >
          <header
            className="px-5 py-3 border-b"
            style={{ borderColor: '#fde68a', background: '#fef3c7' }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-700" />
              <h3 className="text-base font-bold text-amber-900">
                ⚡ À traiter
              </h3>
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              {summary.to_treat.total} action
              {summary.to_treat.total > 1 ? 's' : ''} en attente
            </p>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
            {[
              {
                label: 'Commandes en attente',
                value: summary.to_treat.orders_pending,
                to: '/dashboard/shop/orders',
              },
              {
                label: 'Commandes à expédier',
                value: summary.to_treat.orders_shipped,
                to: '/dashboard/shop/orders',
              },
              {
                label: 'Remboursements',
                value: summary.to_treat.refunds_pending,
                to: '/dashboard/shop/orders',
              },
            ].map((item) => {
              const hasWork = item.value > 0
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex items-center justify-between gap-2 p-3 rounded-xl transition-all hover:shadow-sm"
                  style={{
                    background: hasWork ? '#ffffff' : '#f9fafb',
                    border: hasWork ? '1px solid #fecaca' : '1px solid #e5e7eb',
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">
                      {item.label}
                    </p>
                    <p
                      className="text-xl font-extrabold"
                      style={{ color: hasWork ? '#dc2626' : '#9ca3af' }}
                    >
                      {item.value}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="CA total"
          value={formatEuro(summary.revenue.all_time)}
          icon={<TrendingUp size={18} />}
          highlight
        />
        <StatCard
          label="CA ce mois"
          value={formatEuro(summary.revenue.this_month)}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Note moyenne"
          value={summary.rating.average.toFixed(1)}
          hint={`${summary.rating.count} avis`}
          icon={<Star size={18} />}
        />
        <StatCard
          label="Produits"
          value={summary.products}
          icon={<Package size={18} />}
        />
      </div>

      {/* Graphique CA */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h3 className="text-base font-bold text-gray-900">
            Chiffre d'affaires — 12 derniers mois
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Survole une barre pour voir le détail
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

      {/* Autres stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Boutiques"
          value={summary.shops}
          icon={<Store size={18} />}
        />
        <StatCard
          label="Codes promo actifs"
          value={summary.promo.active_codes}
          hint={`${summary.promo.total_uses} utilisations`}
          icon={<Ticket size={18} />}
        />
        <StatCard
          label="Événements à venir"
          value={summary.events.upcoming}
          icon={<Calendar size={18} />}
        />
        <StatCard
          label="Articles publiés"
          value={summary.articles.published}
          icon={<FileText size={18} />}
        />
      </div>

      {/* Raccourcis */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h3 className="text-base font-bold text-gray-900">Raccourcis</h3>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
          {[
            { to: '/dashboard/shop/products', label: 'Mes produits', icon: Package },
            { to: '/dashboard/shop/orders', label: 'Commandes', icon: ShoppingBag },
            { to: '/dashboard/shop/promo', label: 'Codes promo', icon: Ticket },
            { to: '/dashboard/shop/settings', label: 'Ma boutique', icon: Store },
            { to: '/dashboard/shop/events', label: 'Événements', icon: Calendar },
            { to: '/dashboard/shop/reviews', label: 'Avis reçus', icon: Star },
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
