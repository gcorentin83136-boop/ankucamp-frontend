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
  Send,
  Loader,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  MapPin,
  Globe,
  Lock,
  ChevronDown,
  Play,
} from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import postsApi from '../service/api/posts.api'
import httpClient from '../service/api/httpClient'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import PostActionsMenu from '../components/common/PostActionsMenu'
import ReportModal from '../components/common/ReportModal'
import MediaUploader, { type MediaItem } from '../components/common/MediaUploader'
import ImageLightbox from '../components/common/ImageLightbox'
import EmojiPicker from '../components/common/EmojiPicker'
import CommentsSection from '../components/social/CommentsSection'
import ShareMenu from '../components/social/ShareMenu'
import type { Post, PostVisibility } from '../types/post'
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
      .map((m: any) => (typeof m === 'string' ? m : m.url))
      .filter(Boolean)
  }
  const raw: any = (p as any).media_urls
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function isVideoUrl(url: string): boolean {
  return (
    url.includes('/video/') ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov')
  )
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
// VISIBILITY DROPDOWN
// ============================================================
function VisibilityDropdown({
  value,
  onChange,
}: {
  value: PostVisibility
  onChange: (v: PostVisibility) => void
}) {
  const [open, setOpen] = useState(false)
  const options = [
    { value: 'public' as const, label: 'Public', icon: Globe, color: '#10b981' },
    { value: 'friends' as const, label: 'Amis', icon: Users, color: '#0ea5e9' },
    { value: 'private' as const, label: 'Privé', icon: Lock, color: '#6b7280' },
  ]
  const current = options.find((o) => o.value === value) ?? options[0]
  const Icon = current.icon

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition"
      >
        <Icon size={14} style={{ color: current.color }} />
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[150px]">
            {options.map((opt) => {
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={
                    'w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition flex items-center gap-2 ' +
                    (value === opt.value
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50')
                  }
                >
                  <OptIcon size={12} style={{ color: opt.color }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// MEDIA GRID (limité à 4 avec overlay +N)
// ============================================================
function MediaGrid({
  media,
  onOpenLightbox,
}: {
  media: string[]
  onOpenLightbox: (index: number) => void
}) {
  if (media.length === 0) return null

  const totalImages = media.filter((u) => !isVideoUrl(u))
  const hasMoreThan4 = media.length > 4
  const visible = media.slice(0, 4)
  const remaining = media.length - 4

  // 1 seul média : plein
  if (media.length === 1) {
    const url = media[0]
    if (isVideoUrl(url)) {
      return (
        <div className="px-4 pb-3">
          <video
            src={url}
            className="w-full rounded-xl bg-black max-h-[500px] object-contain"
            controls
            preload="metadata"
          />
        </div>
      )
    }
    return (
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => onOpenLightbox(0)}
          className="w-full rounded-xl overflow-hidden cursor-zoom-in"
        >
          <img
            src={url}
            alt=""
            className="w-full max-h-[500px] object-cover hover:opacity-95 transition"
            loading="lazy"
          />
        </button>
      </div>
    )
  }

  // 2+ médias : grille 2 cols (max 4 visibles)
  return (
    <div className="px-4 pb-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {visible.map((url, i) => {
          const isLast = i === 3 && hasMoreThan4
          const isVideo = isVideoUrl(url)
          const imageIdx = isVideo ? -1 : totalImages.indexOf(url)
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (isVideo) {
                  // Ouvre dans le lightbox ? Non → laisse le lecteur jouer
                  onOpenLightbox(i)
                } else {
                  onOpenLightbox(imageIdx >= 0 ? imageIdx : i)
                }
              }}
              className="relative w-full aspect-square overflow-hidden bg-gray-100"
            >
              {isVideo ? (
                <>
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play
                      size={32}
                      fill="#ffffff"
                      className="text-white"
                      strokeWidth={0}
                    />
                  </div>
                </>
              ) : (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover hover:opacity-95 transition"
                  loading="lazy"
                />
              )}

              {/* Overlay +N sur la 4ème */}
              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <span className="text-white font-extrabold text-2xl">
                    +{remaining}
                  </span>
                  <span className="text-white/80 text-[10px] font-bold mt-0.5">
                    Voir plus
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
// SIDEBAR — Ma boutique
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
  const [shareOpen, setShareOpen] = useState(false)

  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTargetType, setReportTargetType] =
    useState<ReportTargetType>('post')
  const [reportTargetId, setReportTargetId] = useState<number>(0)
  const [reportTargetLabel, setReportTargetLabel] = useState<string>('')

  const media = parseMedia(post)
  const imageOnlyUrls = media.filter((u) => !isVideoUrl(u))

  const toggleLike = async () => {
    try {
      const res = await postsApi.like(post.id)
      setLiked(res.liked)
      setLikesCount((c) => (res.liked ? c + 1 : Math.max(0, c - 1)))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
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
          <Link to={post.author?.username ? `/u/${post.author.username}` : '#'}>
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

          {post.visibility === 'private' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
              <Lock size={9} /> Privé
            </span>
          )}
          {post.visibility === 'friends' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              👥 Amis
            </span>
          )}

          <PostActionsMenu
            isOwn={isOwn}
            onReport={openReportPost}
            onDelete={isOwn ? deletePost : undefined}
          />
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {post.content}
            </p>
          </div>
        )}

        {/* Media — limité à 4 visibles + overlay +N */}
        <MediaGrid media={media} onOpenLightbox={setLightboxIndex} />

        {/* Compteurs */}
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

        {/* Actions */}
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
            onClick={() => setCommentsOpen((v) => !v)}
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

        {/* Commentaires */}
        {commentsOpen && (
          <CommentsSection
            postId={post.id}
            currentUserId={currentUserId}
            onCommentAdded={onPostUpdated}
            onReport={openReportComment}
            initialLimit={2}
          />
        )}
      </article>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={reportTargetType}
        targetId={reportTargetId}
        targetLabel={reportTargetLabel}
      />

      <ImageLightbox
        images={imageOnlyUrls}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={setLightboxIndex}
      />

      {shareOpen && (
        <ShareMenu
          postId={post.id}
          shareText={post.content?.slice(0, 100) ?? ''}
          onClose={() => setShareOpen(false)}
          onShared={onPostUpdated}
        />
      )}
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
  const [media, setMedia] = useState<MediaItem[]>([])
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
    if (!content.trim() && media.length === 0) {
      toast.error('Écris quelque chose ou ajoute un média')
      return
    }
    setPublishing(true)
    try {
      await postsApi.create({
        content: content.trim() || null,
        visibility,
        media_urls: media.map((m) => m.url),
      })
      toast.success('Post publié ✅')
      setContent('')
      setMedia([])
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
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <ProfileCard />
              <FriendsPreview />
              <MyShopPreview />
              <QuickLinks />
            </div>
          </aside>

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
            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-3">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm"
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
                  rows={content.length > 60 ? 5 : 2}
                  maxLength={5000}
                  className="flex-1 bg-transparent outline-none text-[15px] placeholder-gray-400 resize-none pt-2 leading-relaxed"
                />
              </div>

              {media.length > 0 && (
                <div className="px-4 pb-3">
                  <MediaUploader
                    media={media}
                    onChange={setMedia}
                    variant="preview"
                  />
                </div>
              )}

              <div className="px-3 py-2 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100 bg-gradient-to-t from-gray-50/50 to-white">
                <div className="flex items-center gap-0.5">
                  <MediaUploader
                    media={media}
                    onChange={setMedia}
                    variant="buttons"
                  />
                  <EmojiPicker
                    align="left"
                    onSelect={(emoji) => setContent((c) => c + emoji)}
                  />
                  <VisibilityDropdown
                    value={visibility}
                    onChange={setVisibility}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {content.length}/5000
                  </span>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={
                      publishing || (!content.trim() && media.length === 0)
                    }
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-xs font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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