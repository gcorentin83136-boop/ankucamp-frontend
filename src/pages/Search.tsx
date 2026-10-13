import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search as SearchIcon,
  Users,
  Store,
  Package,
  Loader,
  MapPin,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import httpClient from '../service/api/httpClient'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type Tab = 'all' | 'users' | 'shops' | 'products'

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    users: any[]
    shops: any[]
    products: any[]
  }>({ users: [], shops: [], products: [] })

  const [tab, setTab] = useState<Tab>('all')

  const fetchResults = useCallback(async (term: string) => {
    if (!term.trim() || term.trim().length < 2) {
      setData({ users: [], shops: [], products: [] })
      return
    }
    setLoading(true)
    try {
      const { data: res } = await httpClient.get('/search/all', {
        params: { q: term.trim(), limit: 30 },
      })
      setData({
        users: res.users ?? [],
        shops: res.shops ?? [],
        products: res.products ?? [],
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de recherche')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResults(q)
  }, [q, fetchResults])

  const totalCount =
    data.users.length + data.shops.length + data.products.length

  const TABS: { value: Tab; label: string; count: number }[] = [
    { value: 'all', label: 'Tout', count: totalCount },
    { value: 'users', label: 'Membres', count: data.users.length },
    { value: 'shops', label: 'Boutiques', count: data.shops.length },
    { value: 'products', label: 'Produits', count: data.products.length },
  ]

  return (
    <div className="relative min-h-screen">
      <AppHeader />
      <AnimatedShopsBackground />

      <div className="relative max-w-5xl mx-auto py-6 px-3 sm:px-5 space-y-4">
        {/* Header */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
            border: `1px solid ${ANKU.green}22`,
          }}
        >
          <div className="flex items-center gap-2">
            <SearchIcon size={20} style={{ color: ANKU.greenDark }} />
            <h1 className="text-lg font-bold text-gray-900">
              Résultats pour « {q} »
            </h1>
          </div>
          {!loading && (
            <p className="text-sm text-gray-600 mt-1">
              {totalCount} résultat{totalCount > 1 ? 's' : ''} trouvé
              {totalCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-2 flex gap-1 flex-wrap">
          {TABS.map((t) => {
            const active = tab === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                disabled={t.value !== 'all' && t.count === 0}
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
            <Loader
              size={24}
              className="animate-spin text-gray-400 mx-auto"
            />
          </div>
        ) : totalCount === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <SearchIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-800">
              Aucun résultat pour « {q} »
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Essaie avec un autre terme.
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
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          {s.city && (
                            <>
                              <MapPin size={10} /> {s.city}
                            </>
                          )}
                          {s.city && s.products_count && ' · '}
                          {s.products_count && `${s.products_count} produits`}
                        </p>
                      </div>
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