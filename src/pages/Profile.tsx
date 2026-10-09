import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  MapPin,
  Globe,
  Calendar,
  Edit3,
  Users,
  Star,
  Store,
  Loader,
  Send,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  X,
  CheckCircle2,
  Lock,
  Grid3x3,
  FileText,
} from 'lucide-react'
import usersApi from '../service/api/users.api'
import postsApi from '../service/api/posts.api'
import httpClient from '../service/api/httpClient'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import type { UserMe } from '../types/user'
import type { Post, PostComment } from '../types/post'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type Tab = 'posts' | 'gallery'

// ============================================================
// HELPERS
// ============================================================
function formatDate(iso: string | null | undefined, short = false) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    if (short) {
      const diff = Date.now() - d.getTime()
      const min = Math.floor(diff / 60000)
      if (min < 1) return "à l'instant"
      if (min < 60) return `${min} min`
      const h = Math.floor(min / 60)
      if (h < 24) return `${h} h`
      const j = Math.floor(h / 24)
      if (j < 7) return `${j} j`
    }
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function memberSince(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function parseMedia(p: Post): string[] {
  if (p.media && Array.isArray(p.media)) {
    return p.media
      .map((m) => (typeof m === 'string' ? m : m.url))
      .filter(Boolean)
  }
  if (p.media_urls) {
    try {
      const arr = JSON.parse(p.media_urls)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
  return []
}

// ============================================================
// COMPOSANT : PostCard (simplifié)
// ============================================================
function PostCard({
  post,
  onPostUpdated,
  isOwnProfile,
}: {
  post: Post
  onPostUpdated: () => void
  isOwnProfile: boolean
}) {
  const [liked, setLiked] = useState(!!post.is_liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const media = parseMedia(post)

  const toggleLike = async () => {
    try {
      const res = await postsApi.like(post.id)
      setLiked(res.liked)
      setLikesCount((c) => (res.liked ? c + 1 : Math.max(0, c - 1)))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const openComments = async () => {
    setCommentsOpen(true)
    if (comments.length > 0) return
    setLoadingComments(true)
    try {
      const res = await postsApi.comments(post.id, { limit: 50 })
      setComments(res.comments)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoadingComments(false)
    }
  }

  const submitComment = async () => {
    if (!commentInput.trim()) return
    setSendingComment(true)
    try {
      const res = await postsApi.addComment(post.id, commentInput.trim())
      setComments((c) => [...c, res.comment])
      setCommentInput('')
      onPostUpdated()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSendingComment(false)
    }
  }

  const deletePost = async () => {
    if (!confirm('Supprimer ce post ?')) return
    try {
      await postsApi.remove(post.id)
      toast.success('Post supprimé')
      onPostUpdated()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">
            {formatDate(post.created_at, true)}
            {post.visibility === 'private' && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-gray-500">
                <Lock size={9} /> Privé
              </span>
            )}
            {post.visibility === 'friends' && (
              <span className="ml-2 text-[10px] font-bold text-blue-600">
                👥 Amis
              </span>
            )}
          </p>
        </div>
        {isOwnProfile && (
          <button
            type="button"
            onClick={deletePost}
            className="text-gray-400 hover:text-red-500 transition"
            title="Supprimer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-800 whitespace-pre-line">
            {post.content}
          </p>
        </div>
      )}

      {media.length > 0 && (
        <div
          className={
            'grid gap-1 px-4 pb-3 ' +
            (media.length === 1 ? 'grid-cols-1' : 'grid-cols-2')
          }
        >
          {media.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-full aspect-video object-cover rounded-lg"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <div className="px-4 py-2 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Heart
            size={12}
            className={liked ? 'fill-red-500 text-red-500' : ''}
          />
          {likesCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={12} />
          {post.comments_count ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <Share2 size={12} />
          {post.shares_count ?? 0}
        </span>
      </div>

      <div className="px-2 py-1 flex border-t border-gray-100">
        <button
          type="button"
          onClick={toggleLike}
          className={
            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ' +
            (liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-50')
          }
        >
          <Heart size={14} className={liked ? 'fill-red-500' : ''} />
          J'aime
        </button>
        <button
          type="button"
          onClick={openComments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition"
        >
          <MessageCircle size={14} />
          Commenter
        </button>
      </div>

      {commentsOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
          {loadingComments ? (
            <Loader size={18} className="animate-spin text-gray-400 mx-auto" />
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center">
              Aucun commentaire
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  {c.author?.avatar_url ? (
                    <img
                      src={c.author.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: ANKU.greenDark }}
                    >
                      {(c.author?.first_name?.[0] ?? '') +
                        (c.author?.last_name?.[0] ?? '')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <p className="text-xs font-bold text-gray-900">
                      {c.author?.first_name} {c.author?.last_name}
                    </p>
                    <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-line">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Écris un commentaire…"
              className="flex-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:border-emerald-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitComment()
              }}
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={sendingComment || !commentInput.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {sendingComment ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ============================================================
// PAGE PROFIL
// ============================================================
export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<UserMe | null>(null)
  const [stats, setStats] = useState({
    posts_count: 0,
    friends_count: 0,
    reviews_count: 0,
    average_rating: 0,
  })
  const [shop, setShop] = useState<any>(null)

  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Publier
  const [content, setContent] = useState('')
  const [publishToFeed, setPublishToFeed] = useState(true)
  const [publishing, setPublishing] = useState(false)

  // ==========================================================
  // Charger profil
  // ==========================================================
  const loadProfile = useCallback(async () => {
    try {
      const res = await usersApi.getMe()
      setMe(res.user)

      const [statsRes, shopRes] = await Promise.allSettled([
        usersApi.getStats(res.user.id),
        httpClient.get<{ shops: any[] }>('/shops/mine'),
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.stats)
      }
      if (
        shopRes.status === 'fulfilled' &&
        (shopRes.value.data.shops ?? []).length > 0
      ) {
        setShop(shopRes.value.data.shops[0])
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    }
  }, [])

  // ==========================================================
  // Charger mes posts
  // ==========================================================
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true)
    try {
      const res = await postsApi.mine({ limit: 30, offset: 0 })
      setPosts(res.posts)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoadingPosts(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await Promise.all([loadProfile(), loadPosts()])
      setLoading(false)
    })()
  }, [loadProfile, loadPosts])

  // ==========================================================
  // Publier
  // ==========================================================
  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error('Écris quelque chose')
      return
    }
    setPublishing(true)
    try {
      await postsApi.create({
        content: content.trim(),
        // Option A : la checkbox pilote la visibilité
        visibility: publishToFeed ? 'public' : 'friends',
        media_urls: [],
      })
      toast.success(
        publishToFeed
          ? 'Publié sur ton mur et le fil ✅'
          : 'Publié sur ton mur (visible par tes amis) ✅'
      )
      setContent('')
      await loadPosts()
      await loadProfile()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setPublishing(false)
    }
  }

  // Galerie : médias extraits des posts
  const galleryItems = posts
    .flatMap((p) => parseMedia(p))
    .filter(Boolean)

  // ==========================================================
  // Rendu : chargement
  // ==========================================================
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />
        <div className="relative max-w-5xl mx-auto py-20 text-center">
          <Loader size={28} className="animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Chargement profil…</p>
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="relative min-h-screen">
        <AnimatedShopsBackground />
        <div className="relative max-w-3xl mx-auto py-20 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-900">Profil introuvable</p>
        </div>
      </div>
    )
  }

  const isPro = me.role === 'professionnel'
  const isVerified = me.verification_status === 'verified'

  return (
    <div className="relative min-h-screen">
      <AnimatedShopsBackground />

      <div className="relative max-w-5xl mx-auto py-6 px-3 sm:px-5 space-y-5">
        {/* ====================================================
            Bannière + avatar
           ==================================================== */}
        <div className="rounded-3xl overflow-hidden border border-white/60 shadow-sm bg-white/95 backdrop-blur">
          <div
            className="h-40 sm:h-52 relative"
            style={{
              background: me.cover_url
                ? undefined
                : `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
            }}
          >
            {me.cover_url && (
              <img
                src={me.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="px-5 sm:px-7 pb-5 pt-3 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16">
              {/* Avatar */}
              <div className="flex items-end gap-4">
                {me.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt=""
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-3xl font-extrabold text-white border-4 border-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, #8bc34a 0%, ${ANKU.greenDark} 100%)`,
                    }}
                  >
                    {(me.first_name?.[0] ?? '') + (me.last_name?.[0] ?? '')}
                  </div>
                )}
              </div>
            </div>

            {/* Infos */}
            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {me.first_name} {me.last_name}
                </h1>
                {isVerified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Vérifié
                  </span>
                )}
                {isPro && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: ANKU.green }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">@{me.username}</p>

              {/* Bio + infos */}
              {me.bio && (
                <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                  {me.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                {me.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {me.city}
                    {me.country ? `, ${me.country}` : ''}
                  </span>
                )}
                {me.website && (
                  <a
                    href={me.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-emerald-600 transition"
                  >
                    <Globe size={12} /> {me.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-1 text-gray-500">
                  <Calendar size={12} /> Membre depuis{' '}
                  {memberSince(me.created_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition border-2"
                  style={{
                    background: '#ffffff',
                    color: ANKU.greenDark,
                    borderColor: ANKU.green,
                  }}
                >
                  <Edit3 size={14} /> Modifier le profil
                </Link>
                <Link
                  to="/friends"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition border-2"
                  style={{
                    background: '#ffffff',
                    color: ANKU.greenDark,
                    borderColor: ANKU.green,
                  }}
                >
                  <Users size={14} /> Mes amis
                </Link>
                {shop && (
                  <Link
                    to={`/shops/${shop.id}`}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition"
                    style={{ background: ANKU.green }}
                  >
                    <Store size={14} /> Ma boutique
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            Compteurs
           ==================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <FileText size={12} /> Posts
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.posts_count}
            </p>
          </div>
          <Link
            to="/friends"
            className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4 hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <Users size={12} /> Amis
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.friends_count}
            </p>
          </Link>
          <Link
            to="/dashboard/user/reviews"
            className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4 hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <Star size={12} /> Avis
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.reviews_count}
            </p>
          </Link>
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <Star size={12} /> Note
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {Number(stats.average_rating ?? 0).toFixed(1)}
            </p>
          </div>
        </div>

        {/* ====================================================
            Publier sur mon mur
           ==================================================== */}
        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
          <div className="flex items-start gap-3">
            {me.avatar_url ? (
              <img
                src={me.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: ANKU.greenDark }}
              >
                {(me.first_name?.[0] ?? '') + (me.last_name?.[0] ?? '')}
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Quoi de neuf, ${me.first_name} ?`}
              rows={3}
              maxLength={5000}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
            />
          </div>

          {/* Options */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={publishToFeed}
                onChange={(e) => setPublishToFeed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              🌍 Publier aussi sur le fil d'actualité
            </label>
            {!publishToFeed && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                <Users size={10} /> Visible par tes amis
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-full transition"
              title="Ajouter une photo (bientôt)"
            >
              <ImageIcon size={12} />
              Photo
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || !content.trim()}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {publishing ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Publier
            </button>
          </div>
        </div>

        {/* ====================================================
            Onglets Posts / Galerie
           ==================================================== */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('posts')}
            className={
              'px-4 py-2 text-xs font-bold transition border-b-2 ' +
              (tab === 'posts'
                ? 'text-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-900')
            }
            style={{
              borderColor: tab === 'posts' ? ANKU.green : 'transparent',
            }}
          >
            <FileText size={12} className="inline mr-1" />
            Mon mur ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('gallery')}
            className={
              'px-4 py-2 text-xs font-bold transition border-b-2 ' +
              (tab === 'gallery'
                ? 'text-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-900')
            }
            style={{
              borderColor: tab === 'gallery' ? ANKU.green : 'transparent',
            }}
          >
            <Grid3x3 size={12} className="inline mr-1" />
            Galerie ({galleryItems.length})
          </button>
        </div>

        {/* ====================================================
            Contenu selon l'onglet
           ==================================================== */}
        {tab === 'posts' ? (
          loadingPosts ? (
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
              <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-800">
                Aucun post pour le moment
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Publie ton premier message ci-dessus !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onPostUpdated={loadPosts}
                  isOwnProfile
                />
              ))}
            </div>
          )
        ) : loadingPosts ? (
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
            <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
            <Grid3x3 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-800">
              Galerie vide pour le moment
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Ajoute des photos à tes posts pour les voir ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {galleryItems.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full aspect-square object-cover rounded-xl border border-gray-200"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}