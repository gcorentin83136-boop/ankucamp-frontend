// ============================================================
// ANKU — Page Liste des Boutiques (Buyer)
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search, Store, MapPin, Star, Package, Users, Loader,
  SlidersHorizontal, X, Home, Compass,
  ChevronLeft, ChevronRight, ChevronRight as ChevR,
  CheckCircle2, Filter, Truck, Handshake,
} from 'lucide-react'
import searchApi from '../../service/api/search.api'
import categoriesApi from '../../service/api/categories.api'
import followsApi from '../../service/api/follows.api'
import type { ShopSearchResult } from '../../types/search'
import type { Category } from '../../types/category'
import { useAuthStore } from '../../context/AuthContext'
import AnimatedShopsBackground from '../../components/shops/AnimatedShopsBackground'
import { DEFAULT_CATEGORIES, ICONS_MAP, GRADIENTS } from '../../data/categories'
import QuickMenu from '../../components/shops/QuickMenu'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition'

const SORT_OPTIONS = [
  { value: 'relevance',      label: 'Pertinence' },
  { value: 'rating',         label: 'Mieux notés' },
  { value: 'products_count', label: 'Plus de produits' },
  { value: 'recent',         label: 'Récents' },
] as const

const DELIVERY_OPTIONS = [
  { value: 'pickup',   label: 'Retrait',      icon: Store },
  { value: 'shipping', label: 'Livraison',    icon: Truck },
  { value: 'meeting',  label: 'Point de RDV', icon: Handshake },
] as const

type SortValue = typeof SORT_OPTIONS[number]['value']
type DeliveryValue = typeof DELIVERY_OPTIONS[number]['value']

export default function ShopsList() {
  const auth = useAuthStore()
  const isLogged: boolean =
    (auth as any)?.user != null || (auth as any)?.isAuthenticated === true

  const [loadingCats, setLoadingCats]   = useState(true)
  const [loadingShops, setLoadingShops] = useState(true)
  const [categories, setCategories]     = useState<Category[]>([])
  const [shops, setShops]               = useState<ShopSearchResult[]>([])

  const [search, setSearch]                     = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [sort, setSort]                         = useState<SortValue>('relevance')
  const [showSortMenu, setShowSortMenu]         = useState(false)
  const [showFilterPanel, setShowFilterPanel]   = useState(false)
  const [filterCity, setFilterCity]             = useState('')
  const [filterMinRating, setFilterMinRating]   = useState<number>(0)
  const [filterDelivery, setFilterDelivery]     = useState<DeliveryValue | null>(null)
  const [filterHasStock, setFilterHasStock]     = useState(false)
  const [followingIds, setFollowingIds]         = useState<Set<number>>(new Set())
  const [pendingIds, setPendingIds]             = useState<Set<number>>(new Set())

  const carouselRef = useRef<HTMLDivElement>(null)

  // -------- Catégories --------
  useEffect(() => {
    ;(async () => {
      try {
        const res = await categoriesApi.list()
        setCategories(res.categories?.length ? res.categories : DEFAULT_CATEGORIES)
      } catch {
        setCategories(DEFAULT_CATEGORIES)
      } finally {
        setLoadingCats(false)
      }
    })()
  }, [])

  // -------- Boutiques (debounce 300ms) --------
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoadingShops(true)
      try {
        const res = await searchApi.shops({
          q: search.trim() || undefined,
          category_id: selectedCategory ?? undefined,
          city: filterCity.trim() || undefined,
          min_rating: filterMinRating > 0 ? filterMinRating : undefined,
          delivery: filterDelivery ?? undefined,
          has_stock: filterHasStock ? true : undefined,
          sort,
          limit: 50,
        })
        setShops(res.results)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur de chargement')
      } finally {
        setLoadingShops(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search, selectedCategory, sort, filterCity, filterMinRating, filterDelivery, filterHasStock])

  const toggleFollow = async (shopId: number) => {
    if (!isLogged) {
      toast.error('Connecte-toi pour suivre une boutique')
      return
    }
    if (pendingIds.has(shopId)) return
    setPendingIds((p) => new Set(p).add(shopId))
    try {
      const res = await followsApi.toggle(shopId)
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (res.following) next.add(shopId)
        else next.delete(shopId)
        return next
      })
      toast.success(res.following ? 'Boutique suivie ✅' : 'Ne suit plus')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setPendingIds((p) => {
        const next = new Set(p)
        next.delete(shopId)
        return next
      })
    }
  }

  const scrollCarousel = (dir: 'left' | 'right') => {
    const el = carouselRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== null ||
    filterCity.trim() !== '' ||
    filterMinRating > 0 ||
    filterDelivery !== null ||
    filterHasStock

  const activeFiltersCount =
    (filterCity.trim() !== '' ? 1 : 0) +
    (filterMinRating > 0 ? 1 : 0) +
    (filterDelivery !== null ? 1 : 0) +
    (filterHasStock ? 1 : 0)

  const activeCategoryName =
    selectedCategory !== null
      ? categories.find((c) => c.id === selectedCategory)?.name
      : null

  const resetAllFilters = () => {
    setSearch('')
    setSelectedCategory(null)
    setFilterCity('')
    setFilterMinRating(0)
    setFilterDelivery(null)
    setFilterHasStock(false)
  }

  const resetAdvancedFilters = () => {
    setFilterCity('')
    setFilterMinRating(0)
    setFilterDelivery(null)
    setFilterHasStock(false)
  }

  return (
    <>
      <QuickMenu />
      <div className="relative min-h-screen">
      <AnimatedShopsBackground />

      <div className="relative max-w-7xl mx-auto py-6 px-3 sm:px-5 space-y-5">
        {/* ================= Header ================= */}
        <div
          className="rounded-3xl p-6 sm:p-8 border shadow-sm backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(240,249,232,0.9) 0%, rgba(255,255,255,0.75) 100%)',
            borderColor: `${ANKU.green}33`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                background: `linear-gradient(135deg, #8bc34a 0%, ${ANKU.greenDark} 100%)`,
              }}
            >
              <Store size={22} className="text-white" />
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:scale-105 shrink-0"
                style={{
                  background: '#ffffff',
                  border: `1px solid ${ANKU.green}33`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                title="Retour à l'accueil"
              >
                <Home size={18} style={{ color: ANKU.greenDark }} />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  Les boutiques ANKU
                </h1>
                <p className="text-sm text-gray-600">
                  Producteurs, artisans et créateurs près de chez toi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= Carrousel catégories ================= */}
        <section className="relative">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                Explorer par catégorie
              </h2>
              {activeCategoryName && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  {activeCategoryName}
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center shadow-sm transition"
                aria-label="Précédent"
              >
                <ChevronLeft size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center shadow-sm transition"
                aria-label="Suivant"
              >
                <ChevronRight size={16} className="text-gray-700" />
              </button>
            </div>
          </div>

          {loadingCats ? (
            <div className="py-10 text-center">
              <Loader size={22} className="animate-spin text-gray-400 mx-auto" />
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin"
              style={{
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'thin',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={
                  'group relative shrink-0 w-[150px] sm:w-[170px] h-[200px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ' +
                  (selectedCategory === null ? 'ring-4 ring-offset-2' : '')
                }
                style={{
                  scrollSnapAlign: 'start',
                  boxShadow: `0 0 0 3px ${ANKU.green}40`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${ANKU.greenDark} 0%, ${ANKU.green} 100%)`,
                  }}
                />
                <div className="relative h-full flex flex-col items-center justify-center text-white p-3">
                  <Compass size={48} strokeWidth={1.5} className="mb-2 opacity-90" />
                  <span className="text-sm font-extrabold text-center leading-tight">
                    Toutes les
                    <br />
                    boutiques
                  </span>
                  <span className="text-[10px] mt-1 opacity-80">
                    {shops.length} au total
                  </span>
                </div>
                {selectedCategory === null && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <X size={12} style={{ color: ANKU.greenDark }} />
                  </div>
                )}
              </button>

              {categories.map((cat, idx) => {
                const Icon = ICONS_MAP[cat.icon ?? 'store'] ?? Store
                const active = selectedCategory === cat.id
                const bg = GRADIENTS[idx % GRADIENTS.length]
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(active ? null : cat.id)}
                    className={
                      'group relative shrink-0 w-[150px] sm:w-[170px] h-[200px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ' +
                      (active ? 'ring-4 ring-offset-2' : '')
                    }
                    style={{
                      scrollSnapAlign: 'start',
                      boxShadow: `0 0 0 3px ${ANKU.green}40`,
                    }}
                  >
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: bg }} />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="relative h-full flex flex-col justify-end p-3 text-white text-left">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 border border-white/30 backdrop-blur-sm"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-extrabold leading-tight">
                        {cat.name}
                      </span>
                    </div>

                    {active && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                        style={{ background: '#ffffff' }}
                      >
                        <X size={12} style={{ color: ANKU.greenDark }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* ================= Barre recherche + tri + filtres ================= */}
        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une boutique, un produit…"
              className={inputCls + ' !pl-9 !py-2.5 !text-sm'}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Bouton Filtres */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowFilterPanel((v) => !v)
                setShowSortMenu(false)
              }}
              className={
                'rounded-full px-3 py-2 text-xs font-semibold transition flex items-center gap-1.5 border ' +
                (activeFiltersCount > 0
                  ? 'text-white border-transparent'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border-transparent')
              }
              style={
                activeFiltersCount > 0
                  ? { background: ANKU.green }
                  : undefined
              }
            >
              <Filter size={12} />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="ml-0.5 bg-white/30 rounded-full px-1.5 text-[10px] font-extrabold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showFilterPanel && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFilterPanel(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-72 sm:w-80 space-y-4">
                  {/* Ville */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <MapPin size={11} /> Ville
                    </label>
                    <input
                      type="text"
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      placeholder="Ex : Lyon, Marseille…"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition"
                    />
                  </div>

                  {/* Note minimum */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <Star size={11} /> Note minimum
                    </label>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4, 5].map((n) => {
                        const active = filterMinRating === n
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setFilterMinRating(active ? 0 : n)}
                            className={
                              'flex-1 rounded-lg py-1.5 text-xs font-bold transition ' +
                              (active
                                ? 'text-white'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                            }
                            style={active ? { background: ANKU.green } : undefined}
                          >
                            {n === 0 ? 'Tout' : `${n}+`}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Livraison */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <Truck size={11} /> Mode de livraison
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DELIVERY_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        const active = filterDelivery === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setFilterDelivery(active ? null : opt.value)
                            }
                            className={
                              'rounded-full px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1 ' +
                              (active
                                ? 'text-white'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                            }
                            style={active ? { background: ANKU.green } : undefined}
                          >
                            <Icon size={11} />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* En stock */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterHasStock}
                        onChange={(e) => setFilterHasStock(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Package size={12} /> Avec produits en stock
                      </span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={resetAdvancedFilters}
                        className="flex-1 rounded-full py-2 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFilterPanel(false)}
                      className="flex-1 rounded-full py-2 text-[11px] font-bold text-white transition"
                      style={{ background: ANKU.green }}
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tri */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSortMenu((s) => !s)
                setShowFilterPanel(false)
              }}
              className="rounded-full px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
            >
              <SlidersHorizontal size={12} />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
            </button>

            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[180px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSort(opt.value)
                        setShowSortMenu(false)
                      }}
                      className={
                        'w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ' +
                        (sort === opt.value
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100')
                      }
                      style={{
                        background: sort === opt.value ? ANKU.green : undefined,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reset global */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1.5"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </section>

        {/* ================= Compteur ================= */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm font-bold text-gray-900">
            {loadingShops ? '…' : shops.length}
          </span>
          <span className="text-sm text-gray-600">
            boutique{shops.length > 1 ? 's' : ''}
            {activeCategoryName ? ` · ${activeCategoryName}` : ''}
          </span>
        </div>

        {/* ================= Grille boutiques ================= */}
        {loadingShops ? (
          <div className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-10 text-center shadow-sm">
            <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
          </div>
        ) : shops.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl p-10 text-center shadow-sm">
            <Store size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-800">
              Aucune boutique trouvée
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Essaie d'autres filtres ou une autre recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shops.map((shop) => {
              const isFollowing = followingIds.has(shop.id)
              const isPending   = pendingIds.has(shop.id)
              return (
                <div
                  key={shop.id}
                  className="rounded-2xl overflow-hidden border border-white/50 bg-white/85 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  {/* Bannière */}
                  <Link to={`/shops/${shop.id}`} className="block relative">
                    <div
                      className="h-24 relative overflow-hidden"
                      style={{
                        background: shop.banner_url
                          ? undefined
                          : `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
                      }}
                    >
                      {shop.banner_url && (
                        <img
                          src={shop.banner_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    <div className="absolute -bottom-6 left-3">
                      {shop.logo_url ? (
                        <img
                          src={shop.logo_url}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold text-white border-4 border-white shadow-md"
                          style={{
                            background: `linear-gradient(135deg, #8bc34a 0%, ${ANKU.greenDark} 100%)`,
                          }}
                        >
                          {shop.name?.[0]?.toUpperCase() ?? 'S'}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Contenu */}
                  <div className="pt-8 px-3.5 pb-3.5 flex-1 flex flex-col">
                    <Link
                      to={`/shops/${shop.id}`}
                      className="text-sm font-bold text-gray-900 hover:underline line-clamp-1"
                    >
                      {shop.name}
                    </Link>

                    {/* Badges */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {shop.owner_verification_status === 'verified' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 size={8} /> Vérifié
                        </span>
                      )}
                      {shop.vacation_mode === 1 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          🌴 En vacances
                        </span>
                      )}
                      {shop.owner_badges && shop.owner_badges.slice(0, 2).map((b) => (
                        <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {b}
                        </span>
                      ))}
                    </div>

                    {shop.city && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1.5">
                        <MapPin size={10} />
                        {shop.city}
                        {shop.distance_km !== undefined && (
                          <span className="text-gray-400">
                            · {Number(shop.distance_km).toFixed(1)} km
                          </span>
                        )}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star size={11} fill="#f59e0b" />
                        {Number(shop.average_rating || 0).toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Package size={10} />
                        {shop.products_count} produit{shop.products_count > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users size={10} />
                        {shop.followers_count} abonné{shop.followers_count > 1 ? 's' : ''}
                      </span>
                    </div>

                    {shop.description && (
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1.5 flex-1">
                        {shop.description}
                      </p>
                    )}

                    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                      <Link
                        to={`/shops/${shop.id}`}
                        className="flex-1 rounded-full py-1.5 text-[11px] font-bold text-white text-center transition flex items-center justify-center gap-1"
                        style={{ background: ANKU.green }}
                      >
                        Voir la boutique <ChevR size={11} />
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => toggleFollow(shop.id)}
                        className={
                          'w-8 h-8 rounded-full flex items-center justify-center transition ' +
                          (isPending ? 'opacity-50 cursor-wait ' : '') +
                          (isFollowing
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                        }
                        title={isFollowing ? 'Ne plus suivre' : 'Suivre'}
                      >
                        <Users size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </>
  )
}