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
} from 'lucide-react'
import shopsApi from '../../service/api/shops.api'
import productsApi from '../../service/api/products.api'
import followsApi from '../../service/api/follows.api'
import { startDirectConversation } from '../../service/api/messages.api'
import type { Shop } from '../../types/shop'
import type { Product } from '../../types/product'
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
  // Charger les produits (avec debounce sur recherche)
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
  // Filtrage local par recherche
  // ==========================================================
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

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
  // Contacter le vendeur
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
  // Ajout rapide au panier depuis une carte produit
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
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                    {shop.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600">
                    {shop.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {shop.city}
                        {shop.postal_code ? ` (${shop.postal_code})` : ''}
                      </span>
                    )}
                    {shop.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {shop.phone}
                      </span>
                    )}
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
                      background: following ? 'rgba(255,255,255,0.25)' : ANKU.greenPale,
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {owner.first_name} {owner.last_name}
                    </p>
                    {owner.verification_status === 'verified' && (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-500 shrink-0"
                      />
                    )}
                  </div>
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
              </div>
            )}

            {/* Badges */}
            {owner?.badges && owner.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {owner.badges.map((b) => (
                  <span
                    key={b}
                    className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            Barre recherche + tri produits
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
                {/* Image */}
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

                  {/* Badge stock */}
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

                  {/* Bouton + panier */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, p)}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/95 text-gray-700 shadow-md hover:bg-emerald-500 hover:text-white transition"
                    title="Ajouter au panier"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>

                {/* Infos */}
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
