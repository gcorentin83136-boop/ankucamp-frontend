import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Heart,
  Loader,
  Trash2,
  Package,
  Eye,
} from 'lucide-react'
import wishlistApi from '../../service/api/wishlist.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function formatEuro(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return n.toFixed(2).replace('.', ',') + ' €'
}

interface WishlistItem {
  id: number
  product_id: number
  product?: {
    id: number
    name: string
    image_url: string | null
    price: string
    stock: number | null
    has_unlimited_stock: number
  } | null
}

export default function BuyerWishlist() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<WishlistItem[]>([])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res: any = await wishlistApi.list()
      // Le backend peut renvoyer "items" ou "wishlist" selon la version
      const list = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.wishlist)
        ? res.wishlist
        : []
      setItems(list)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleRemove = async (productId: number) => {
    if (!confirm('Retirer ce produit de ta wishlist ?')) return
    try {
      await wishlistApi.toggle(productId)
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      toast.success('Retiré de la wishlist')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

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
          <Heart size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Ma wishlist</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {items.length} produit{items.length > 1 ? 's' : ''} sauvegardé
          {items.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Heart size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            Ta wishlist est vide
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Ajoute des produits depuis leurs fiches
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-bold text-white"
            style={{ background: ANKU.green }}
          >
            Explorer les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const p = item.product
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
              >
                <Link to={`/products/${item.product_id}`}>
                  {p?.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-40 flex items-center justify-center"
                      style={{ background: ANKU.greenPale }}
                    >
                      <Package
                        size={40}
                        style={{ color: ANKU.greenDark, opacity: 0.4 }}
                      />
                    </div>
                  )}
                </Link>
                <div className="p-3 space-y-2">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="block text-sm font-bold text-gray-900 hover:underline line-clamp-2"
                  >
                    {p?.name ?? 'Produit #' + item.product_id}
                  </Link>
                  <p
                    className="text-lg font-extrabold"
                    style={{ color: ANKU.greenDark }}
                  >
                    {formatEuro(p?.price)}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="flex-1 rounded-full px-3 py-1.5 text-xs font-bold text-white text-center flex items-center justify-center gap-1"
                      style={{ background: ANKU.green }}
                    >
                      <Eye size={12} /> Voir
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.product_id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                      title="Retirer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
