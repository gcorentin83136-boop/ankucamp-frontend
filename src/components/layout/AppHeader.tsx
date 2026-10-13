import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../context/AuthContext'
import UserMenu from './UserMenu'
import CartIcon from './CartIcon'
import NotificationBell from './NotificationBell'
import {
  LogOut,
  Search,
  Loader,
  User as UserIcon,
  Store,
  Package,
  X,
} from 'lucide-react'
import httpClient from '../../service/api/httpClient'

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<{
    users: any[]
    shops: any[]
    products: any[]
  }>({ users: [], shops: [], products: [] })
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults({ users: [], shops: [], products: [] })
      setOpen(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await httpClient.get('/search/all', {
          params: { q: term, limit: 5 },
        })
        setResults({
          users: data.users ?? [],
          shops: data.shops ?? [],
          products: data.products ?? [],
        })
        setOpen(true)
      } catch {
        setResults({ users: [], shops: [], products: [] })
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const hasResults =
    results.users.length > 0 ||
    results.shops.length > 0 ||
    results.products.length > 0

  const goTo = (path: string) => {
    setOpen(false)
    setQ('')
    navigate(path)
  }

  return (
    <header
      className="sticky top-0 z-30 w-full backdrop-blur-2xl border-b shadow-sm"
      style={{
        background:
          'linear-gradient(135deg, rgba(106,168,79,0.55) 0%, rgba(74,122,53,0.55) 100%)',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center gap-3 sm:gap-4">
        {/* Logo ANKU → clic = accueil */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          title="Retour à l'accueil"
        >
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white group-hover:text-emerald-100 transition drop-shadow-sm">
            ANKU
          </span>
        </Link>

        {/* Recherche */}
        {isAuthenticated && (
          <div
            ref={wrapRef}
            className="flex-1 max-w-xl relative hidden md:block"
          >
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90 pointer-events-none"
              />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => q.trim().length >= 2 && setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && q.trim().length >= 2) {
                    goTo(`/search?q=${encodeURIComponent(q.trim())}`)
                  }
                }}
                placeholder="Rechercher un membre, une boutique, un produit…"
                className="w-full rounded-full pl-10 pr-10 py-2 text-sm text-white placeholder-white/90 bg-black/20 border border-white/25 focus:bg-black/30 focus:border-white/50 focus:outline-none transition"
              />
              {searching && (
                <Loader
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 animate-spin"
                />
              )}
              {!searching && q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('')
                    setOpen(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {open && (
              <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[70vh] overflow-y-auto">
                {!hasResults ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">
                      Aucun résultat pour « {q} »
                    </p>
                  </div>
                ) : (
                  <>
                    {results.users.length > 0 && (
                      <div className="p-2">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Membres
                        </p>
                        {results.users.map((u: any) => (
                          <button
                            key={`u-${u.id}`}
                            type="button"
                            onClick={() => goTo(`/u/${u.username}`)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
                          >
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: '#4a7a35' }}
                              >
                                <UserIcon size={14} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {u.first_name} {u.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                @{u.username}
                                {u.role === 'professionnel' && ' · Pro'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {results.shops.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Boutiques
                        </p>
                        {results.shops.map((s: any) => (
                          <button
                            key={`s-${s.id}`}
                            type="button"
                            onClick={() => goTo(`/shops/${s.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
                          >
                            {s.logo_url ? (
                              <img
                                src={s.logo_url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: '#4a7a35' }}
                              >
                                <Store size={14} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {s.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {s.city ? `${s.city}` : 'Boutique ANKU'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {results.products.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Produits
                        </p>
                        {results.products.map((p: any) => (
                          <button
                            key={`p-${p.id}`}
                            type="button"
                            onClick={() => goTo(`/products/${p.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
                          >
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: '#4a7a35' }}
                              >
                                <Package size={14} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {p.price ? `${p.price} €` : 'Produit'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Voir tous les résultats */}
                    <button
                      type="button"
                      onClick={() => goTo(`/search?q=${encodeURIComponent(q)}`)}
                      className="w-full border-t border-gray-100 py-3 text-xs font-bold transition hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                      style={{ color: '#4a7a35' }}
                    >
                      Voir tous les résultats pour « {q} » →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions à droite */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                title="Se déconnecter"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold transition backdrop-blur-sm"
              >
                <LogOut size={14} />
                <span className="hidden xl:inline">Déconnexion</span>
              </button>
              <div className="flex items-center gap-1">
                <UserMenu />
                <CartIcon />
                <NotificationBell />
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-white/90 hover:text-white transition px-3 py-1.5"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-bold bg-white text-emerald-800 hover:bg-emerald-50 rounded-full transition shadow-md"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}