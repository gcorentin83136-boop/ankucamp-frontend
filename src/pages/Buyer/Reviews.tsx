import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Star,
  Loader,
  Trash2,
  Filter,
  Package,
  Calendar,
} from 'lucide-react'
import reviewsApi from '../../service/api/reviews.api'
import type { Review } from '../../types/review'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          fill={n <= value ? '#f59e0b' : 'none'}
          className={n <= value ? 'text-amber-500' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

export default function BuyerReviews() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<'all' | number>('all')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await reviewsApi.listMine()
      setReviews(res.reviews)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews
    return reviews.filter((r) => r.rating === filter)
  }, [reviews, filter])

  const stats = useMemo(() => {
    const total = reviews.length
    const avg =
      total > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / total
        : 0
    return {
      total,
      average: avg,
      distribution: [5, 4, 3, 2, 1].map((n) => ({
        rating: n,
        count: reviews.filter((r) => r.rating === n).length,
      })),
    }
  }, [reviews])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet avis ?')) return
    try {
      await reviewsApi.delete(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
      toast.success('Avis supprimé ✅')
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
          <Star size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Mes avis</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {stats.total} avis publié{stats.total > 1 ? 's' : ''}
          {stats.total > 0 && ' · Note moyenne ' + stats.average.toFixed(1) + '/5'}
        </p>
      </div>

      {/* Distribution */}
      {!loading && stats.total > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Distribution
          </p>
          <div className="space-y-1.5">
            {stats.distribution.map((d) => {
              const pct =
                stats.total > 0 ? Math.round((d.count / stats.total) * 100) : 0
              return (
                <button
                  key={d.rating}
                  type="button"
                  onClick={() =>
                    setFilter(filter === d.rating ? 'all' : d.rating)
                  }
                  className="w-full flex items-center gap-2 text-left"
                >
                  <StarRow value={d.rating} />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: pct + '%', background: '#f59e0b' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                    {d.count}
                  </span>
                </button>
              )
            })}
          </div>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-3 text-xs font-semibold flex items-center gap-1"
              style={{ color: ANKU.greenDark }}
            >
              <Filter size={12} /> Voir tous les avis
            </button>
          )}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Star size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {reviews.length === 0
              ? 'Tu n’as encore laissé aucun avis'
              : 'Aucun avis dans ce filtre'}
          </p>
          {reviews.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Les avis se laissent depuis une commande livrée
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                    <Package size={12} className="text-gray-400 shrink-0" />
                    {r.product_name ?? 'Produit #' + r.product_id}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRow value={r.rating} />
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition shrink-0"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {r.comment && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {r.comment}
                </p>
              )}
              <Link
                to={'/products/' + r.product_id}
                className="text-[11px] font-semibold inline-block"
                style={{ color: ANKU.greenDark }}
              >
                Voir le produit →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
