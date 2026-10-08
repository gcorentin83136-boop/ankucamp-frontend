import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MapPin, Loader, Store, ExternalLink } from 'lucide-react'
import followsApi from '../../service/api/follows.api'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

interface FollowedShop {
  id: number
  shop_id: number
  created_at: string
  shop_name: string | null
  shop_logo_url: string | null
  shop_city: string | null
  shop_owner_id: number | null
}

export default function BuyerFollows() {
  const [loading, setLoading] = useState(true)
  const [shops, setShops] = useState<FollowedShop[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res: any = await followsApi.mine()
        const list = Array.isArray(res?.follows)
          ? res.follows
          : Array.isArray(res?.shops)
          ? res.shops
          : Array.isArray(res)
          ? res
          : []
        setShops(list)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      } finally { setLoading(false) }
    })()
  }, [])

  const handleUnfollow = async (shopId: number) => {
    if (!confirm('Ne plus suivre cette boutique ?')) return
    try {
      await followsApi.toggle(shopId)
      setShops((prev) => prev.filter((s) => s.shop_id !== shopId))
      toast.success('Boutique retirée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)', border: '1px solid rgba(106,168,79,0.13)' }}>
        <div className="flex items-center gap-2">
          <MapPin size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Boutiques suivies</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {shops.length} boutique{shops.length > 1 ? 's' : ''} suivie{shops.length > 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Store size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">Aucune boutique suivie</p>
          <Link to="/shops" className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-bold text-white" style={{ background: ANKU.green }}>
            Explorer les boutiques
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shops.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-3">
                {s.shop_logo_url ? (
                  <img src={s.shop_logo_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: ANKU.greenPale, color: ANKU.greenDark }}>
                    <Store size={22} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.shop_name ?? 'Boutique #' + s.shop_id}</p>
                  {s.shop_city && <p className="text-[11px] text-gray-500">{s.shop_city}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/shops/${s.shop_id}`} className="flex-1 rounded-full px-3 py-1.5 text-xs font-bold text-white text-center flex items-center justify-center gap-1" style={{ background: ANKU.green }}>
                  <ExternalLink size={12} /> Voir
                </Link>
                <button type="button" onClick={() => handleUnfollow(s.shop_id)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                  Ne plus suivre
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
