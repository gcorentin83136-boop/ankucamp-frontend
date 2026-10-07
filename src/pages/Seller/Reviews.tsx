import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Star,
  CheckCircle2,
  MessageSquare,
  Flag,
  Send,
  X,
  Loader,
  Filter,
  Package,
  AlertTriangle,
  Search,
  User as UserIcon,
  Reply,
} from 'lucide-react'
import reviewsApi from '../../service/api/reviews.api'
import type { Review } from '../../types/review'
import StatCard from '../../components/seller/StatCard'
import EmojiPicker from '../../components/comments/EmojiPicker'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatDate(iso: string): string {
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

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 1) return 'aujourd’hui'
    if (days === 1) return 'hier'
    if (days < 7) return `il y a ${days} j`
    if (days < 30) return `il y a ${Math.floor(days / 7)} sem`
    return formatDate(iso)
  } catch {
    return iso
  }
}

// ============================================================
// ÉTOILES
// ============================================================
function StarRating({
  value,
  size = 14,
  onChange,
}: {
  value: number
  size?: number
  onChange?: (v: number) => void
}) {
  // Mode lecture seule → <span> (évite <button> imbriqué)
  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            fill={n <= value ? '#f59e0b' : 'none'}
            className={n <= value ? 'text-amber-500' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  // Mode interactif → <button>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="cursor-pointer"
        >
          <Star
            size={size}
            fill={n <= value ? '#f59e0b' : 'none'}
            className={n <= value ? 'text-amber-500' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

// ============================================================
// MODAL RÉPONSE
// ============================================================
function ReplyModal({
  review,
  onClose,
  onSaved,
}: {
  review: Review | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    if (review) setText(review.reply_text ?? '')
  }, [review])

  if (!review) return null

  const handleSubmit = async () => {
    if (text.trim().length < 2) {
      toast.error('Réponse trop courte (min 2 caractères)')
      return
    }
    setLoading(true)
    try {
      await reviewsApi.reply(review.id, text.trim())
      toast.success('Réponse publiée ✅')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {review.reply_text ? 'Modifier la réponse' : 'Répondre à cet avis'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {review.author_first_name} {review.author_last_name} ·{' '}
              {review.rating}/5
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-3">
          {/* Avis original */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">
              Avis du client
            </p>
            <StarRating value={review.rating} size={12} />
            <p className="text-sm text-gray-700 mt-2 italic">
              {review.comment || '(sans commentaire)'}
            </p>
          </div>

          <label className="block text-xs font-semibold text-gray-700">
            Ta réponse publique
          </label>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Merci pour ton retour…"
              className={inputCls + ' resize-none pr-12'}
              maxLength={2000}
            />
            <div className="absolute bottom-2 right-2">
              <EmojiPicker align="right" onPick={(e) => setText((t) => t + e)} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-right">
            {text.length}/2000
          </p>
        </div>

        <footer
          className="px-5 py-4 border-t flex justify-end gap-2"
          style={{ borderColor: '#f3f4f6' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: ANKU.green }}
          >
            {loading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {review.reply_text ? 'Mettre à jour' : 'Publier'}
          </button>
        </footer>
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}

// ============================================================
// MODAL SIGNALEMENT
// ============================================================
function ReportModal({
  review,
  onClose,
  onSaved,
}: {
  review: Review | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    setReason('')
  }, [review])

  if (!review) return null

  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      toast.error('Explique pourquoi (min 5 caractères)')
      return
    }
    setLoading(true)
    try {
      await reviewsApi.report(review.id, reason.trim())
      toast.success('Avis signalé ✅')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Signaler cet avis
            </h3>
            <p className="text-xs text-red-700 mt-0.5">
              Il sera masqué en attendant vérification par l’équipe
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-700 ml-auto"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Raison du signalement *
          </label>
          <div className="relative">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Ex : propos injurieux, spam, hors-sujet…"
              className={inputCls + ' resize-none pr-12'}
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2">
              <EmojiPicker align="right" onPick={(e) => setReason((r) => r + e)} />
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Flag size={14} />
            )}
            Signaler
          </button>
        </footer>
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}

// ============================================================
// PAGE
// ============================================================
export default function SellerReviews() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [search, setSearch] = useState('')

  const [replyTarget, setReplyTarget] = useState<Review | null>(null)
  const [reportTarget, setReportTarget] = useState<Review | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await reviewsApi.listSellerReviews()
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

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    const average = total > 0 ? sum / total : 0
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++
    })
    const flagged = reviews.filter((r) => r.is_flagged === 1).length
    const withReply = reviews.filter((r) => r.reply_text).length
    return { total, average, distribution, flagged, withReply }
  }, [reviews])

  // Liste unique de produits
  const products = useMemo(() => {
    const map = new Map<number, string>()
    reviews.forEach((r) => {
      if (!map.has(r.product_id)) {
        map.set(r.product_id, r.product_name ?? `Produit #${r.product_id}`)
      }
    })
    return Array.from(map.entries())
  }, [reviews])

  const filtered = useMemo(() => {
    let list = reviews
    if (ratingFilter !== 'all')
      list = list.filter((r) => r.rating === ratingFilter)
    if (productFilter !== 'all')
      list = list.filter((r) => String(r.product_id) === productFilter)
    if (flaggedOnly) list = list.filter((r) => r.is_flagged === 1)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (r) =>
          (r.comment ?? '').toLowerCase().includes(q) ||
          (r.author_first_name ?? '').toLowerCase().includes(q) ||
          (r.author_last_name ?? '').toLowerCase().includes(q) ||
          (r.product_name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [reviews, ratingFilter, productFilter, flaggedOnly, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">Avis reçus</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {stats.total} avis au total · Note moyenne{' '}
          <strong>{stats.average.toFixed(1)}</strong>/5
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<MessageSquare size={18} />}
          onClick={() => {
            setRatingFilter('all')
            setProductFilter('all')
            setFlaggedOnly(false)
          }}
        />
        <StatCard
          label="Note moyenne"
          value={stats.average.toFixed(1)}
          icon={<Star size={18} />}
          highlight={stats.average >= 4}
        />
        <StatCard
          label="Avec réponse"
          value={`${stats.withReply}/${stats.total}`}
          icon={<Reply size={18} />}
        />
        <StatCard
          label="Signalés"
          value={stats.flagged}
          icon={<Flag size={18} />}
          danger={stats.flagged > 0}
          onClick={() => setFlaggedOnly(true)}
        />
      </div>

      {/* Distribution des étoiles */}
      {stats.total > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Distribution
          </p>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = stats.distribution[n] ?? 0
              const pct =
                stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setRatingFilter(ratingFilter === n ? 'all' : n)
                  }
                  className={`w-full flex items-center gap-2 text-left transition ${
                    ratingFilter === n ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <StarRating value={n} size={11} />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: '#f59e0b',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un avis, client, produit…"
            className={inputCls + ' !pl-10'}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
            <Filter size={14} />
            <span className="font-semibold">Produit :</span>
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <option value="all">Tous les produits</option>
            {products.map(([id, name]) => (
              <option key={id} value={String(id)}>
                {name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-auto">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
              className="w-4 h-4 accent-red-500"
            />
            <span className="text-sm font-semibold text-red-600">
              Signalés uniquement
            </span>
          </label>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {reviews.length === 0
              ? 'Aucun avis reçu pour l’instant'
              : 'Aucun avis dans ce filtre'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const authorName =
              `${r.author_first_name ?? ''} ${r.author_last_name ?? ''}`.trim() ||
              r.author_username ||
              `Client #${r.author_id}`

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3"
              >
                {/* Header : avatar + nom + étoiles + badges */}
                <div className="flex items-start gap-3">
                  {r.author_avatar_url ? (
                    <img
                      src={r.author_avatar_url}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: ANKU.greenPale,
                        color: ANKU.greenDark,
                      }}
                    >
                      <UserIcon size={18} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">
                        {authorName}
                      </p>
                      {r.author_badges?.slice(0, 2).map((b) => (
                        <span
                          key={b}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
                        >
                          {b}
                        </span>
                      ))}
                      {r.is_flagged === 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                          <Flag size={9} /> Signalé
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StarRating value={r.rating} size={13} />
                      <span className="text-[11px] text-gray-400">
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Produit */}
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Package size={11} />
                  <span className="font-semibold">
                    {r.product_name ?? `Produit #${r.product_id}`}
                  </span>
                </div>

                {/* Commentaire */}
                {r.comment && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}

                {/* Réponse vendeur (avis au-dessus, réponse en dessous) */}
                {r.reply_text && (
                  <div className="mt-2 space-y-2">
                    {/* Flèche visuelle */}
                    <div className="flex items-center gap-2 pl-3 text-[10px] text-gray-400">
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                        <path
                          d="M1 1 L8 8 L15 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>Réponse du vendeur</span>
                    </div>

                    <div
                      className="rounded-2xl p-3 border"
                      style={{
                        background: '#ffffff',
                        borderColor: `${ANKU.green}55`,
                        boxShadow: `0 0 0 1px ${ANKU.green}22`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar du vendeur */}
                        {r.shop?.logo_url ? (
                          <img
                            src={r.shop.logo_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            style={{ border: `2px solid ${ANKU.green}` }}
                          />
                        ) : r.seller?.avatar_url ? (
                          <img
                            src={r.seller.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            style={{ border: `2px solid ${ANKU.green}` }}
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white"
                            style={{ background: ANKU.green }}
                          >
                            {r.shop?.name?.charAt(0).toUpperCase() ??
                              r.seller?.first_name?.charAt(0)?.toUpperCase() ??
                              'V'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Nom boutique + vendeur */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-gray-900">
                              {r.shop?.name ??
                                (r.seller
                                  ? `${r.seller.first_name} ${r.seller.last_name}`
                                  : 'Vendeur')}
                            </p>
                            {r.shop?.name && r.seller && (
                              <span className="text-[10px] text-gray-400">
                                · {r.seller.first_name} {r.seller.last_name}
                              </span>
                            )}
                            {r.seller?.verification_status === 'verified' && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle2 size={10} /> vérifié
                              </span>
                            )}
                            {r.replied_at && (
                              <span className="text-[10px] text-gray-400">
                                · {timeAgo(r.replied_at)}
                              </span>
                            )}
                          </div>

                          {/* Texte de la réponse */}
                          <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
                            {r.reply_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setReplyTarget(r)}
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-white transition flex items-center gap-1"
                    style={{ background: ANKU.green }}
                  >
                    <Reply size={12} />
                    {r.reply_text ? 'Modifier la réponse' : 'Répondre'}
                  </button>

                  {r.is_flagged !== 1 && (
                    <button
                      type="button"
                      onClick={() => setReportTarget(r)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition flex items-center gap-1"
                    >
                      <Flag size={12} /> Signaler
                    </button>
                  )}

                  <span className="text-[11px] text-gray-400 ml-auto">
                    Avis #{r.id}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <ReplyModal
        review={replyTarget}
        onClose={() => setReplyTarget(null)}
        onSaved={fetchAll}
      />
      <ReportModal
        review={reportTarget}
        onClose={() => setReportTarget(null)}
        onSaved={fetchAll}
      />
    </div>
  )
}
