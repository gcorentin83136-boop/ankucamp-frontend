import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search as SearchIcon,
  Users,
  Store,
  Package,
  Loader,
  MapPin,
  Star,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import SearchFiltersPanel, {
  defaultFilters,
  type FilterState,
} from '../components/search/SearchFiltersPanel'
import searchApi, { type SearchFilters } from '../service/api/search.api'
import httpClient from '../service/api/httpClient'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type Tab = 'all' | 'users' | 'shops' | 'products'

interface GeoState {
  lat?: number
  lng?: number
  radius?: number
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''

  const [q, setQ] = useState(initialQ)
  const [tab, setTab] = useState<Tab>('all')
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [geo, setGeo] = useState<GeoState>({})
  const [geoLoading, setGeoLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  const [loading, setLoading] = useState(false)

  const [counts, setCounts] = useState({
    users: 0,
    shops: 0,
    products: 0,
  })

  const [data, setData] = useState<{
    users: any[]
    shops: any[]
    products: any[]
  }>({ users: [], shops: [], products: [] })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Charger les catégories au montage
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await httpClient.get('/categories', {
          params: { limit: 50 },
        })
        setCategories(data.categories ?? [])
      } catch {
        // ignore
      }
    })()
  }, [])

  const buildFilters = (): SearchFilters => {
    const f: SearchFilters = {
      q: q.trim() || undefined,
      limit: tab === 'all' ? 30 : 50,
      sort: filters.sort,
      lat: geo.lat,
      lng: geo.lng,
      radius: geo.radius,
    }
    if (filters.city.trim()) f.city = filters.city.trim()
    if (filters.role) f.role = filters.role as any
    if (filters.category_id) f.category_id = filters.category_id
    if (filters.min_rating) f.min_rating = filters.min_rating
    if (filters.delivery) f.delivery = filters.delivery as any
    if (filters.has_stock) f.has_stock = true
    if (filters.min_price !== undefined) f.min_price = filters.min_price
    if (filters.max_price !== undefined) f.max_price = filters.max_price
    if (filters.in_stock) f.in_stock = true
    return f
  }

  const fetchResults = useCallback(async () => {
    const term = q.trim()
    if (!term && !filters.city.trim() && !geo.lat) {
      setData({ users: [], shops: [], products: [] })
      return
    }
    setLoading(true)
    try {
      const f = buildFilters()
      if (tab === 'all') {
        // Utilise search/all (limité mais rapide)
        const res = await searchApi.all({
          q: term || ' ',
          limit_per_type: 10,
          lat: geo.lat,
          lng: geo.lng,
          radius: geo.radius,
        })
        const usersList = res.users ?? []
        const shopsList = res.shops ?? []
        const productsList = res.products ?? []
        setData({
          users: usersList,
          shops: shopsList,
          products: productsList,
        })
        // 🎯 Utiliser les VRAIS counts du backend (pas la taille du preview)
        if (res.counts) {
          setCounts({
            users: res.counts.users ?? 0,
            shops: res.counts.shops ?? 0,
            products: res.counts.products ?? 0,
          })
        }

      } else if (tab === 'users') {
        const res: any = await searchApi.users({ ...f, q: term })
        const list = Array.isArray(res)
          ? res
          : res.users ?? res.results ?? []
        setData({ users: list, shops: [], products: [] })
      } else if (tab === 'shops') {
        const res: any = await searchApi.shops({ ...f, q: term })
        const list = Array.isArray(res)
          ? res
          : res.shops ?? res.results ?? []
        setData({ users: [], shops: list, products: [] })
      } else {
        const res: any = await searchApi.products({ ...f, q: term })
        const list = Array.isArray(res)
          ? res
          : res.products ?? res.results ?? []
        setData({ users: [], shops: [], products: list })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de recherche')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tab, filters, geo])

  // Debounce auto-fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchResults()
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchResults])

  const handleFilterChange = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setGeo({})
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n’est pas supportée par ton navigateur')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radius: 30,
        })
        setGeoLoading(false)
        toast.success('Position détectée 📍')
      },
      (err) => {
        console.error(err)
        setGeoLoading(false)
        toast.error(
          'Impossible de te localiser. Vérifie les permissions de ton navigateur.'
        )
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  const totalCount =
    data.users.length + data.shops.length + data.products.length

  const TABS: { value: Tab; label: string; count: number }[] = [
    {
      value: 'all',
      label: 'Tout',
      count: counts.users + counts.shops + counts.products,
    },
    { value: 'users', label: 'Membres', count: counts.users },
    { value: 'shops', label: 'Boutiques', count: counts.shops },
    { value: 'products', label: 'Produits', count: counts.products },
  ]

  const hasFilters =
    filters.city ||
    filters.role ||
    filters.category_id ||
    filters.min_rating ||
    filters.delivery ||
    filters.has_stock ||
    filters.min_price !== undefined ||
    filters.max_price !== undefined ||
    filters.in_stock ||
    geo.lat

  return (
    <div className="relative min-h-screen">
      <AppHeader />
      <AnimatedShopsBackground />

      <div className="relative max-w-5xl mx-auto py-6 px-3 sm:px-5 space-y-4">
        {/* Barre de recherche principale */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
            border: `1px solid ${ANKU.green}22`,
          }}
        >
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un membre, une boutique, un produit…"
              autoFocus
              className="w-full rounded-full pl-12 pr-4 py-3 text-base bg-white border border-gray-200 focus:border-emerald-400 focus:outline-none transition"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {loading
              ? 'Recherche en cours…'
              : totalCount > 0
              ? `${totalCount} résultat${totalCount > 1 ? 's' : ''}`
              : q
              ? 'Aucun résultat'
              : 'Saisis un mot-clé pour commencer'}
          </p>
        </div>

        {/* Filtres */}
        <SearchFiltersPanel
          tab={tab}
          categories={categories}
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          onGeolocate={handleGeolocate}
          geoLoading={geoLoading}
          geolocated={!!geo.lat}
        />

        {/* Tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-2 flex gap-1 flex-wrap">
          {TABS.map((t) => {
            const active = tab === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={
                  'flex-1 min-w-[80px] rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-40 ' +
                  (active
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100')
                }
                style={active ? { background: ANKU.green } : undefined}
              >
                {t.label} ({t.count})
              </button>
            )
          })}
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
          </div>
        ) : !q && !hasFilters ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <SearchIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-800">
              Lance ta recherche
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tape un mot-clé ou utilise les filtres
            </p>
          </div>
        ) : totalCount === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <SearchIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-800">
              Aucun résultat
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Essaie d'autres mots ou assouplis les filtres
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* MEMBRES */}
            {(tab === 'all' || tab === 'users') && data.users.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <header
                  className="px-5 py-3 border-b flex items-center gap-2"
                  style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
                >
                  <Users size={16} style={{ color: ANKU.greenDark }} />
                  <h2 className="text-sm font-bold text-gray-900">
                    Membres ({data.users.length})
                  </h2>
                </header>
                <div className="divide-y divide-gray-100">
                  {data.users.map((u: any) => (
                    <Link
                      key={u.id}
                      to={`/u/${u.username}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                    >
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: ANKU.greenDark }}
                        >
                          {(u.first_name?.[0] ?? '') +
                            (u.last_name?.[0] ?? '')}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{u.username}
                          {u.role === 'professionnel' && ' · Pro'}
                          {u.city && ` · ${u.city}`}
                        </p>
                      </div>
                      {u.distance_km !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {Number(u.distance_km).toFixed(0)} km
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* BOUTIQUES */}
            {(tab === 'all' || tab === 'shops') && data.shops.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <header
                  className="px-5 py-3 border-b flex items-center gap-2"
                  style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
                >
                  <Store size={16} style={{ color: ANKU.greenDark }} />
                  <h2 className="text-sm font-bold text-gray-900">
                    Boutiques ({data.shops.length})
                  </h2>
                </header>
                <div className="divide-y divide-gray-100">
                  {data.shops.map((s: any) => (
                    <Link
                      key={s.id}
                      to={`/shops/${s.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                    >
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: ANKU.greenDark }}
                        >
                          {s.name?.[0] ?? 'S'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {s.name}
                          </p>
                          {s.average_rating > 0 && (
                            <span className="text-[10px] font-bold flex items-center gap-0.5 text-amber-600">
                              <Star size={9} fill="currentColor" />{' '}
                              {Number(s.average_rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          {s.city && (
                            <>
                              <MapPin size={10} /> {s.city}
                            </>
                          )}
                          {s.city && s.products_count > 0 && ' · '}
                          {s.products_count > 0 && `${s.products_count} produits`}
                        </p>
                      </div>
                      {s.distance_km !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {Number(s.distance_km).toFixed(0)} km
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* PRODUITS */}
            {(tab === 'all' || tab === 'products') &&
              data.products.length > 0 && (
                <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <header
                    className="px-5 py-3 border-b flex items-center gap-2"
                    style={{
                      borderColor: '#f3f4f6',
                      background: ANKU.greenPale,
                    }}
                  >
                    <Package size={16} style={{ color: ANKU.greenDark }} />
                    <h2 className="text-sm font-bold text-gray-900">
                      Produits ({data.products.length})
                    </h2>
                  </header>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
                    {data.products.map((p: any) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.id}`}
                        className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-full aspect-square object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div
                            className="w-full aspect-square flex items-center justify-center"
                            style={{ background: ANKU.greenPale }}
                          >
                            <Package
                              size={24}
                              style={{ color: ANKU.greenDark }}
                            />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-emerald-700 font-bold mt-0.5">
                            {p.price} €
                          </p>
                          {p.shop_name && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">
                              {p.shop_name}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}
      </div>
    </div>
  )
}