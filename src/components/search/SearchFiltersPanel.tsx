/* eslint-disable */
import { useState } from 'react'
import { SlidersHorizontal, X, MapPin, Star } from 'lucide-react'
import type { SearchSort } from '../../service/api/search.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

export interface FilterState {
  role?: 'particulier' | 'professionnel' | ''
  city: string
  category_id?: number
  min_rating?: number
  delivery?: 'pickup' | 'shipping' | 'meeting' | ''
  has_stock: boolean
  min_price?: number
  max_price?: number
  in_stock: boolean
  radius: number
  sort: SearchSort
}

export const defaultFilters: FilterState = {
  role: '',
  city: '',
  category_id: undefined,
  min_rating: undefined,
  delivery: '',
  has_stock: false,
  min_price: undefined,
  max_price: undefined,
  in_stock: false,
  radius: 30,
  sort: 'relevance',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition'

interface Props {
  tab: 'all' | 'users' | 'shops' | 'products'
  categories: { id: number; name: string }[]
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  onReset: () => void
  onGeolocate: () => void
  geoLoading: boolean
  geolocated: boolean
}

export default function SearchFiltersPanel({
  tab,
  categories,
  filters,
  onChange,
  onReset,
  onGeolocate,
  geoLoading,
  geolocated,
}: Props) {
  const [open, setOpen] = useState(false)

  const activeCount =
    (filters.role ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.category_id ? 1 : 0) +
    (filters.min_rating ? 1 : 0) +
    (filters.delivery ? 1 : 0) +
    (filters.has_stock ? 1 : 0) +
    (filters.min_price !== undefined ? 1 : 0) +
    (filters.max_price !== undefined ? 1 : 0) +
    (filters.in_stock ? 1 : 0) +
    (geolocated ? 1 : 0)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} style={{ color: ANKU.greenDark }} />
          <span className="text-sm font-bold text-gray-900">Filtres</span>
          {activeCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: ANKU.green }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {open ? 'Réduire' : 'Développer'}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGeolocate}
              disabled={geoLoading}
              className={
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ' +
                (geolocated
                  ? 'text-white'
                  : 'text-gray-700 border border-gray-200 hover:bg-gray-50')
              }
              style={geolocated ? { background: ANKU.green } : undefined}
            >
              <MapPin size={12} />
              {geoLoading
                ? 'Localisationâ€¦'
                : geolocated
                ? 'Autour de moi âœ“'
                : 'Autour de moi'}
            </button>

            {geolocated && (
              <select
                value={filters.radius}
                onChange={(e) => onChange({ radius: Number(e.target.value) })}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-emerald-400"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={200}>200 km</option>
                <option value={500}>500 km</option>
              </select>
            )}

            <select
              value={filters.sort}
              onChange={(e) =>
                onChange({ sort: e.target.value as SearchSort })
              }
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-emerald-400"
            >
              <option value="relevance">Pertinence</option>
              <option value="recent">Plus récents</option>
              {tab === 'users' && <option value="alphabetical">A â†’ Z</option>}
              {tab === 'shops' && (
                <>
                  <option value="rating">Mieux notés</option>
                  <option value="products_count">Plus de produits</option>
                </>
              )}
              {tab === 'products' && (
                <>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="rating">Mieux notés</option>
                </>
              )}
            </select>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="ml-auto text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="Ex : Lyon"
                className={inputCls}
              />
            </div>
            {(tab === 'shops' || tab === 'products') && (
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Catégorie
                </label>
                <select
                  value={filters.category_id ?? ''}
                  onChange={(e) =>
                    onChange({
                      category_id: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">Toutes</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {tab === 'users' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-2">
                Type de membre
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: '', label: 'Tous' },
                  { v: 'professionnel', label: 'Pros' },
                  { v: 'particulier', label: 'Particuliers' },
                ].map((o) => {
                  const active = (filters.role ?? '') === o.v
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => onChange({ role: o.v as any })}
                      className={
                        'rounded-full px-3 py-1.5 text-xs font-bold transition ' +
                        (active
                          ? 'text-white'
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                      }
                      style={active ? { background: ANKU.green } : undefined}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {(tab === 'shops' || tab === 'products') && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-2">
                Note minimale
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[0, 3, 4, 4.5].map((r) => {
                  const active = (filters.min_rating ?? 0) === r
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        onChange({ min_rating: r === 0 ? undefined : r })
                      }
                      className={
                        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ' +
                        (active
                          ? 'text-white'
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                      }
                      style={active ? { background: ANKU.green } : undefined}
                    >
                      {r === 0 ? (
                        'Toutes'
                      ) : (
                        <>
                          <Star size={10} /> {r}+
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Prix min (â‚¬)
                </label>
                <input
                  type="number"
                  value={filters.min_price ?? ''}
                  onChange={(e) =>
                    onChange({
                      min_price: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Prix max (â‚¬)
                </label>
                <input
                  type="number"
                  value={filters.max_price ?? ''}
                  onChange={(e) =>
                    onChange({
                      max_price: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="100"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {tab === 'shops' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-2">
                Mode de livraison
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: '', label: 'Tous' },
                  { v: 'pickup', label: 'Retrait' },
                  { v: 'shipping', label: 'Envoi' },
                  { v: 'meeting', label: 'RDV' },
                ].map((o) => {
                  const active = (filters.delivery ?? '') === o.v
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => onChange({ delivery: o.v as any })}
                      className={
                        'rounded-full px-3 py-1.5 text-xs font-bold transition ' +
                        (active
                          ? 'text-white'
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                      }
                      style={active ? { background: ANKU.green } : undefined}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'shops' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_stock}
                onChange={(e) => onChange({ has_stock: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-xs font-semibold text-gray-700">
                Uniquement les boutiques avec produits en stock
              </span>
            </label>
          )}

          {tab === 'products' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.in_stock}
                onChange={(e) => onChange({ in_stock: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-xs font-semibold text-gray-700">
                Uniquement les produits en stock
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  )
}
