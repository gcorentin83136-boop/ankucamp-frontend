import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  Store, MapPin, Phone, Star, Package, Users, Loader, 
  MessageCircle, ShoppingCart, CheckCircle2, ArrowRight, UserCircle2 
} from 'lucide-react'
import shopsApi from '../../service/api/shops.api'
import productsApi from '../../service/api/products.api'
import { useAuthStore } from '../../context/AuthContext'
import { useCartStore } from '../../context/CartContext'
import AnimatedShopsBackground from '../../components/shops/AnimatedShopsBackground'
import QuickMenu from '../../components/shops/QuickMenu'
import type { Shop } from '../../types/shop'
import type { Product } from '../../types/product'

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
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Boutique introuvable')
        navigate('/shops')
      } finally {
        setLoading(false)
      }
    })()
  }, [shopId, navigate])

  useEffect(() => {
    if (!shopId || isNaN(shopId)) return
    ;(async () => {
      setLoadingProducts(true)
      try {
        const res = await productsApi.listByShop(shopId)
        setProducts(res.products)
      } catch (err) {
        // Ignore
      } finally {
        setLoadingProducts(false)
      }
    })()
  }, [shopId])

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

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />
        <div className="relative max-w-6xl mx-auto py-20 text-center px-4">
          <Loader size={32} className="animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Chargement boutique…</p>
        </div>
      </div>
    )
  }

  if (!shop) return null

  const owner = shop.owner
  const isVerified = owner?.verification_status === 'verified'

  return (
    <>
      <QuickMenu />
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />

        <div className="relative max-w-6xl mx-auto py-6 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900"
          >
            ← Retour
          </button>

          {/* Bannière + Infos Boutique */}
          <div className="rounded-3xl overflow-hidden border border-white/50 shadow-sm">
            <div
              className="h-40 sm:h-52 relative"
              style={{
                background: shop.banner_url
                  ? undefined
                  : `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
              }}
            >
              {shop.banner_url && (
                <img src={shop.banner_url} alt={shop.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

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
                      style={{ background: `linear-gradient(135deg, #8bc34a 0%, ${ANKU.greenDark} 100%)` }}
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
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-600">
                      {shop.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {shop.city}
                        </span>
                      )}
                      {shop.phone && (
                        <a href={`tel:${shop.phone}`} className="flex items-center gap-1 hover:text-emerald-600 transition">
                          <Phone size={12} /> {shop.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {shop.description && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {shop.description}
                </p>
              )}
            </div>
          </div>

          {/* Produits */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-emerald-600" /> 
              Produits ({products.length})
            </h2>

            {loadingProducts ? (
              <div className="text-center py-10"><Loader size={24} className="animate-spin text-emerald-500 mx-auto" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <Package size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-700">Aucun produit pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="group rounded-2xl overflow-hidden border border-white/60 bg-white/90 backdrop-blur-xl shadow-sm hover:shadow-xl transition-all flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={32} /></div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, p)}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/95 text-gray-700 shadow-md hover:bg-emerald-500 hover:text-white transition"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{p.name}</p>
                      <div className="mt-auto pt-2 flex items-end justify-between">
                        <span className="text-base font-extrabold text-emerald-700">{formatEuro(p.price)}</span>
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}