import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Store,
  MapPin,
  Phone,
  Star,
  Package,
  Users,
  Loader,
  Search,
  X,
  MessageCircle,
  ShoppingCart,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Send,
  UserCircle2,
  Plus,
  PenLine,
} from 'lucide-react'
import shopsApi from '../../service/api/shops.api'
import productsApi from '../../service/api/products.api'
import followsApi from '../../service/api/follows.api'
import reviewsApi from '../../service/api/reviews.api'
import ordersApi from '../../service/api/orders.api'
import { startDirectConversation } from '../../service/api/messages.api'
import type { Shop } from '../../types/shop'
import type { Product } from '../../types/product'
import type { Review } from '../../types/review'
import type { Order, OrderItem } from '../../types/order'
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

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = useAuthStore()
  const cart = useCartStore()

  const shopId = Number(id)

  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  const [contactOpen, setContactOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState(
    'Bonjour, je suis intéressé(e) par votre boutique.'
  )
  const [sendingMessage, setSendingMessage] = useState(false)

  // ---------- Avis ----------
  const [reviewsPreview, setReviewsPreview] = useState<Review[]>([])
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [loadingAllReviews, setLoadingAllReviews] = useState(false)
  const [reviewSort, setReviewSort] = useState<
    'recent' | 'rating_desc' | 'rating_asc'
  >('recent')

  // ---------- Déposer un avis ----------
  const [writeOpen, setWriteOpen] = useState(false)
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [writeRating, setWriteRating] = useState(0)
  const [writeComment, setWriteComment] = useState('')
  const [publishing, setPublishing] = useState(false)

  // ==========================================================
  // Charger la boutique
  // ==========================================================
  useEffect(() => {
    if (!shopId || isNaN(shopId)) {
      toast.error('Boutique introuvable')
      navigate('/shops')
      return
    }

    ;(async () => {
      setLoading(true)
      try {
        const res = await shopsApi.getById(shopId)
        setShop(res.shop)
        setFollowersCount(res.shop.followers_count ?? 0)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Boutique introuvable')
        navigate('/shops')
      } finally {
        setLoading(false)
      }
    })()
  }, [shopId, navigate])

  // ==========================================================
  // Statut follow
  // ==========================================================
  useEffect(() => {
    if (!shopId || !auth.isAuthenticated) return
    ;(async () => {
      try {
        const res = await followsApi.status(shopId)
        setFollowing(res.following)
      } catch {
        // ignore
      }
    })()
  }, [shopId, auth.isAuthenticated])

  // ==========================================================
  // Charger les produits
  // ==========================================================
  useEffect(() => {
    if (!shopId || isNaN(shopId)) return

    const timer = setTimeout(async () => {
      setLoadingProducts(true)
      try {
        const res = await productsApi.listByShop(shopId)
        setProducts(res.products)
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || 'Erreur de chargement des produits'
        )
      } finally {
        setLoadingProducts(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [shopId])

  // ==========================================================
  // Charger un aperçu des avis de la boutique (3 derniers)
  // ==========================================================
  useEffect(() => {
    if (!shopId || isNaN(shopId)) return
    ;(async () => {
      try {
        const res = await reviewsApi.listByShop(shopId, {
          limit: 3,
          sort: 'recent',
        })
        setReviewsPreview(res.reviews)
      } catch {
        // ignore
      }
    })()
  }, [shopId])

  // ==========================================================
  // Filtrage local
  // ==========================================================
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  // ==========================================================
  // Stats avis (moyenne + count) depuis les previews
  // ==========================================================
  const reviewStats = useMemo(() => {
    const list = allReviews.length > 0 ? allReviews : reviewsPreview
    if (list.length === 0) return { average: 0, count: 0 }
    const total = list.reduce((sum, r) => sum + r.rating, 0)
    return {
      average: total / list.length,
      count: list.length,
    }
  }, [allReviews, reviewsPreview])

  // ==========================================================
  // Toggle follow
  // ==========================================================
  const handleToggleFollow = async () => {
    if (!auth.isAuthenticated) {
      toast.error('Connecte-toi pour suivre cette boutique')
      return
    }
    try {
      const res = await followsApi.toggle(shopId)
      setFollowing(res.following)
      setFollowersCount((c) => (res.following ? c + 1 : Math.max(0, c - 1)))
      toast.success(res.following ? 'Boutique suivie ✅' : 'Ne suit plus')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  // ==========================================================
  // Contacter
  // ==========================================================
  const handleContact = async () => {
    if (!auth.isAuthenticated) {
      toast.error('Connecte-toi pour contacter le vendeur')
      return
    }
    if (!shop?.owner?.id) {
      toast.error('Vendeur introuvable')
      return
    }
    if (!contactMessage.trim()) {
      toast.error('Écris un petit message avant d’envoyer')
      return
    }

    setSendingMessage(true)
    try {
      const convId = await startDirectConversation(
        shop.owner.id,
        contactMessage
      )
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
  // Ajout rapide panier
  // ==========================================================
  const handleQuickAdd = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()

    if (!auth.isAuthenticated) {
      toast.error('Connecte-toi pour ajouter au panier')
      return
    }
    const ok = await cart.add(product.id, 1)
    if (ok) toast.success(`${product.name} ajouté ✅`)
    else toast.error("Erreur lors de l'ajout")
  }

  // ==========================================================
  // Ouvrir modale "Tous les avis"
  // ==========================================================
  const openAllReviews = async () => {
    setReviewsOpen(true)
    setLoadingAllReviews(true)
    try {
      const res = await reviewsApi.listByShop(shopId, {
        limit: 50,
        sort: reviewSort,
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

  // Recharge les avis quand on change le tri dans la modale
  useEffect(() => {
    if (!reviewsOpen) return
    ;(async () => {
      setLoadingAllReviews(true)
      try {
        const res = await reviewsApi.listByShop(shopId, {
          limit: 50,
          sort: reviewSort,
        })
        setAllReviews(res.reviews)
      } catch {
        // ignore
      } finally {
        setLoadingAllReviews(false)
      }
    })()
  }, [reviewSort, reviewsOpen, shopId])

  // ==========================================================
  // Ouvrir modale "Déposer un avis"
  // ==========================================================
  const openWriteModal = async () => {
    if (!auth.isAuthenticated) {
      toast.error('Connecte-toi pour laisser un avis')
      return
    }
    setWriteOpen(true)
    setSelectedOrderId(null)
    setSelectedProductId(null)
    setWriteRating(0)
    setWriteComment('')

    setLoadingOrders(true)
    try {
      const [ordersRes, myReviewsRes] = await Promise.all([
        ordersApi.listMine(),
        reviewsApi.listMine().catch(() => null),
      ])

      const delivered = (ordersRes.orders || []).filter(
        (o) => o.status === 'delivered' && o.shop?.id === shopId
      )
      setMyOrders(delivered)
      setMyReviews(myReviewsRes?.reviews ?? [])
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Erreur de chargement des commandes'
      )
    } finally {
      setLoadingOrders(false)
    }
  }

  const selectedOrder = useMemo(
    () => myOrders.find((o) => o.id === selectedOrderId) ?? null,
    [myOrders, selectedOrderId]
  )

  // Items non encore notés
  const reviewableItems = useMemo(() => {
    if (!selectedOrder?.items) return []
    return selectedOrder.items.filter(
      (it) =>
        !myReviews.some(
          (r) =>
            r.order_id === selectedOrder.id && r.product_id === it.product_id
        )
    )
  }, [selectedOrder, myReviews])

  // ==========================================================
  // Publier l'avis
  // ==========================================================
  const handlePublishReview = async () => {
    if (!selectedOrder || !selectedProductId) {
      toast.error('Choisis une commande et un produit')
      return
    }
    if (writeRating < 1) {
      toast.error('Mets au moins 1 étoile')
      return
    }

    setPublishing(true)
    try {
      await reviewsApi.create({
        order_id: selectedOrder.id,
        product_id: selectedProductId,
        rating: writeRating,
        comment: writeComment.trim() || null,
      })
      toast.success('Avis publié ✅')
      setWriteOpen(false)

      // Recharge les avis de la boutique
      const res = await reviewsApi.listByShop(shopId, {
        limit: 3,
        sort: 'recent',
      })
      setReviewsPreview(res.reviews)
      if (reviewsOpen) {
        const all = await reviewsApi.listByShop(shopId, {
          limit: 50,
          sort: reviewSort,
        })
        setAllReviews(all.reviews)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'envoi")
    } finally {
      setPublishing(false)
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
          <p className="text-sm text-gray-500 mt-3">Chargement boutique…</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />
        <div className="relative max-w-3xl mx-auto py-20 text-center px-4">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-900">Boutique introuvable</p>
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

  const owner = shop.owner
  const productsCount = shop.products_count ?? 0
  const isVerified = owner?.verification_status === 'verified'
  const isVacation = shop.vacation_mode === 1

  return (
    <>
      <QuickMenu />
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />

        <div className="relative max-w-6xl mx-auto py-6 px-3 sm:px-5">
          {/* Bouton retour */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={14} /> Retour
          </button>

          {/* ====================================================
              Bannière + logo
             ==================================================== */}
          <div className="rounded-3xl overflow-hidden border border-white/50 shadow-sm">
            {/* Bannière */}
            <div
              className="h-40 sm:h-52 relative"
              style={{
                background: shop.banner_url
                  ? undefined
                  : `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
              }}
            >
              {shop.banner_url && (
                <img
                  src={shop.banner_url}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Logo + infos */}
            <div className="relative bg-white/85 backdrop-blur-xl px-5 sm:px-7 pb-5 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
                <div className="flex items-end gap-4">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-3xl font-extrabold text-white border-4 border-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, #8bc34a 0%, ${ANKU.greenDark} 100%)`,
                      }}
                    >
                      {shop.name?.[0]?.toUpperCase() ?? 'S'}
                    </div>
                  )}

                  <div className="pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                        {shop.name}
                      </h1>
                      {isVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Vérifié
                        </span>
                      )}
                      {isVacation && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          🌴 En vacances
                        </span>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-600">
                      {shop.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {shop.city}
                          {shop.postal_code ? ` (${shop.postal_code})` : ''}
                        </span>
                      )}
                      {shop.phone && (
                        <a
                          href={`tel:${shop.phone}`}
                          className="flex items-center gap-1 hover:text-emerald-600 transition"
                        >
                          <Phone size={12} /> {shop.phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-gray-500">
                        <Package size={12} /> {productsCount} produit
                        {productsCount > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users size={12} /> {followersCount} abonné
                        {followersCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    className="rounded-full px-4 py-2 text-xs font-bold transition inline-flex items-center gap-1.5 border-2"
                    style={{
                      background: following ? ANKU.green : '#ffffff',
                      color: following ? '#ffffff' : ANKU.greenDark,
                      borderColor: ANKU.green,
                    }}
                  >
                    <Users size={14} />
                    {following ? 'Suivi·e' : 'Suivre'}
                    <span
                      className="ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: following
                          ? 'rgba(255,255,255,0.25)'
                          : ANKU.greenPale,
                        color: following ? '#ffffff' : ANKU.greenDark,
                      }}
                    >
                      {followersCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="rounded-full px-4 py-2 text-xs font-bold text-white transition inline-flex items-center gap-1.5"
                    style={{ background: ANKU.green }}
                  >
                    <MessageCircle size={14} />
                    Contacter
                  </button>
                </div>
              </div>

              {/* Description */}
              {shop.description && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {shop.description}
                </p>
              )}

              {/* Infos vendeur */}
              {owner && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
                  {owner.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt={owner.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                      style={{ background: ANKU.greenDark }}
                    >
                      {(owner.first_name?.[0] ?? '') +
                        (owner.last_name?.[0] ?? '')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {owner.first_name} {owner.last_name}
                    </p>
                    <p className="text-xs text-gray-500">@{owner.username}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star size={12} fill="#f59e0b" />
                      {Number(owner.rating?.average ?? 0).toFixed(1)}
                      <span className="text-gray-400 font-normal">
                        ({owner.rating?.count ?? 0})
                      </span>
                    </span>
                  </div>
                  {owner.username && (
                    <Link
                      to={`/u/${owner.username}`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition border"
                      style={{
                        background: '#ffffff',
                        color: ANKU.greenDark,
                        borderColor: `${ANKU.green}55`,
                      }}
                    >
                      <UserCircle2 size={12} /> Voir le profil
                    </Link>
                  )}
                </div>
              )}

              {/* Badges métier */}
              {owner?.badges && owner.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {owner.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{
                        background: ANKU.greenPale,
                        color: ANKU.greenDark,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ====================================================
              Bloc avis (résumé + boutons)
             ==================================================== */}
          <div className="mt-6 rounded-3xl border border-white/50 bg-white/85 backdrop-blur-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Star size={18} fill="#f59e0b" className="text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Avis clients
                  </p>
                  <p className="text-xs text-gray-500">
                    {reviewStats.count > 0
                      ? `${reviewStats.average.toFixed(1)} / 5 · ${reviewStats.count} avis`
                      : 'Aucun avis pour le moment'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {reviewStats.count > 0 && (
                  <button
                    type="button"
                    onClick={openAllReviews}
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold border transition"
                    style={{
                      color: ANKU.greenDark,
                      borderColor: `${ANKU.green}55`,
                      background: '#ffffff',
                    }}
                  >
                    Voir tous les avis
                  </button>
                )}
                <button
                  type="button"
                  onClick={openWriteModal}
                  className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition inline-flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  <Plus size={11} /> Déposer un avis
                </button>
              </div>
            </div>

            {/* Aperçu : 3 derniers */}
            {reviewsPreview.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                {reviewsPreview.map((r) => (
                  <div key={r.id} className="flex gap-2">
                    {r.author_avatar_url ? (
                      <img
                        src={r.author_avatar_url}
                        alt={r.author_username ?? ''}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <Users size={14} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {r.author_first_name && r.author_last_name
                            ? `${r.author_first_name} ${r.author_last_name}`
                            : r.author_username ?? 'Utilisateur'}
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
                        <span className="text-[10px] text-gray-400">
                          {formatDate(r.created_at)}
                        </span>
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
            )}
          </div>

          {/* ====================================================
              Barre recherche produits
             ==================================================== */}
          <div className="mt-6 rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-3 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit dans cette boutique…"
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
              {filteredProducts.length} produit
              {filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* ====================================================
              Grille produits
             ==================================================== */}
          {loadingProducts ? (
            <div className="mt-6 rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-10 text-center shadow-sm">
              <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-10 text-center shadow-sm">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-800">
                Aucun produit trouvé
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {search
                  ? 'Essaie une autre recherche'
                  : 'Cette boutique n’a pas encore publié de produit'}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="group rounded-2xl overflow-hidden border border-white/60 bg-white/90 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={32} />
                      </div>
                    )}

                    {p.stock !== null && p.has_unlimited_stock === 0 && (
                      <span
                        className={
                          'absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full ' +
                          (p.stock > 0
                            ? 'bg-white/90 text-gray-700'
                            : 'bg-red-100 text-red-700')
                        }
                      >
                        {p.stock > 0 ? `Stock ${p.stock}` : 'Rupture'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, p)}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/95 text-gray-700 shadow-md hover:bg-emerald-500 hover:text-white transition"
                      title="Ajouter au panier"
                    >
                      <ShoppingCart size={14} />
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                      {p.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={10} /> {p.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-2 flex items-end justify-between">
                      <span
                        className="text-base font-extrabold"
                        style={{ color: ANKU.greenDark }}
                      >
                        {formatEuro(p.price)}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-gray-300 group-hover:text-emerald-500 transition"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ====================================================
            Modale : Tous les avis
           ==================================================== */}
        {reviewsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">
            <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Star size={18} fill="#f59e0b" className="text-amber-500" />
                  <p className="text-sm font-bold text-gray-900">
                    Tous les avis {reviewStats.count > 0 ? `(${reviewStats.count})` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tri */}
              <div className="px-4 pt-3 flex items-center gap-2">
                {(
                  [
                    { v: 'recent', label: 'Récents' },
                    { v: 'rating_desc', label: 'Mieux notés' },
                    { v: 'rating_asc', label: 'Moins bien notés' },
                  ] as const
                ).map((opt) => {
                  const active = reviewSort === opt.v
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setReviewSort(opt.v)}
                      className={
                        'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' +
                        (active
                          ? 'text-white'
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                      }
                      style={active ? { background: ANKU.green } : undefined}
                    >
                      {opt.label}
                    </button>
                  )
                })}
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
                      {r.author_avatar_url ? (
                        <img
                          src={r.author_avatar_url}
                          alt={r.author_username ?? ''}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Users size={14} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">
                            {r.author_first_name && r.author_last_name
                              ? `${r.author_first_name} ${r.author_last_name}`
                              : r.author_username ?? 'Utilisateur'}
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
                            {formatDate(r.created_at)}
                          </span>
                        </div>
                        {r.product_name && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            <Package size={9} className="inline" />{' '}
                            {r.product_name}
                          </p>
                        )}
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
            Modale : Déposer un avis
           ==================================================== */}
        {writeOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">
            <div className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <PenLine size={16} style={{ color: ANKU.greenDark }} />
                  <p className="text-sm font-bold text-gray-900">
                    Déposer un avis
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWriteOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingOrders ? (
                  <div className="py-10 text-center">
                    <Loader
                      size={20}
                      className="animate-spin text-gray-400 mx-auto"
                    />
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="py-10 text-center">
                    <Package size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-800">
                      Aucune commande livrée
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tu pourras laisser un avis après réception d’une commande
                      dans cette boutique.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Étape 1 : choisir la commande */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                        1. Choisis ta commande
                      </label>
                      <div className="space-y-2">
                        {myOrders.map((o) => {
                          const active = selectedOrderId === o.id
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => {
                                setSelectedOrderId(o.id)
                                setSelectedProductId(null)
                              }}
                              className={
                                'w-full flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ' +
                                (active
                                  ? 'border-emerald-400 bg-emerald-50/60'
                                  : 'border-gray-200 bg-white hover:bg-gray-50')
                              }
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900">
                                  Commande #{o.id}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(o.created_at)} ·{' '}
                                  {formatEuro(o.total_price)}
                                </p>
                              </div>
                              {active && (
                                <CheckCircle2
                                  size={18}
                                  className="text-emerald-500 shrink-0"
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Étape 2 : choisir le produit */}
                    {selectedOrder && (
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                          2. Choisis un produit à noter
                        </label>
                        {reviewableItems.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            Tous les produits de cette commande ont déjà été
                            notés.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {reviewableItems.map((it: OrderItem) => {
                              const active = selectedProductId === it.product_id
                              return (
                                <button
                                  key={it.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedProductId(it.product_id)
                                  }
                                  className={
                                    'flex items-center gap-2 rounded-xl border p-2 text-left transition ' +
                                    (active
                                      ? 'border-emerald-400 bg-emerald-50/60'
                                      : 'border-gray-200 bg-white hover:bg-gray-50')
                                  }
                                >
                                  {it.product?.image_url ? (
                                    <img
                                      src={it.product.image_url}
                                      alt={it.product.name}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                      <Package
                                        size={14}
                                        className="text-gray-400"
                                      />
                                    </div>
                                  )}
                                  <p className="text-[11px] font-semibold text-gray-900 line-clamp-2">
                                    {it.product?.name ?? `Produit #${it.product_id}`}
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Étape 3 : note + commentaire */}
                    {selectedProductId && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                            3. Ta note
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setWriteRating(n)}
                                className="p-1 transition hover:scale-110"
                                title={`${n} étoile${n > 1 ? 's' : ''}`}
                              >
                                <Star
                                  size={28}
                                  fill={n <= writeRating ? '#f59e0b' : 'none'}
                                  className={
                                    n <= writeRating
                                      ? 'text-amber-500'
                                      : 'text-gray-300'
                                  }
                                />
                              </button>
                            ))}
                            {writeRating > 0 && (
                              <span className="ml-2 text-sm font-bold text-gray-700">
                                {writeRating}/5
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                            4. Ton commentaire (optionnel)
                          </label>
                          <textarea
                            value={writeComment}
                            onChange={(e) => setWriteComment(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="Partage ton expérience…"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            {writeComment.length}/2000
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              {myOrders.length > 0 && (
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWriteOpen(false)}
                    className="flex-1 rounded-full py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishReview}
                    disabled={
                      publishing ||
                      !selectedOrder ||
                      !selectedProductId ||
                      writeRating < 1
                    }
                    className="flex-1 rounded-full py-2.5 text-xs font-bold text-white transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: ANKU.green }}
                  >
                    {publishing ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Publier l’avis
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            Modale contact vendeur
           ==================================================== */}
        {contactOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} style={{ color: ANKU.greenDark }} />
                  <p className="text-sm font-bold text-gray-900">
                    Contacter {shop.name}
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
                Ton message sera envoyé en direct au vendeur via la messagerie
                ANKU.
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