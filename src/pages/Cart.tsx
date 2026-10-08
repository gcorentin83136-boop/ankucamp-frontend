import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ShoppingCart,
  Loader,
  Trash2,
  Plus,
  Minus,
  Store,
  Package,
  ArrowRight,
  MapPin,
  Truck,
  Handshake,
  X,
  Tag,
} from 'lucide-react'
import { useCartStore } from '../context/CartContext'
import cartApi from '../service/api/cart.api'
import { useAuthStore } from '../context/AuthContext'
import BuyerProfileCard from '../components/buyer/BuyerProfileCard'
import AnimatedCartBackground from '../components/buyer/AnimatedCartBackground'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatEuro(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '0,00 €'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return n.toFixed(2).replace('.', ',') + ' €'
}

const DELIVERY_OPTIONS = [
  { value: 'pickup' as const, label: 'Retrait sur place', icon: Store, desc: 'Tu récupères chez le vendeur' },
  { value: 'shipping' as const, label: 'Livraison', icon: Truck, desc: 'Envoi postal à ton adresse' },
  { value: 'delivery' as const, label: 'Point de RDV', icon: Handshake, desc: 'Rencontre à un endroit défini' },
]

export default function Cart() {
  const navigate = useNavigate()
  const auth = useAuthStore()
  const cart = useCartStore()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping' | 'delivery'>('shipping')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (auth.isAuthenticated) cart.load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated])

  if (!auth.isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <AnimatedCartBackground />
        <div className="relative max-w-3xl mx-auto py-20 text-center px-4">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-900">Mon panier</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Connecte-toi pour voir ton panier
          </p>
          <Link
            to="/login"
            className="rounded-full px-5 py-2 text-sm font-bold text-white"
            style={{ background: ANKU.green }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const handleUpdateQty = async (productId: number, newQty: number) => {
    if (newQty < 1) return
    await cart.update(productId, newQty)
  }

  const handleRemove = async (productId: number) => {
    if (!confirm('Retirer ce produit du panier ?')) return
    const ok = await cart.remove(productId)
    if (ok) toast.success('Produit retiré')
  }

  const handleClear = async () => {
    if (!confirm('Vider complètement ton panier ?')) return
    await cart.clear()
    toast.success('Panier vidé')
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) return

    if (deliveryMethod !== 'pickup' && !deliveryAddress.trim()) {
      toast.error('Renseigne une adresse de livraison')
      return
    }

    setSubmitting(true)
    try {
      const res = await cartApi.checkout({
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'pickup' ? null : deliveryAddress.trim(),
        promo_code: promoCode.trim() || null,
      })
      toast.success(
        res.orders_count > 1
          ? res.orders_count + ' commandes créées ✅'
          : 'Commande passée ✅'
      )
      cart.reset()
      navigate('/dashboard/user/orders')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du paiement')
    } finally {
      setSubmitting(false)
    }
  }

  const total = cart.subtotal

  return (
    <div className="relative min-h-screen">
      {/* Fond animé */}
      <AnimatedCartBackground />

      <div className="relative max-w-6xl mx-auto py-6 px-3 sm:px-5">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
          {/* Sidebar : profil à gauche */}
          <aside className="lg:w-[280px] xl:w-[300px] shrink-0 order-2 lg:order-1">
            <BuyerProfileCard />
          </aside>

          {/* Main : panier à droite */}
          <main className="flex-1 min-w-0 order-1 lg:order-2 space-y-4">
            {/* Header */}
            <div
              className="rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap bg-white/85 backdrop-blur-xl border border-white/50 shadow-xl shadow-emerald-900/5"
              style={{
                background:
                  'linear-gradient(135deg, rgba(240,249,232,0.9) 0%, rgba(255,255,255,0.75) 100%)',
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} style={{ color: ANKU.greenDark }} />
                  <h1 className="text-lg font-bold text-gray-900">Mon panier</h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {cart.itemsCount} article{cart.itemsCount > 1 ? 's' : ''} ·{' '}
                  {cart.bySeller.length} boutique
                  {cart.bySeller.length > 1 ? 's' : ''}
                </p>
              </div>
              {cart.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition flex items-center gap-2"
                >
                  <Trash2 size={14} /> Vider
                </button>
              )}
            </div>

            {/* Contenu */}
            {cart.isLoading && !cart.isLoaded ? (
              <div className="rounded-2xl bg-white/85 backdrop-blur-xl p-10 text-center border border-white/50 shadow-xl shadow-emerald-900/5">
                <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
              </div>
            ) : cart.items.length === 0 ? (
              <div className="rounded-2xl bg-white/85 backdrop-blur-xl p-10 text-center border border-white/50 shadow-xl shadow-emerald-900/5">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-800">
                  Ton panier est vide
                </p>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  Ajoute des produits depuis les boutiques pour commencer
                </p>
                <Link
                  to="/shops"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white transition"
                  style={{ background: ANKU.green }}
                >
                  Explorer les boutiques <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                {/* Liste par boutique */}
                <div className="space-y-4">
                  {cart.bySeller.map((group) => (
                    <div
                      key={group.shop_id}
                      className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl overflow-hidden shadow-xl shadow-emerald-900/5"
                    >
                      {/* Header boutique */}
                      <div
                        className="px-4 py-3 border-b border-gray-100 flex items-center gap-2"
                        style={{ background: ANKU.greenPale }}
                      >
                        <Store size={16} style={{ color: ANKU.greenDark }} />
                        <p className="text-sm font-bold text-gray-900">
                          {group.shop_name}
                        </p>
                        <span className="text-[11px] font-semibold text-gray-500 ml-auto">
                          {group.items.length} article
                          {group.items.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-gray-100">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 sm:p-4"
                          >
                            {item.product.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt=""
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  background: ANKU.greenPale,
                                  color: ANKU.greenDark,
                                }}
                              >
                                <Package size={22} />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <Link
                                to={'/products/' + item.product_id}
                                className="text-sm font-bold text-gray-900 hover:underline line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatEuro(item.unit_price)} l&apos;unité
                              </p>

                              {/* Quantité */}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center border border-gray-200 rounded-full bg-white/70">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQty(item.product_id, item.quantity - 1)
                                    }
                                    disabled={item.quantity <= 1 || cart.isLoading}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition disabled:opacity-30"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-sm font-bold text-gray-900 w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQty(item.product_id, item.quantity + 1)
                                    }
                                    disabled={cart.isLoading}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(item.product_id)}
                                  disabled={cart.isLoading}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                                  title="Retirer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <p className="text-base font-extrabold text-gray-900 shrink-0">
                              {formatEuro(item.subtotal)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Sous-total boutique */}
                      <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center bg-white/50">
                        <span className="text-xs font-semibold text-gray-600">
                          Sous-total {group.shop_name}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatEuro(group.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Récap + commander */}
                <div className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-5 space-y-4 shadow-xl shadow-emerald-900/5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-700">
                      Total
                    </span>
                    <span
                      className="text-2xl font-extrabold"
                      style={{ color: ANKU.greenDark }}
                    >
                      {formatEuro(total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full rounded-full py-3 text-sm font-bold text-white transition flex items-center justify-center gap-2"
                    style={{ background: ANKU.green }}
                  >
                    Passer commande <ArrowRight size={16} />
                  </button>

                  <p className="text-[11px] text-gray-500 text-center">
                    En validant, tu seras redirigé vers ton espace commandes
                  </p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal checkout */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header
              className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
              style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Finaliser la commande
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cart.itemsCount} article{cart.itemsCount > 1 ? 's' : ''} ·{' '}
                  {formatEuro(total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-5 space-y-4">
              {/* Mode livraison */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Mode de livraison *
                </label>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = deliveryMethod === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDeliveryMethod(opt.value)}
                        className={
                          'w-full rounded-xl p-3 text-left border-2 transition flex items-center gap-3 ' +
                          (active
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50')
                        }
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: active ? ANKU.green : ANKU.greenPale,
                            color: active ? '#fff' : ANKU.greenDark,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900">
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Adresse */}
              {deliveryMethod !== 'pickup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Adresse de livraison *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ex : 12 rue de la République, 69002 Lyon"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Code promo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Tag size={12} /> Code promo (optionnel)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ex : BIENVENUE10"
                  className={inputCls + ' font-mono'}
                />
              </div>
            </div>

            <footer
              className="px-5 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white"
              style={{ borderColor: '#f3f4f6' }}
            >
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                disabled={submitting}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                {submitting ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <ShoppingCart size={14} />
                )}
                Confirmer ({formatEuro(total)})
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
