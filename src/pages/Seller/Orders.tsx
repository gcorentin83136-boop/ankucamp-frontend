import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  ShoppingBag,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Mail,
  Download,
  Eye,
  X,
  MapPin,
  AlertCircle,
  Loader,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react'
import ordersApi from '../../service/api/orders.api'
import type { Order, OrderStatus } from '../../types/order'
import StatCard from '../../components/seller/StatCard'
import {
  MONDIAL_RELAY_URL,
  getMondialRelayTrackingUrl,
} from '../../utils/tracking'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatEuro(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return `${n.toFixed(2).replace('.', ',')} €`
}

function formatDate(iso: string | null) {
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

function buyerName(o: Order): string {
  if (!o.buyer) return `Acheteur #${o.buyer_id}`
  const full = `${o.buyer.first_name} ${o.buyer.last_name}`.trim()
  return full || o.buyer.username
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  pending: { label: 'En attente', color: '#d97706', bg: '#fef3c7', icon: Clock },
  confirmed: {
    label: 'Confirmée',
    color: '#0891b2',
    bg: '#cffafe',
    icon: CheckCircle2,
  },
  shipped: { label: 'Expédiée', color: '#7c3aed', bg: '#ede9fe', icon: Truck },
  delivered: {
    label: 'Livrée',
    color: '#059669',
    bg: '#d1fae5',
    icon: CheckCircle2,
  },
  cancelled: { label: 'Annulée', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
  refunded: {
    label: 'Remboursée',
    color: '#9ca3af',
    bg: '#f3f4f6',
    icon: RotateCcw,
  },
}

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: 'refunded', label: 'Remboursées' },
]

// ============================================================
// MODAL DÉTAIL + ACTIONS
// ============================================================
function OrderDetailModal({
  order,
  onClose,
  onUpdated,
}: {
  order: Order | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [resendingInvoice, setResendingInvoice] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [showShipForm, setShowShipForm] = useState(false)

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number ?? '')
      setShowShipForm(false)
    }
  }, [order])

  if (!order) return null

  const config = STATUS_CONFIG[order.status]
  const StatusIcon = config.icon

  const updateStatus = async (
    status: 'confirmed' | 'shipped' | 'delivered',
    tracking?: string
  ) => {
    setLoading(true)
    try {
      await ordersApi.updateStatus(order.id, {
        status,
        tracking_number: tracking ?? order.tracking_number ?? null,
      })
      toast.success(
        status === 'confirmed'
          ? 'Commande confirmée ✅'
          : status === 'shipped'
          ? 'Commande expédiée ✅'
          : 'Commande livrée ✅'
      )
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvoice = async () => {
    setResendingInvoice(true)
    try {
      const res = await ordersApi.resendInvoice(order.id)
      toast.success(res.message || 'Facture renvoyée par email ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setResendingInvoice(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">
                Commande #{order.id}
              </h3>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: config.bg, color: config.color }}
              >
                <StatusIcon size={10} />
                {config.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Reçue le {formatDate(order.created_at)}
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
          {/* Acheteur */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <UserIcon size={14} style={{ color: ANKU.greenDark }} />
              Acheteur
            </h4>
            <div className="flex items-center gap-3">
              {order.buyer?.avatar_url ? (
                <img
                  src={order.buyer.avatar_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <UserIcon size={20} />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {buyerName(order)}
                </p>
                {order.buyer?.username && (
                  <p className="text-xs text-gray-500">
                    @{order.buyer.username}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Infos commande */}
          <section className="rounded-xl border border-gray-200 p-4 space-y-2">
            <h4 className="text-sm font-bold text-gray-900">Détails</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-semibold">
                  Total
                </p>
                <p className="text-lg font-extrabold text-gray-900">
                  {formatEuro(order.total_price)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-semibold">
                  Livraison
                </p>
                <p className="font-bold text-gray-900 capitalize">
                  {order.delivery_method === 'pickup'
                    ? 'Retrait sur place'
                    : order.delivery_method === 'shipping' ||
                      order.delivery_method === 'delivery'
                    ? 'Livraison'
                    : order.delivery_method}
                </p>
              </div>
            </div>

            {order.delivery_address && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] uppercase text-gray-500 font-semibold flex items-center gap-1">
                  <MapPin size={10} /> Adresse de livraison
                </p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {order.delivery_address}
                </p>
              </div>
            )}

            {order.tracking_number && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] uppercase text-gray-500 font-semibold">
                  N° de suivi
                </p>
                <a
                  href={getMondialRelayTrackingUrl(order.tracking_number)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-mono text-emerald-700 hover:underline mt-0.5 inline-block"
                >
                  {order.tracking_number} ↗
                </a>
              </div>
            )}
          </section>

          {/* Articles */}
          {order.items && order.items.length > 0 && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                Articles ({order.items.length})
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: ANKU.greenPale,
                          color: ANKU.greenDark,
                        }}
                      >
                        <Package size={18} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.product?.name ?? `Produit #${item.product_id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatEuro(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">
                      {formatEuro(
                        parseFloat(item.unit_price) * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Facture */}
          {order.status === 'delivered' && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FileText size={14} style={{ color: ANKU.greenDark }} />
                Facture
              </h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await ordersApi.downloadInvoice(order.id)
                      toast.success('Facture téléchargée ✅')
                    } catch (err: any) {
                      toast.error(
                        err?.response?.data?.message ||
                          'Erreur de téléchargement'
                      )
                    }
                  }}
                  className="rounded-full px-4 py-2 text-sm font-bold text-white transition flex items-center gap-2"
                  style={{ background: ANKU.green }}
                >
                  <Download size={14} />
                  Télécharger
                </button>
                <button
                  type="button"
                  onClick={handleResendInvoice}
                  disabled={resendingInvoice}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {resendingInvoice ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Mail size={14} />
                  )}
                  Renvoyer à l’acheteur
                </button>
              </div>
            </section>
          )}

          {/* Actions */}
          {order.status === 'pending' && (
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-2">
                Nouvelle commande
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                Confirme la commande pour signaler que tu l’as reçue et que tu
                vas la préparer.
              </p>
              <button
                type="button"
                onClick={() => updateStatus('confirmed')}
                disabled={loading}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                <CheckCircle2 size={14} />
                {loading ? '...' : 'Confirmer la commande'}
              </button>
            </section>
          )}

          {order.status === 'confirmed' && (
            <section className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-3">
              <h4 className="text-sm font-bold text-purple-900">
                Expédier la commande
              </h4>

              {!showShipForm ? (
                <>
                  <p className="text-xs text-purple-700">
                    Préviens l’acheteur que sa commande est en route. Tu peux
                    créer l’étiquette directement chez Mondial Relay.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowShipForm(true)}
                    className="rounded-full px-5 py-2 text-sm font-bold text-white transition flex items-center gap-2"
                    style={{ background: ANKU.green }}
                  >
                    <Truck size={14} />
                    Marquer comme expédiée
                  </button>
                </>
              ) : (
                <>
                  {/* Étape 1 — Étiquette */}
                  <div className="rounded-xl bg-white border border-purple-200 p-3">
                    <p className="text-xs font-bold text-purple-900 mb-2">
                      1. Crée l’étiquette chez Mondial Relay
                    </p>
                    <p className="text-[11px] text-purple-700 mb-2">
                      Ouvre Mondial Relay dans un nouvel onglet, crée
                      l’expédition pour&nbsp;:
                    </p>
                    <div className="rounded-lg bg-purple-50 border border-purple-100 p-2 mb-2 text-[11px] text-gray-700">
                      <p className="font-semibold">{buyerName(order)}</p>
                      {order.delivery_address && (
                        <p className="text-gray-500">{order.delivery_address}</p>
                      )}
                    </div>
                    <a
                      href={MONDIAL_RELAY_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-white transition"
                      style={{ background: ANKU.green }}
                    >
                      Ouvrir Mondial Relay ↗
                    </a>
                  </div>

                  {/* Étape 2 — Numéro de suivi */}
                  <div className="rounded-xl bg-white border border-purple-200 p-3 space-y-2">
                    <p className="text-xs font-bold text-purple-900">
                      2. Colle le numéro de suivi{' '}
                      <span className="text-red-600">*</span>
                    </p>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Ex : 8R12345678901"
                      className={inputCls}
                    />
                    {trackingNumber.trim() ? (
                      <p className="text-[11px] text-gray-500">
                        Lien envoyé à l’acheteur :{' '}
                        <a
                          href={getMondialRelayTrackingUrl(trackingNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline break-all"
                        >
                          {getMondialRelayTrackingUrl(trackingNumber)}
                        </a>
                      </p>
                    ) : (
                      <p className="text-[11px] text-red-600 font-semibold">
                        ⚠️ Le numéro de suivi est obligatoire pour expédier.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowShipForm(false)}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!trackingNumber.trim()) {
                          toast.error(
                            'Renseigne un numéro de suivi pour expédier la commande'
                          )
                          return
                        }
                        updateStatus('shipped', trackingNumber.trim())
                      }}
                      disabled={loading || !trackingNumber.trim()}
                      className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: ANKU.green }}
                    >
                      {loading ? '...' : 'Confirmer l’expédition'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {order.status === 'shipped' && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="text-sm font-bold text-emerald-900 mb-2">
                Commande en route
              </h4>
              <p className="text-xs text-emerald-700 mb-3">
                Marque la commande comme livrée une fois arrivée chez
                l’acheteur.
              </p>
              <button
                type="button"
                onClick={() => updateStatus('delivered')}
                disabled={loading}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                <CheckCircle2 size={14} />
                {loading ? '...' : 'Marquer comme livrée'}
              </button>
            </section>
          )}

          {(order.status === 'delivered' ||
            order.status === 'cancelled' ||
            order.status === 'refunded') && (
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <AlertCircle size={14} />
                Aucune action disponible pour cette commande.
              </p>
            </section>
          )}
        </div>
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
export default function SellerOrders() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await ordersApi.listSeller()
      setOrders(res.orders)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const filtered = orders.filter((o) =>
    filter === 'all' ? true : o.status === filter
  )

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter(
      (o) => o.status === 'cancelled' || o.status === 'refunded'
    ).length,
    total: orders.length,
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
          <ShoppingBag size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Commandes reçues
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Gère les commandes de tes clients — {orders.length} au total
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="À confirmer"
          value={stats.pending}
          icon={<Clock size={18} />}
          danger={stats.pending > 0}
          onClick={() => setFilter('pending')}
        />
        <StatCard
          label="À expédier"
          value={stats.confirmed}
          icon={<Package size={18} />}
          onClick={() => setFilter('confirmed')}
        />
        <StatCard
          label="En route"
          value={stats.shipped}
          icon={<Truck size={18} />}
          onClick={() => setFilter('shipped')}
        />
        <StatCard
          label="Livrées"
          value={stats.delivered}
          icon={<CheckCircle2 size={18} />}
          onClick={() => setFilter('delivered')}
        />
        <StatCard
          label="Annulées"
          value={stats.cancelled}
          icon={<XCircle size={18} />}
          onClick={() => setFilter('cancelled')}
        />
        <StatCard
          label="Total"
          value={stats.total}
          icon={<ShoppingBag size={18} />}
          onClick={() => setFilter('all')}
        />
      </div>

      {/* Filtres */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <Filter size={14} />
          <span className="font-semibold">Filtrer :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filter === f.value
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                background: filter === f.value ? ANKU.green : '#f3f4f6',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {orders.length === 0
              ? 'Aucune commande reçue pour l’instant'
              : 'Aucune commande dans ce filtre'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {filtered.map((order) => {
            const config = STATUS_CONFIG[order.status]
            const StatusIcon = config.icon
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelected(order)}
                className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                {/* Avatar acheteur */}
                {order.buyer?.avatar_url ? (
                  <img
                    src={order.buyer.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: ANKU.greenPale,
                      color: ANKU.greenDark,
                    }}
                  >
                    <UserIcon size={20} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {buyerName(order)}
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                      style={{ background: config.bg, color: config.color }}
                    >
                      <StatusIcon size={9} />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Commande #{order.id} · {formatDate(order.created_at)}
                  </p>
                  {order.items && order.items.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {order.items[0].product?.name ?? 'Produit'}
                      {order.items.length > 1 &&
                        ` + ${order.items.length - 1} autre${
                          order.items.length > 2 ? 's' : ''
                        }`}
                    </p>
                  )}
                  {order.tracking_number && (
                    <p className="text-[11px] text-emerald-700 mt-0.5 truncate">
                      Suivi : {order.tracking_number}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-gray-900">
                    {formatEuro(order.total_price)}
                  </p>
                  <Eye size={14} className="text-gray-400 ml-auto mt-1" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onUpdated={fetchAll}
      />
    </div>
  )
}
