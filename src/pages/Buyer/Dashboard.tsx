import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Star,
  Calendar,
  FileText,
  RotateCcw,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader,
  ArrowRight,
  Package,
  Store,
} from 'lucide-react'
import ordersApi from '../../service/api/orders.api'
import wishlistApi from '../../service/api/wishlist.api'
import reviewsApi from '../../service/api/reviews.api'
import eventsApi from '../../service/api/events.api'
import refundsApi from '../../service/api/refunds.api'
import { useAuthStore } from '../../context/AuthContext'
import type { Order, OrderStatus } from '../../types/order'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function formatEuro(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return n.toFixed(2).replace('.', ',') + ' €'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  pending: { label: 'En attente', color: '#d97706', bg: '#fef3c7', icon: Clock },
  confirmed: { label: 'Confirmée', color: '#0891b2', bg: '#cffafe', icon: CheckCircle2 },
  shipped: { label: 'Expédiée', color: '#7c3aed', bg: '#ede9fe', icon: Truck },
  delivered: { label: 'Livrée', color: '#059669', bg: '#d1fae5', icon: CheckCircle2 },
  cancelled: { label: 'Annulée', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
  refunded: { label: 'Remboursée', color: '#9ca3af', bg: '#f3f4f6', icon: RotateCcw },
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({
  label,
  value,
  icon: Icon,
  to,
  hint,
  highlight,
}: {
  label: string
  value: string | number
  icon: any
  to: string
  hint?: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl p-4 bg-white border transition-all hover:-translate-y-0.5 hover:shadow-md block"
      style={{
        borderColor: highlight ? ANKU.green + '55' : '#e5e7eb',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {value}
          </p>
          {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: highlight ? '#dcfce7' : ANKU.greenPale,
            color: ANKU.greenDark,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
    </Link>
  )
}

// ============================================================
// PAGE
// ============================================================
export default function BuyerDashboard() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [eventsCount, setEventsCount] = useState(0)
  const [refundsCount, setRefundsCount] = useState(0)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [ordersRes, wishlistRes, reviewsRes, eventsRes, refundsRes] =
          await Promise.allSettled([
            ordersApi.listMine(),
            wishlistApi.list(),
            reviewsApi.listMine(),
            eventsApi.listMine(),
            refundsApi.listMine(),
          ])

        if (ordersRes.status === 'fulfilled') {
          setOrders(ordersRes.value.orders)
        }
        if (wishlistRes.status === 'fulfilled') {
          const anyRes = wishlistRes.value as any
          setWishlistCount(
            Array.isArray(anyRes?.items)
              ? anyRes.items.length
              : Array.isArray(anyRes?.wishlist)
              ? anyRes.wishlist.length
              : 0
          )
        }
        if (reviewsRes.status === 'fulfilled') {
          setReviewsCount(reviewsRes.value.reviews.length)
        }
        if (eventsRes.status === 'fulfilled') {
          setEventsCount(eventsRes.value.events.length)
        }
        if (refundsRes.status === 'fulfilled') {
          const anyRes = refundsRes.value as any
          setRefundsCount(
            Array.isArray(anyRes?.refunds) ? anyRes.refunds.length : 0
          )
        }
      } catch (err: any) {
        toast.error('Erreur de chargement partielle')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(
    () => ({
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      activeOrders: orders.filter((o) =>
        ['confirmed', 'shipped'].includes(o.status)
      ).length,
      totalSpent: orders
        .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
        .reduce((s, o) => s + parseFloat(o.total_price || '0'), 0),
    }),
    [orders]
  )

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* Header bienvenue */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)',
          border: '1px solid rgba(106,168,79,0.13)',
        }}
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Bonjour {user.first_name} 👋
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Bienvenue dans ton espace — retrouve toutes tes activités ANKU
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Commandes"
            value={stats.totalOrders}
            icon={ShoppingBag}
            to="/dashboard/user/orders"
            hint={formatEuro(stats.totalSpent)}
          />
          <StatCard
            label="À suivre"
            value={stats.activeOrders}
            icon={Truck}
            to="/dashboard/user/orders"
            highlight={stats.activeOrders > 0}
          />
          <StatCard
            label="Wishlist"
            value={wishlistCount}
            icon={Heart}
            to="/dashboard/user/wishlist"
          />
          <StatCard
            label="Mes avis"
            value={reviewsCount}
            icon={Star}
            to="/dashboard/user/reviews"
          />
          <StatCard
            label="Événements"
            value={eventsCount}
            icon={Calendar}
            to="/dashboard/user/events"
          />
          <StatCard
            label="Retours"
            value={refundsCount}
            icon={RotateCcw}
            to="/dashboard/user/refunds"
          />
        </div>
      )}

      {/* Dernières commandes */}
      {!loading && recentOrders.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={14} style={{ color: ANKU.greenDark }} />
              Dernières commandes
            </h3>
            <Link
              to="/dashboard/user/orders"
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: ANKU.greenDark }}
            >
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => {
              const config = STATUS_CONFIG[order.status]
              const StatusIcon = config.icon
              return (
                <Link
                  key={order.id}
                  to="/dashboard/user/orders"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                >
                  {order.shop?.logo_url ? (
                    <img
                      src={order.shop.logo_url}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: config.bg, color: config.color }}
                    >
                      <StatusIcon size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {order.shop?.name ?? 'Commande #' + order.id}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatDate(order.created_at)}
                      {order.items && order.items.length > 0 && (
                        <>
                          {' · '}
                          {order.items[0].product?.name ?? 'Produit'}
                          {order.items.length > 1 &&
                            ' +' + (order.items.length - 1)}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatEuro(order.total_price)}
                    </p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {config.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Accès rapides
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Heart, label: 'Wishlist', to: '/dashboard/user/wishlist' },
            { icon: Star, label: 'Mes avis', to: '/dashboard/user/reviews' },
            { icon: Calendar, label: 'Événements', to: '/dashboard/user/events' },
            { icon: FileText, label: 'Articles', to: '/dashboard/user/articles' },
            { icon: RotateCcw, label: 'Retours', to: '/dashboard/user/refunds' },
            { icon: MapPin, label: 'Boutiques', to: '/dashboard/user/follows' },
            { icon: Package, label: 'Panier', to: '/cart' },
            { icon: Store, label: 'Explorer', to: '/' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-white transition"
                style={{ background: ANKU.greenPale }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = ANKU.green
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = ANKU.greenPale
                  e.currentTarget.style.color = ''
                }}
              >
                <Icon size={16} style={{ color: 'currentColor' }} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
