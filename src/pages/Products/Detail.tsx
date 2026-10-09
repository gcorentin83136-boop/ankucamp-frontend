import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Package,
  Store,
  MapPin,
  Star,
  Loader,
  Plus,
  Minus,
  ShoppingCart,
  MessageCircle,
  Truck,
  Handshake,
  ChevronLeft,
  CheckCircle2,
  X,
  Send,
  PlayCircle,
  User as UserIcon,
} from 'lucide-react'
import productsApi from '../../service/api/products.api'
import reviewsApi from '../../service/api/reviews.api'
import { startDirectConversation } from '../../service/api/messages.api'
import type { Product } from '../../types/product'
import type { Review, ProductRatingStats } from '../../types/review'
import { useAuthStore } from '../../context/AuthContext'
import { useCartStore } from '../../context/CartContext'
import AnimatedShopsBackground from '../../components/shops/AnimatedShopsBackground'
import QuickMenu from '../../components/shops/QuickMenu'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function formatEuro(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '0,00 €'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return n.toFixed(2).replace('.', ',') + ' €'
}

type DeliveryMode = 'pickup' | 'shipping' | 'meeting'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = useAuthStore()
  const cart = useCartStore()

  const productId = Number(id)

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup')
  const [adding, setAdding] = useState(false)

  const [stats, setStats] = useState<ProductRatingStats | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [loadingAllReviews, setLoadingAllReviews] = useState(false)

  const [contactOpen, setContactOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState(
    'Bonjour, je suis intéressé(e) par votre produit.'
  )
  const [sendingMessage, setSendingMessage] = useState(false)

  // ==========================================================
  // Charger produit
  // ==========================================================
  useEffect(() => {
    if (!productId || isNaN(productId)) {
      toast.error('Produit introuvable')
      navigate('/shops')
      return
    }

    ;(async () => {
      setLoading(true)
      try {
        const res = await productsApi.getById(productId)
        setProduct(res.product)

        const p = res.product
        if (p.delivery_pickup) setDeliveryMode('pickup')
        else if (p.delivery_shipping) setDeliveryMode('shipping')
        else if (p.delivery_meeting) setDeliveryMode('meeting')
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Produit introuvable')
        navigate('/shops')
      } finally {
        setLoading(false)
      }
    })()
  }, [productId, navigate])

  // ==========================================================
  // Charger avis + stats
  // ==========================================================
  useEffect(() => {
    if (!productId || isNaN(productId)) return

    ;(async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          reviewsApi.productStats(productId).catch(() => null),
          reviewsApi
            .listByProduct(productId, { limit: 3, sort: 'recent' })
            .catch(() => null),
        ])
        if (statsRes) setStats(statsRes.stats)
        if (listRes) setReviews(listRes.reviews)
      } catch {
        // ignore
      }
    })()
  }, [productId])

  // ==========================================================
  // Modale "Voir tous les avis"
  // ==========================================================
  const openAllReviews = async () => {
    setReviewsOpen(true)
    if (allReviews.length > 0) return

    setLoadingAllReviews(true)
    try {
      const res = await reviewsApi.listByProduct(productId, {
        limit: 50,
        sort: 'recent',
      })
      setAllReviews(res.reviews)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Erreur de chargement des avis'
      )
    } finally {
      setLoadingAllReviews(false)
    }
  }

  // ==========================================================
  // Prix total
  // ==========================================================
  const unitPrice = useMemo(() => {
    if (!product) return 0
    const n = parseFloat(product.price)
    return isNaN(n) ? 0 : n
  }, [product])

  const totalPrice = unitPrice * quantity

  // ==========================================================
  // Quantité max
  // ==========================================================
  const maxQuantity = useMemo(() => {
    if (!product) return 99
    if (product.has_unlimited_stock === 1) return 99
    return Math.max(1, product.stock ?? 1)
  }, [product])

  const canAddToCart = product
    ? product.has_unlimited_stock === 1 || (product.stock ?? 0) > 0
    : false

  // ==========================================================
  // Ajouter au panier
  // ==========================================================
  const handleAddToCart = async () => {
    if (!product) return
    if (!auth.isAuthenticated) {
      toast.error('Connecte-toi pour ajouter au panier')
      return
    }
    if (!canAddToCart) {
      toast.error('Produit en rupture de stock')
      return
    }

    setAdding(true)
    try {
      const ok = await cart.add(product.id, quantity)
      if (ok) {
        toast.success(
          `${quantity} × ${product.name} ajouté${quantity > 1 ? 's' : ''} ✅`
        )
      } else {
        toast.error("Erreur lors de l'ajout")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setAdding(false)
    }
  }

  // ==========================================================
  // Contacter le vendeur
  // ==========================================================
  const handleContact = async () => {
    if (!auth.isAuthenticated) {
      toast.error('Connecte-toi pour contacter le vendeur')
      return
    }
    const ownerId = product?.shop?.owner?.id
    if (!ownerId) {
      toast.error('Vendeur introuvable')
      return
    }
    if (!contactMessage.trim()) {
      toast.error('Écris un petit message avant d’envoyer')
      return
    }

    setSendingMessage(true)
    try {
      const convId = await startDirectConversation(ownerId, contactMessage)
      toast.success('Message envoyé ✅')
      setContactOpen(false)
      navigate(`/messages/${convId}`)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Erreur lors de l'envoi du message"
      )
    } finally {
      setSendingMessage(false)
    }
  }

  // ==========================================================
  // Rendu : chargement
  // ==========================================================
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />
        <div className="relative max-w-6xl mx-auto py-20 text-center px-4">
          <Loader size={28} className="animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Chargement produit…</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />
        <div className="relative max-w-3xl mx-auto py-20 text-center px-4">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-900">Produit introuvable</p>
          <Link
            to="/shops"
            className="inline-block mt-4 rounded-full px-5 py-2 text-sm font-bold text-white"
            style={{ background: ANKU.green }}
          >
            Retour aux boutiques
          </Link>
        </div>
      </div>
    )
  }

  const shop = product.shop
  const images = [product.image_url].filter(Boolean) as string[]
  const videos = product.video_urls ?? []

  const deliveryOptions: {
    value: DeliveryMode
    label: string
    desc: string
    icon: any
  }[] = []
  if (product.delivery_pickup) {
    deliveryOptions.push({
      value: 'pickup',
      label: 'Retrait sur place',
      desc: shop?.city ? `Chez ${shop.name} à ${shop.city}` : `Chez ${shop?.name ?? 'le vendeur'}`,
      icon: Store,
    })
  }
  if (product.delivery_shipping) {
    deliveryOptions.push({
      value: 'shipping',
      label: 'Livraison',
      desc: 'Envoi postal à ton adresse',
      icon: Truck,
    })
  }
  if (product.delivery_meeting) {
    deliveryOptions.push({
      value: 'meeting',
      label: 'Point de RDV',
      desc: product.meeting_point_address || 'Lieu convenu avec le vendeur',
      icon: Handshake,
    })
  }

  return (
    <>
      <QuickMenu />
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />

        <div className="relative max-w-6xl mx-auto py-6 px-3 sm:px-5">
          {/* Fil d'ariane */}
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 font-bold text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={14} /> Retour
            </button>
            {shop && (
              <>
                <span className="text-gray-300">/</span>
                <Link
                  to={`/shops/${shop.id}`}
                  className="inline-flex items-center gap-1 font-bold hover:underline"
                  style={{ color: ANKU.greenDark }}
                >
                  <Store size={12} /> {shop.name}
                </Link>
              </>
            )}
          </div>

          {/* ====================================================
              Bloc principal : image + infos
             ==================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* -------------- Images / vidéos -------------- */}
            <div className="space-y-3">
              <div className="rounded-3xl overflow-hidden border border-white/60 bg-white/85 backdrop-blur-xl shadow-sm aspect-square relative">
                {images[0] ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={60} />
                  </div>
                )}
              </div>

              {videos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {videos.slice(0, 3).map((v, i) => (
                    <a
                      key={i}
                      href={v}
                      target="_blank"
                      rel="noreferrer"
                      className="relative rounded-2xl overflow-hidden aspect-square bg-black/80 flex items-center justify-center group"
                    >
                      <PlayCircle
                        size={28}
                        className="text-white/90 group-hover:scale-110 transition"
                      />
                      <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white/80">
                        Vidéo {i + 1}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* -------------- Infos produit -------------- */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-sm p-5">
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                  {product.name}
                </h1>

                {/* Rating + localisation */}
                <div className="mt-2 flex items-center gap-3 text-xs">
                  {stats && stats.count > 0 && (
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star size={12} fill="#f59e0b" />
                      {stats.average.toFixed(1)}
                      <span className="text-gray-400 font-normal">
                        ({stats.count} avis)
                      </span>
                    </span>
                  )}
                  {product.location && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin size={11} /> {product.location}
                    </span>
                  )}
                </div>

                {/* Prix */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span
                    className="text-3xl font-extrabold"
                    style={{ color: ANKU.greenDark }}
                  >
                    {formatEuro(product.price)}
                  </span>
                  <span className="text-xs text-gray-500">TTC</span>
                </div>

                {/* Stock */}
                <div className="mt-2 text-xs">
                  {product.has_unlimited_stock === 1 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 size={12} /> Stock illimité
                    </span>
                  ) : (product.stock ?? 0) > 0 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 size={12} /> En stock ({product.stock})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-red-600">
                      <X size={12} /> Rupture de stock
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                )}
              </div>

              {/* -------------- Quantité + livraison -------------- */}
              <div className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-sm p-5 space-y-4">
                {/* Quantité */}
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Quantité
                  </p>
                  <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-full"
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      min={1}
                      max={maxQuantity}
                      onChange={(e) => {
                        const v = Math.max(
                          1,
                          Math.min(maxQuantity, Number(e.target.value) || 1)
                        )
                        setQuantity(v)
                      }}
                      className="w-12 text-center text-sm font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(maxQuantity, q + 1))
                      }
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-full"
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Modes livraison */}
                {deliveryOptions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Mode de livraison
                    </p>
                    <div className="space-y-2">
                      {deliveryOptions.map((opt) => {
                        const Icon = opt.icon
                        const active = deliveryMode === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDeliveryMode(opt.value)}
                            className={
                              'w-full flex items-start gap-3 rounded-2xl border p-3 text-left transition ' +
                              (active
                                ? 'border-emerald-400 bg-emerald-50/60'
                                : 'border-gray-200 bg-white hover:bg-gray-50')
                            }
                          >
                            <div
                              className={
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' +
                                (active
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-500')
                              }
                            >
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900">
                                {opt.label}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {opt.desc}
                              </p>
                              {active &&
                                opt.value === 'meeting' &&
                                product.meeting_point_instructions && (
                                  <p className="text-[11px] text-gray-500 mt-1 italic">
                                    {product.meeting_point_instructions}
                                  </p>
                                )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Récap prix + bouton ajouter */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-600">
                      Total ({quantity} article{quantity > 1 ? 's' : ''})
                    </span>
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: ANKU.greenDark }}
                    >
                      {formatEuro(totalPrice)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={adding || !canAddToCart}
                      className="flex-1 rounded-full py-3 text-sm font-bold text-white transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: ANKU.green }}
                    >
                      {adding ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                      Ajouter au panier
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                      title="Contacter le vendeur"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* -------------- Bloc boutique -------------- */}
              {shop && (
                <Link
                  to={`/shops/${shop.id}`}
                  className="block rounded-3xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-sm p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3">
                    {shop.logo_url ? (
                      <img
                        src={shop.logo_url}
                        alt={shop.name}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white"
                        style={{ background: ANKU.greenDark }}
                      >
                        {shop.name?.[0]?.toUpperCase() ?? 'S'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Vendu par
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {shop.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        {shop.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {shop.city}
                          </span>
                        )}
                        {shop.owner?.rating && shop.owner.rating.count > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Star size={10} fill="#f59e0b" />
                            {Number(shop.owner.rating.average).toFixed(1)}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronLeft
                      size={14}
                      className="text-gray-300 rotate-180 shrink-0"
                    />
                  </div>
                </Link>
              )}

              {/* -------------- Bloc avis -------------- */}
              <div className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">
                    Avis clients
                  </p>
                  {stats && stats.count > 0 && (
                    <button
                      type="button"
                      onClick={openAllReviews}
                      className="text-xs font-bold hover:underline"
                      style={{ color: ANKU.greenDark }}
                    >
                      Voir tous les avis ({stats.count})
                    </button>
                  )}
                </div>

                {!stats || stats.count === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    Aucun avis pour le moment.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-3xl font-extrabold text-gray-900 leading-none">
                          {stats.average.toFixed(1)}
                        </p>
                        <div className="flex items-center justify-center mt-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={
                                i <= Math.round(stats.average)
                                  ? '#f59e0b'
                                  : 'none'
                              }
                              className={
                                i <= Math.round(stats.average)
                                  ? 'text-amber-500'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {stats.count} avis
                        </p>
                      </div>
                      <div className="flex-1 space-y-0.5">
                        {[5, 4, 3, 2, 1].map((n) => {
                          const c =
                            stats.distribution[n as 1 | 2 | 3 | 4 | 5] ?? 0
                          const pct =
                            stats.count > 0 ? (c / stats.count) * 100 : 0
                          return (
                            <div
                              key={n}
                              className="flex items-center gap-2 text-[10px] text-gray-500"
                            >
                              <span className="w-3 text-right">{n}</span>
                              <Star
                                size={10}
                                fill="#f59e0b"
                                className="text-amber-500"
                              />
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full bg-amber-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-5 text-right">{c}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      {reviews.map((r) => (
                        <div key={r.id} className="flex gap-2">
                          {r.author?.avatar_url ? (
                            <img
                              src={r.author.avatar_url}
                              alt={r.author.username}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <UserIcon size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {r.author
                                  ? `${r.author.first_name} ${r.author.last_name}`
                                  : 'Utilisateur'}
                              </p>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    size={9}
                                    fill={i <= r.rating ? '#f59e0b' : 'none'}
                                    className={
                                      i <= r.rating
                                        ? 'text-amber-500'
                                        : 'text-gray-300'
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            {r.comment && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                {r.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            Modale : tous les avis
           ==================================================== */}
        {reviewsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">
            <div className="w-full max-w-2xl max-h-[80vh] rounded-3xl bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Star size={16} fill="#f59e0b" className="text-amber-500" />
                  <p className="text-sm font-bold text-gray-900">
                    Tous les avis {stats ? `(${stats.count})` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewsOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingAllReviews ? (
                  <div className="py-10 text-center">
                    <Loader
                      size={20}
                      className="animate-spin text-gray-400 mx-auto"
                    />
                  </div>
                ) : allReviews.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">
                    Aucun avis pour le moment.
                  </p>
                ) : (
                  allReviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 flex gap-3"
                    >
                      {r.author?.avatar_url ? (
                        <img
                          src={r.author.avatar_url}
                          alt={r.author.username}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <UserIcon size={14} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-gray-900">
                            {r.author
                              ? `${r.author.first_name} ${r.author.last_name}`
                              : 'Utilisateur'}
                          </p>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={10}
                                fill={i <= r.rating ? '#f59e0b' : 'none'}
                                className={
                                  i <= r.rating
                                    ? 'text-amber-500'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(r.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">
                            {r.comment}
                          </p>
                        )}
                        {r.reply_text && (
                          <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 p-2">
                            <p className="text-[10px] font-bold text-emerald-700">
                              Réponse du vendeur
                            </p>
                            <p className="text-xs text-gray-700 mt-0.5">
                              {r.reply_text}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            Modale : contacter le vendeur
           ==================================================== */}
        {contactOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} style={{ color: ANKU.greenDark }} />
                  <p className="text-sm font-bold text-gray-900">
                    Contacter le vendeur
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                Ton message sera envoyé directement au vendeur.
              </p>

              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                maxLength={5000}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
                placeholder="Écris ton message…"
              />

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="flex-1 rounded-full py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleContact}
                  disabled={sendingMessage}
                  className="flex-1 rounded-full py-2.5 text-xs font-bold text-white transition inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ background: ANKU.green }}
                >
                  {sendingMessage ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}