import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  ShoppingBag,
  Loader,
  Filter,
  Eye,
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  MapPin,
  Download,
  Star,
  Send,
  Store,
} from 'lucide-react'
import ordersApi from '../../service/api/orders.api'
import reviewsApi from '../../service/api/reviews.api'
import type { Order, OrderStatus } from '../../types/order'

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
  return n.toFixed(2).replace('.', ',') + ' €'
}

function formatDate(iso: string | null): string {
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

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
]

// ============================================================
// MODAL DETAIL
// ============================================================
function OrderDetailModal({
  order,
  onClose,
  onRefresh,
}: {
  order: Order | null
  onClose: () => void
  onRefresh: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  // Avis par produit
  const [reviewTarget, setReviewTarget] = useState<{ productId: number; name: string } | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  if (!order) return null

  const config = STATUS_CONFIG[order.status]
  const StatusIcon = config.icon

  const handleCancel = async () => {
    if (!confirm('Annuler cette commande ?')) return
    setLoading(true)
    try {
      await ordersApi.updateStatus(order.id, { status: 'cancelled' })
      toast.success('Commande annulée')
      onRefresh()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true)
    try {
      await ordersApi.downloadInvoice(order.id)
      toast.success('Facture téléchargée ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewTarget) return
    if (comment.trim().length < 3) {
      toast.error('Ajoute un petit commentaire (min 3 caractères)')
      return
    }
    setSubmittingReview(true)
    try {
      await reviewsApi.create({
        order_id: order.id,
        product_id: reviewTarget.productId,
        rating,
        comment: comment.trim(),
      })
      toast.success('Avis publié ✅')
      setReviewTarget(null)
      setRating(5)
      setComment('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSubmittingReview(false)
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
              <h3 className="text-lg font-bold text-gray-900">Commande #{order.id}</h3>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: config.bg, color: config.color }}
              >
                <StatusIcon size={10} />
                {config.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Passée le {formatDate(order.created_at)}
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
          {/* Vendeur / Boutique */}
          {order.shop && (
            <section className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Store size={14} style={{ color: ANKU.greenDark }} />
                Vendeur
              </h4>
              <div className="flex items-center gap-3">
                {order.shop.logo_url ? (
                  <img
                    src={order.shop.logo_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                  >
                    <Store size={20} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">{order.shop.name}</p>
                  {order.seller && (
                    <p className="text-xs text-gray-500">
                      {order.seller.first_name} {order.seller.last_name}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Infos commande */}
          <section className="rounded-xl border border-gray-200 p-4 space-y-2">
            <h4 className="text-sm font-bold text-gray-900">Détails</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-semibold">Total</p>
                <p className="text-lg font-extrabold text-gray-900">
                  {formatEuro(order.total_price)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-semibold">Livraison</p>
                <p className="font-bold text-gray-900 capitalize">
                  {order.delivery_method === 'pickup'
                    ? 'Retrait sur place'
                    : order.delivery_method === 'shipping' || order.delivery_method === 'delivery'
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
                <p className="text-sm text-gray-700 mt-0.5">{order.delivery_address}</p>
              </div>
            )}

            {order.tracking_number && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] uppercase text-gray-500 font-semibold">N° de suivi</p>
                <p className="text-sm font-mono text-gray-800 mt-0.5">
                  {order.tracking_number}
                </p>
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
                        style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                      >
                        <Package size={18} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.product?.name ?? 'Produit #' + item.product_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatEuro(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <p className="text-sm font-bold text-gray-900">
                        {formatEuro(parseFloat(item.unit_price) * item.quantity)}
                      </p>
                      {order.status === 'delivered' && item.product && (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewTarget({
                              productId: item.product_id,
                              name: item.product?.name ?? 'Produit',
                            })
                          }
                          className="rounded-full px-2 py-1 text-[10px] font-bold text-white flex items-center gap-1"
                          style={{ background: ANKU.green }}
                          title="Laisser un avis"
                        >
                          <Star size={10} /> Avis
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle size={14} /> Annuler la commande
              </button>
            )}

            {order.status === 'delivered' && (
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                {downloadingInvoice ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Télécharger la facture
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Modal Avis (par-dessus)
  const reviewModal = reviewTarget ? (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-base font-bold text-gray-900">Laisser un avis</h3>
            <p className="text-xs text-gray-500 mt-0.5">{reviewTarget.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setReviewTarget(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-700">Note</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
              >
                <Star
                  size={24}
                  fill={n <= rating ? '#f59e0b' : 'none'}
                  className={n <= rating ? 'text-amber-500' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>
          <label className="block text-xs font-semibold text-gray-700 mt-3">
            Commentaire
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Partage ton expérience…"
            className={inputCls + ' resize-none'}
            maxLength={2000}
          />
        </div>
        <footer
          className="px-5 py-4 border-t flex justify-end gap-2"
          style={{ borderColor: '#f3f4f6' }}
        >
          <button
            type="button"
            onClick={() => setReviewTarget(null)}
            disabled={submittingReview}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: ANKU.green }}
          >
            {submittingReview ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Publier l'avis
          </button>
        </footer>
      </div>
    </div>
  ) : null

  return typeof window !== 'undefined' ? (
    <>
      {createPortal(modal, document.body)}
      {reviewModal && createPortal(reviewModal, document.body)}
    </>
  ) : null
}

// ============================================================
// PAGE
// ============================================================
export default function BuyerOrders() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await ordersApi.listMine()
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

  const filtered = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    }),
    [orders]
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)',
          border: '1px solid rgba(106,168,79,0.13)',
        }}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Mes commandes</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {stats.total} commande{stats.total > 1 ? 's' : ''} · {stats.pending} en attente ·{' '}
          {stats.delivered} livrée{stats.delivered > 1 ? 's' : ''}
        </p>
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
              className={
                'text-xs font-semibold px-3 py-1.5 rounded-full transition ' +
                (filter === f.value ? 'text-white' : 'text-gray-600 hover:bg-gray-100')
              }
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
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {orders.length === 0
              ? 'Aucune commande pour l\u2019instant'
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
                {/* Logo boutique */}
                {order.shop?.logo_url ? (
                  <img
                    src={order.shop.logo_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <StatusIcon size={20} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">
                      {order.shop?.name ?? 'Commande #' + order.id}
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
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
                      {order.items.length > 1
                        ? ' + ' +
                          (order.items.length - 1) +
                          ' autre' +
                          (order.items.length > 2 ? 's' : '')
                        : ''}
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

      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onRefresh={fetchAll}
      />
    </div>
  )
}
