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
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  dashboardSellerApi,
  type SellerSummary,
  type SellerStatsByPeriod,
  type StatsPeriod,
} from '../../service/api/dashboard.api'
import StatCard from '../../components/seller/StatCard'
import StripeRequiredBanner from '../../components/seller/StripeRequiredBanner'
import { useAuthStore } from '../../context/AuthContext'
import usersApi from '../../service/api/users.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' },
]

function formatEuro(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return `${n.toFixed(2).replace('.', ',')} €`
}

function formatShortEuro(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k€`
  return `${v.toFixed(0)}€`
}

function formatBucketLabel(bucket: string, isDaily: boolean): string {
  if (isDaily) {
    const parts = bucket.split('-')
    return `${parts[2]}/${parts[1]}`
  }
  const [year, month] = bucket.split('-')
  const mois = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ]
  return `${mois[parseInt(month) - 1]} ${year.slice(2)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-xl bg-gray-900 text-white px-3 py-2 shadow-xl text-xs">
      <p className="font-bold mb-1">{label}</p>
      <p style={{ color: ANKU.green }}>💰 {formatEuro(data.value)}</p>
      {data.count !== undefined && (
        <p className="text-white/70 text-[10px] mt-0.5">
          {data.count} paiement{data.count > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export default function SellerDashboard() {
  const auth = useAuthStore()
  const user = (auth as any)?.user
  // Fail-safe : si le champ n'est pas encore chargé dans le store, on
  // n'affiche PAS la bannière (évite un faux positif pendant le bootstrap).
  const needsStripe =
    user?.role === 'professionnel' &&
    typeof user?.stripe_account_status === 'string' &&
    user.stripe_account_status !== 'active'

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SellerSummary | null>(null)
  const [period, setPeriod] = useState<StatsPeriod>('30d')
  const [stats, setStats] = useState<SellerStatsByPeriod | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const fetchSummary = async () => {
    try {
      const s = await dashboardSellerApi.summary()
      setSummary(s)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (p: StatsPeriod) => {
    setStatsLoading(true)
    try {
      const res = await dashboardSellerApi.statsByPeriod(p)
      setStats(res)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setStatsLoading(false)
    }
  }

  // Rafraîchit le user depuis /users/me (contient stripe_account_status).
  // Le login peut renvoyer un user partiel selon le select backend.
  useEffect(() => {
    ;(async () => {
      try {
        const res = await usersApi.getMe()
        if (res.user && auth.mergeUser) {
          auth.mergeUser(res.user)
        }
      } catch {
        /* silencieux : on garde le user en cache */
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchStats(period)
  }, [period])

  if (loading || !summary) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    )
  }

  const isDaily = period === '7d' || period === '30d'

  const chartData = (stats?.chart ?? []).map((c) => ({
    label: formatBucketLabel(c.bucket, isDaily),
    value: parseFloat(c.total) || 0,
    count: c.count,
  }))

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
          <Store size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Tableau de bord vendeur
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Suis ton activité, gère tes commandes et développe ta boutique.
        </p>
      </div>

      {/* P6 — Banniere Stripe si pro non connecte */}
      {needsStripe && <StripeRequiredBanner />}

      {/* Tabs période */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 flex gap-1 flex-wrap">
        {PERIODS.map((p) => {
          const active = period === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={
                'flex-1 min-w-[80px] rounded-xl px-3 py-2 text-xs font-bold transition ' +
                (active
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100')
              }
              style={active ? { background: ANKU.green } : undefined}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* KPIs période */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="CA période"
          value={stats ? formatEuro(stats.kpis.revenue) : '—'}
          icon={<TrendingUp size={18} />}
          highlight
          hint={
            stats
              ? `${stats.kpis.payments_count} paiement${
                  stats.kpis.payments_count > 1 ? 's' : ''
                }`
              : undefined
          }
        />
        <StatCard
          label="Commandes"
          value={stats ? stats.kpis.orders_count : '—'}
          icon={<ShoppingCart size={18} />}
        />
        <StatCard
          label="Panier moyen"
          value={stats ? formatEuro(stats.kpis.average_basket) : '—'}
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Note moyenne"
          value={summary.rating.average.toFixed(1)}
          hint={`${summary.rating.count} avis`}
          icon={<Star size={18} />}
        />
      </div>

      {/* Graphique CA */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b flex items-center justify-between gap-2 flex-wrap"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Chiffre d'affaires —{' '}
              {PERIODS.find((p) => p.value === period)?.label}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Survole la courbe pour voir le détail
            </p>
          </div>
        </header>
        <div className="p-4" style={{ opacity: statsLoading ? 0.5 : 1 }}>
          {chartData.length === 0 ? (
            <div
              className="rounded-xl flex items-center justify-center text-sm text-gray-400"
              style={{
                height: 220,
                background: '#f9fafb',
                border: '1px dashed #e5e7eb',
              }}
            >
              Aucune donnée pour cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={ANKU.green}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={ANKU.green}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatShortEuro(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={ANKU.greenDark}
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  dot={{ r: 3, fill: ANKU.green, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: ANKU.greenDark }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Top produits */}
      {stats && stats.top_products.length > 0 && (
        <section
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
        >
          <header
            className="px-5 py-3 border-b"
            style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
          >
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              🏆 Top 5 produits —{' '}
              {PERIODS.find((p) => p.value === period)?.label}
            </h3>
          </header>
          <div className="divide-y divide-gray-100">
            {stats.top_products.map((p, idx) => (
              <div
                key={p.product_id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background:
                      idx === 0
                        ? '#fef3c7'
                        : idx === 1
                        ? '#f3f4f6'
                        : idx === 2
                        ? '#fed7aa'
                        : ANKU.greenPale,
                    color:
                      idx === 0
                        ? '#a16207'
                        : idx === 1
                        ? '#6b7280'
                        : idx === 2
                        ? '#c2410c'
                        : ANKU.greenDark,
                  }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {p.product_name ?? `Produit #${p.product_id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.total_sold} vente{p.total_sold > 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-sm font-extrabold text-gray-900 shrink-0">
                  {formatEuro(p.total_revenue)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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
                    border: hasWork
                      ? '1px solid #fecaca'
                      : '1px solid #e5e7eb',
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

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="CA total"
          value={formatEuro(summary.revenue.all_time)}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="CA ce mois"
          value={formatEuro(summary.revenue.this_month)}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Produits"
          value={summary.products}
          icon={<Package size={18} />}
        />
        <StatCard
          label="Boutiques"
          value={summary.shops}
          icon={<Store size={18} />}
        />
      </div>

      {/* Autres stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <StatCard
          label="Avis reçus"
          value={summary.rating.count}
          icon={<Star size={18} />}
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
            {
              to: '/dashboard/shop/products',
              label: 'Mes produits',
              icon: Package,
            },
            {
              to: '/dashboard/shop/orders',
              label: 'Commandes',
              icon: ShoppingBag,
            },
            { to: '/dashboard/shop/promo', label: 'Codes promo', icon: Ticket },
            {
              to: '/dashboard/shop/settings',
              label: 'Ma boutique',
              icon: Store,
            },
            {
              to: '/dashboard/shop/events',
              label: 'Événements',
              icon: Calendar,
            },
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