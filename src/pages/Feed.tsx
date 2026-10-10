import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users,
  MessageSquare,
  Calendar,
  Newspaper,
  Store,
  Star,
  Image as ImageIcon,
  Send,
  Loader,
  Heart,
  MessageCircle,
  Share2,
  X,
  UserPlus,
  MapPin,
  Flag,
} from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import postsApi from '../service/api/posts.api'
import httpClient from '../service/api/httpClient'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import PostActionsMenu from '../components/common/PostActionsMenu'
import ReportModal from '../components/common/ReportModal'
import type { Post, PostComment, PostVisibility } from '../types/post'
import type { ReportTargetType } from '../types/report'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

// ============================================================
// HELPERS
// ============================================================
function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `il y a ${h} h`
    const j = Math.floor(h / 24)
    if (j < 7) return `il y a ${j} j`
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function authorName(p: Post): string {
  if (!p.author) return 'Utilisateur'
  return (
    `${p.author.first_name} ${p.author.last_name}`.trim() || p.author.username
  )
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
// RACCOURCIS
// ============================================================
const SHORTCUTS = [
  { to: '/friends', label: 'Mes amis', icon: Users, color: '#0ea5e9' },
  { to: '/messages', label: 'Messagerie', icon: MessageSquare, color: '#8b5cf6' },
  { to: '/events', label: 'Événements', icon: Calendar, color: '#ec4899' },
  { to: '/articles', label: 'Articles', icon: Newspaper, color: '#14b8a6' },
  { to: '/shops', label: 'Boutiques', icon: Store, color: '#6aa84f' },
  { to: '/dashboard/user/reviews', label: 'Mes avis', icon: Star, color: '#f59e0b' },
]

// ============================================================
// SIDEBAR — Ma carte
// ============================================================
function ProfileCard() {
  const auth = useAuthStore()
  const user = (auth as any)?.user

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: ANKU.greenDark }}
          >
            {(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            @{user?.username ?? 'utilisateur'}
          </p>
        </div>
      </div>
      <Link
        to="/profile"
        className="mt-3 block text-center rounded-full py-2 text-xs font-bold transition border-2"
        style={{
          background: '#ffffff',
          color: ANKU.greenDark,
          borderColor: ANKU.green,
        }}
      >
        Voir mon profil
      </Link>
    </div>
  )
}

// ============================================================
// SIDEBAR — Aperçu des amis
// ============================================================
function FriendsPreview() {
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await httpClient.get<{ friends: any[] }>(
          '/friends/me'
        )
        setFriends((data.friends ?? []).slice(0, 6))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Users size={14} style={{ color: ANKU.greenDark }} />
          Mes amis
        </p>
        <Link
          to="/friends"
          className="text-[10px] font-bold hover:underline"
          style={{ color: ANKU.greenDark }}
        >
          Voir tous
        </Link>
      </div>
      {loading ? (
        <Loader size={16} className="animate-spin text-gray-300 mx-auto" />
      ) : friends.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Aucun ami pour l'instant</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {friends.map((f) => {
            const u = f.friend ?? f.user ?? f
            return (
              <Link
                key={u.id}
                to={u.username ? `/u/${u.username}` : '#'}
                className="flex flex-col items-center gap-1 hover:opacity-80 transition"
                title={u.username}
              >
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: ANKU.greenDark }}
                  >
                    {(u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')}
                  </div>
                )}
                <p className="text-[9px] text-gray-600 truncate w-full text-center">
                  {u.first_name}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// SIDEBAR — Ma boutique (si pro)
// ============================================================
function MyShopPreview() {
  const auth = useAuthStore()
  const user = (auth as any)?.user
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<any>(null)

  const isPro = user?.role === 'professionnel'

  useEffect(() => {
    if (!isPro) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const { data } = await httpClient.get<{ shops: any[] }>('/shops/mine')
        setShop((data.shops ?? [])[0] ?? null)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [isPro])

  if (!isPro) return null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-3">
        <Store size={14} style={{ color: ANKU.greenDark }} />
        Ma boutique
      </p>
      {loading ? (
        <Loader size={16} className="animate-spin text-gray-300 mx-auto" />
      ) : !shop ? (
        <Link
          to="/become-pro"
          className="block text-center rounded-full py-2 text-xs font-bold text-white transition"
          style={{ background: ANKU.green }}
        >
          Créer ma boutique
        </Link>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt=""
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: ANKU.greenDark }}
              >
                {shop.name?.[0] ?? 'S'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {shop.name}
              </p>
              {shop.city && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={10} /> {shop.city}
                </p>
              )}
            </div>
          </div>
          <Link
            to={`/shops/${shop.id}`}
            className="mt-3 block text-center rounded-full py-2 text-xs font-bold text-white transition"
            style={{ background: ANKU.green }}
          >
            Voir ma boutique
          </Link>
        </>
      )}
    </div>
  )
}

// ============================================================
// SIDEBAR — Raccourcis rapides
// ============================================================
function QuickLinks() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900 mb-3">Raccourcis</p>
      <div className="space-y-1">
        {SHORTCUTS.slice(0, 5).map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.to}
              to={s.to}
              className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ background: s.color }}
              >
                <Icon size={13} />
              </div>
              {s.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANT : PostCard
// ============================================================
function PostCard({
  post,
  currentUserId,
  onPostUpdated,
}: {
  post: Post
  currentUserId: number | undefined
  onPostUpdated: () => void
}) {
  const isOwn = post.author_id === currentUserId

  const [liked, setLiked] = useState(!!post.is_liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [sharing, setSharing] = useState(false)

  // Signalement
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTargetType, setReportTargetType] =
    useState<ReportTargetType>('post')
  const [reportTargetId, setReportTargetId] = useState<number>(0)
  const [reportTargetLabel, setReportTargetLabel] = useState<string>('')

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

  const submitShare = async () => {
    setSharing(true)
    try {
      await postsApi.share(post.id, {
        share_comment: shareText.trim() || null,
        visibility: 'public',
      })
      toast.success('Post partagé ✅')
      setShareOpen(false)
      setShareText('')
      onPostUpdated()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSharing(false)
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

  const deleteComment = async (commentId: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    try {
      await postsApi.removeComment(post.id, commentId)
      setComments((c) => c.filter((x) => x.id !== commentId))
      onPostUpdated()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  // ==========================================================
  // Ouvrir signalement
  // ==========================================================
  const openReportPost = () => {
    setReportTargetType('post')
    setReportTargetId(post.id)
    setReportTargetLabel('ce post')
    setReportOpen(true)
  }

  const openReportComment = (commentId: number) => {
    setReportTargetType('comment')
    setReportTargetId(commentId)
    setReportTargetLabel('ce commentaire')
    setReportOpen(true)
  }

  return (
    <>
      <article className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <Link
            to={post.author?.username ? `/u/${post.author.username}` : '#'}
          >
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={authorName(post)}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: ANKU.greenDark }}
              >
                {(post.author?.first_name?.[0] ?? '') +
                  (post.author?.last_name?.[0] ?? '')}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={post.author?.username ? `/u/${post.author.username}` : '#'}
              className="text-sm font-bold text-gray-900 hover:underline"
            >
              {authorName(post)}
            </Link>
            <p className="text-xs text-gray-500">
              @{post.author?.username ?? 'utilisateur'} ·{' '}
              {formatDate(post.created_at)}
            </p>
          </div>

          {/* Badges visibilité */}
          {post.visibility === 'private' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Privé
            </span>
          )}
          {post.visibility === 'friends' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Amis
            </span>
          )}

          {/* Menu d'actions */}
          <PostActionsMenu
            isOwn={isOwn}
            onReport={openReportPost}
            onDelete={isOwn ? deletePost : undefined}
          />
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
              (liked
                ? 'text-red-500 bg-red-50'
                : 'text-gray-600 hover:bg-gray-50')
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
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            <Share2 size={14} />
            Partager
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
                {comments.map((c) => {
                  const isMyComment = c.author_id === currentUserId
                  return (
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-gray-900">
                            {c.author?.first_name} {c.author?.last_name}
                          </p>
                          <div className="flex items-center gap-1">
                            {isMyComment ? (
                              <button
                                type="button"
                                onClick={() => deleteComment(c.id)}
                                className="text-gray-400 hover:text-red-500"
                                title="Supprimer"
                              >
                                <X size={11} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReportComment(c.id)}
                                className="text-gray-400 hover:text-amber-500"
                                title="Signaler"
                              >
                                <Flag size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-line">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
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

        {shareOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">
                  Partager ce post
                </p>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                rows={3}
                placeholder="Ajoute un commentaire (optionnel)…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white resize-none"
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="flex-1 rounded-full py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitShare}
                  disabled={sharing}
                  className="flex-1 rounded-full py-2.5 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ background: ANKU.green }}
                >
                  {sharing ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Share2 size={14} />
                  )}
                  Partager
                </button>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Modal signalement */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={reportTargetType}
        targetId={reportTargetId}
        targetLabel={reportTargetLabel}
      />
    </>
  )
}

// ============================================================
// PAGE FEED
// ============================================================
export default function Feed() {
  const auth = useAuthStore()
  const user = (auth as any)?.user

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 10

  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [publishing, setPublishing] = useState(false)

  const loadPosts = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset
      try {
        const res = await postsApi.feed({ limit: LIMIT, offset: currentOffset })
        setPosts((prev) => (reset ? res.posts : [...prev, ...res.posts]))
        setOffset(currentOffset + res.posts.length)
        setHasMore(res.posts.length === LIMIT)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    },
    [offset]
  )

  useEffect(() => {
    loadPosts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error('Écris quelque chose')
      return
    }
    setPublishing(true)
    try {
      await postsApi.create({
        content: content.trim(),
        visibility,
        media_urls: [],
      })
      toast.success('Post publié ✅')
      setContent('')
      await loadPosts(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedShopsBackground />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <ProfileCard />
              <FriendsPreview />
              <MyShopPreview />
              <QuickLinks />
            </div>
          </aside>

          {/* CONTENU */}
          <main className="space-y-4 min-w-0">
            {/* Bannière */}
            <div
              className="rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, ${ANKU.greenPale}cc 0%, #ffffffcc 100%)`,
                border: `1px solid ${ANKU.green}22`,
              }}
            >
              <span
                className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-3"
                style={{ background: ANKU.green, color: '#fff' }}
              >
                ● RÉSEAU SOCIAL ENGAGÉ
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Bonjour {user?.first_name ?? 'toi'} 👋
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Explore, partage, échange — ta communauté t'attend.
              </p>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition border-2 lg:hidden"
                  style={{
                    background: '#ffffff',
                    color: ANKU.greenDark,
                    borderColor: ANKU.green,
                  }}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <Users size={14} />
                  )}
                  Mon profil
                </Link>
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition"
                  style={{ background: ANKU.green }}
                >
                  <MessageSquare size={14} />
                  Messagerie
                </Link>
              </div>
            </div>

            {/* Raccourcis mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-3">
              {SHORTCUTS.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.to}
                    to={s.to}
                    className="rounded-2xl border border-gray-200 bg-white p-3 flex flex-col items-center gap-2 hover:shadow-md transition"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ background: s.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800 text-center leading-tight">
                      {s.label}
                    </p>
                  </Link>
                )
              })}
            </div>

            {/* Publier */}
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
              <div className="flex items-start gap-3">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: ANKU.greenDark }}
                  >
                    {(user?.first_name?.[0] ?? '') +
                      (user?.last_name?.[0] ?? '')}
                  </div>
                )}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Quoi de neuf, ${user?.first_name ?? 'toi'} ?`}
                  rows={3}
                  maxLength={5000}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
                />
              </div>
              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-full transition"
                    title="Ajouter une photo (bientôt)"
                  >
                    <ImageIcon size={12} />
                    Photo
                  </button>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as PostVisibility)
                    }
                    className="text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-full transition cursor-pointer focus:outline-none"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="friends">👥 Amis</option>
                    <option value="private">🔒 Privé</option>
                  </select>
                </div>
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

            {/* Fil d'actu */}
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
                <Loader
                  size={24}
                  className="animate-spin text-gray-400 mx-auto"
                />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
                <Users size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-800">
                  Aucun post pour le moment
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ajoute des amis pour voir leurs posts ici !
                </p>
                <Link
                  to="/friends"
                  className="inline-flex items-center gap-2 mt-4 rounded-full px-4 py-2 text-xs font-bold text-white transition"
                  style={{ background: ANKU.green }}
                >
                  <UserPlus size={14} />
                  Trouver des amis
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    currentUserId={user?.id}
                    onPostUpdated={() => loadPosts(true)}
                  />
                ))}

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => loadPosts(false)}
                    className="w-full rounded-full py-3 text-xs font-bold transition border-2 bg-white/90 backdrop-blur"
                    style={{
                      color: ANKU.greenDark,
                      borderColor: ANKU.green,
                    }}
                  >
                    Voir plus
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}