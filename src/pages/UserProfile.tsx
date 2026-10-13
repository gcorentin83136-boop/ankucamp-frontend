import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  MapPin,
  Globe,
  Calendar,
  Users,
  Star,
  Store,
  Loader,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  Lock,
  UserPlus,
  UserCheck,
  Clock,
  Grid3x3,
  FileText,
  Flag,
  MessageSquare,
  Camera,
  Save,
  X,
  Pencil,
} from 'lucide-react'
import usersApi from '../service/api/users.api'
import postsApi from '../service/api/posts.api'
import httpClient from '../service/api/httpClient'
import { startDirectConversation } from '../service/api/messages.api'
import { useAuthStore } from '../context/AuthContext'
import blocksApi from '../service/api/blocks.api'
import uploadsApi from '../service/api/uploads.api'
import EmojiPicker from '../components/common/EmojiPicker'
import AppHeader from '../components/layout/AppHeader'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import PostActionsMenu from '../components/common/PostActionsMenu'
import UserActionsMenu from '../components/common/UserActionsMenu'
import ReportModal from '../components/common/ReportModal'
import ImageLightbox from '../components/common/ImageLightbox'
import CommentsSection from '../components/social/CommentsSection'
import ShareMenu from '../components/social/ShareMenu'
import MediaGrid from '../components/social/MediaGrid'
import type { User } from '../types/user'
import type { Post } from '../types/post'
import type { ReportTargetType } from '../types/report'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type Tab = 'posts' | 'gallery'
type FriendStatus = 'none' | 'pending' | 'accepted' | 'self' | 'loading'

const inputEditCls =
  'w-full rounded-xl border-2 border-emerald-100 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition'

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
        <div className="flex items-start gap-3 p-4">
          <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
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
          <PostActionsMenu
            isOwn={isOwn}
            onReport={openReportPost}
            onDelete={isOwn ? deletePost : undefined}
            onCopyLink={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/feed#post-${post.id}`
              )
              toast.success('Lien copié')
            }}
          />
        </div>

        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {post.content}
            </p>
          </div>
        )}

        <MediaGrid media={media} onOpenLightbox={setLightboxIndex} />

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
// PAGE : Profil public
// ============================================================
export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const auth = useAuthStore()
  const authUser = (auth as any)?.user
  const authUserId = authUser?.id

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    posts_count: 0,
    friends_count: 0,
    reviews_count: 0,
    average_rating: 0,
  })
  const [shop, setShop] = useState<any>(null)
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('loading')
  const [blockStatus, setBlockStatus] = useState<{
    is_blocked: boolean
    is_restricted: boolean
  }>({ is_blocked: false, is_restricted: false })
  const [blockBusy, setBlockBusy] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editAvatar, setEditAvatar] = useState<string | null>(null)
  const [editCover, setEditCover] = useState<string | null>(null)
  const [editBio, setEditBio] = useState('')
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  const [userReportOpen, setUserReportOpen] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!username) {
      toast.error('Utilisateur introuvable')
      navigate('/feed')
      return
    }
    try {
      const res = await usersApi.getByUsername(username)
      setUser(res.user)

      const [statsRes, shopRes, statusRes] = await Promise.allSettled([
        usersApi.getStats(res.user.id),
        httpClient.get<{ shops: any[] }>('/shops', {
          params: { owner_id: res.user.id },
        }),
        httpClient.get<{ status: string }>(`/friends/status/${res.user.id}`),
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.stats)
      }

      if (shopRes.status === 'fulfilled') {
        const shops = shopRes.value.data.shops ?? []
        const mine = shops.find((s: any) => s.owner_id === res.user.id)
        if (mine) setShop(mine)
      }

      if (res.user.id === authUserId) {
        setFriendStatus('self')
      } else if (statusRes.status === 'fulfilled') {
        const s = statusRes.value.data.status
        if (s === 'accepted' || s === 'friends' || s === 'accepted_pending') {
          setFriendStatus('accepted')
        } else if (s === 'pending' || s === 'pending_sent') {
          setFriendStatus('pending')
        } else {
          setFriendStatus('none')
        }
      } else {
        setFriendStatus('none')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Utilisateur introuvable')
      navigate('/feed')
    }
  }, [username, authUserId, navigate])

  const loadPosts = useCallback(async () => {
    if (!user) return
    setLoadingPosts(true)
    try {
      const res = await postsApi.byUser(user.id, { limit: 30, offset: 0 })
      setPosts(res.posts)
    } catch {
      // ignore
    } finally {
      setLoadingPosts(false)
    }
  }, [user])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await loadProfile()
      setLoading(false)
    })()
  }, [loadProfile])

  useEffect(() => {
    if (user) loadPosts()
  }, [user, loadPosts])

  useEffect(() => {
    if (!user) return
    const isMe = user.id === (useAuthStore.getState() as any)?.user?.id
    if (isMe) return
    ;(async () => {
      try {
        const s = await blocksApi.status(user.id)
        setBlockStatus(s)
      } catch {
        // ignore
      }
    })()
  }, [user])

  const handleSendFriendRequest = async () => {
    if (!user) return
    try {
      await httpClient.post(`/friends/request/${user.id}`)
      setFriendStatus('pending')
      toast.success("Demande d'ami envoyée ✅")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleBlock = async () => {
    if (!user || blockBusy) return
    if (
      !confirm(
        `Bloquer ${user.first_name} ? Tu ne verras plus ses posts et il ne pourra plus t'écrire.`
      )
    )
      return
    setBlockBusy(true)
    try {
      await blocksApi.block(user.id)
      setBlockStatus((s) => ({ ...s, is_blocked: true, is_restricted: false }))
      toast.success('Utilisateur bloqué')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setBlockBusy(false)
    }
  }

  const handleUnblock = async () => {
    if (!user || blockBusy) return
    setBlockBusy(true)
    try {
      await blocksApi.unblock(user.id)
      setBlockStatus((s) => ({ ...s, is_blocked: false }))
      toast.success('Utilisateur débloqué')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setBlockBusy(false)
    }
  }

  const handleRestrict = async () => {
    if (!user || blockBusy) return
    setBlockBusy(true)
    try {
      await blocksApi.restrict(user.id)
      setBlockStatus((s) => ({ ...s, is_restricted: true }))
      toast.success('Utilisateur restreint')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setBlockBusy(false)
    }
  }

  const handleUnrestrict = async () => {
    if (!user || blockBusy) return
    setBlockBusy(true)
    try {
      await blocksApi.unrestrict(user.id)
      setBlockStatus((s) => ({ ...s, is_restricted: false }))
      toast.success('Restriction levée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setBlockBusy(false)
    }
  }

  const handleMessage = async () => {
    if (!user) return
    try {
      const convId = await startDirectConversation(
        user.id,
        `Bonjour ${user.first_name} !`
      )
      navigate(`/messages/${convId}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  // ============= HANDLERS MODE ÉDITION =============
  const handleStartEdit = () => {
    if (!user) return
    setEditAvatar(user.avatar_url ?? null)
    setEditCover(user.cover_url ?? null)
    setEditBio(user.bio ?? '')
    setEditFirstName(user.first_name ?? '')
    setEditLastName(user.last_name ?? '')
    setEditCity(user.city ?? '')
    setEditCountry(user.country ?? '')
    setEditWebsite(user.website ?? '')
    setEditLocation(user.location ?? '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditAvatar(null)
    setEditCover(null)
    setEditBio('')
    setEditFirstName('')
    setEditLastName('')
    setEditCity('')
    setEditCountry('')
    setEditWebsite('')
    setEditLocation('')
  }

  const handleAvatarEditUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 Mo)')
      return
    }
    setUploadingAvatar(true)
    try {
      const res = await uploadsApi.uploadAvatar(file)
      setEditAvatar(res.url)
      toast.success('Photo de profil prête ✨')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleCoverEditUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image trop lourde (max 10 Mo)')
      return
    }
    setUploadingCover(true)
    try {
      const res = await uploadsApi.uploadCover(file)
      setEditCover(res.url)
      toast.success('Couverture prête ✨')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error('Prénom et nom sont requis')
      return
    }
    setSavingProfile(true)
    try {
      const payload: any = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        avatar_url: editAvatar,
        cover_url: editCover,
        bio: editBio.trim() || null,
        city: editCity.trim() || null,
        country: editCountry.trim() || null,
        website: editWebsite.trim() || null,
        location: editLocation.trim() || null,
      }
      const res = await usersApi.updateMe(payload)
      setUser(res.user as any)
      const authState = useAuthStore.getState()
      if (authState.token) {
        localStorage.setItem('anku_user', JSON.stringify(res.user))
        authState.setUser(res.user as any, authState.token)
      }
      toast.success('Profil mis à jour 🎉')
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSavingProfile(false)
    }
  }

  const galleryItems = posts.flatMap((p) => parseMedia(p)).filter(Boolean)

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AppHeader />
        <AnimatedShopsBackground />
        <div className="relative max-w-5xl mx-auto py-20 text-center">
          <Loader size={28} className="animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Chargement profil…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <AppHeader />
        <AnimatedShopsBackground />
        <div className="relative max-w-3xl mx-auto py-20 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-900">
            Utilisateur introuvable
          </p>
        </div>
      </div>
    )
  }

  const isPro = user.role === 'professionnel'
  const isVerified = user.verification_status === 'verified'
  const isMe = user.id === authUserId

  return (
    <div className="relative min-h-screen">
      <AppHeader />
      <AnimatedShopsBackground />

      <div className="relative max-w-5xl mx-auto py-6 px-3 sm:px-5 space-y-5">
        {/* Bannière + avatar */}
        <div className="rounded-3xl overflow-hidden border border-white/60 shadow-sm bg-white/95 backdrop-blur">
          {/* COVER */}
          <div
            className={
              'h-40 sm:h-52 relative group ' +
              (isEditing ? 'cursor-pointer' : '')
            }
            style={{
              background: (isEditing ? editCover : user.cover_url)
                ? undefined
                : `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
            }}
            onClick={
              isEditing && !uploadingCover
                ? () => coverInputRef.current?.click()
                : undefined
            }
          >
            {(isEditing ? editCover : user.cover_url) && (
              <img
                src={(isEditing ? editCover : user.cover_url) as string}
                alt=""
                className="w-full h-full object-cover"
              />
            )}

            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-gray-800 shadow-lg">
                  {uploadingCover ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                  {uploadingCover
                    ? 'Upload…'
                    : editCover
                    ? 'Changer la couverture'
                    : 'Ajouter une couverture'}
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

            {!isMe && !isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setUserReportOpen(true)
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 hover:bg-white text-gray-500 hover:text-red-600 shadow-md transition z-10"
                title="Signaler ce profil"
              >
                <Flag size={14} />
              </button>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverEditUpload}
            />
          </div>

          <div className="px-5 sm:px-7 pb-5 pt-3 relative">
            {/* AVATAR */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16">
              <div
                className={
                  'relative group ' + (isEditing ? 'cursor-pointer' : '')
                }
                onClick={
                  isEditing && !uploadingAvatar
                    ? () => avatarInputRef.current?.click()
                    : undefined
                }
              >
                {(isEditing ? editAvatar : user.avatar_url) ? (
                  <img
                    src={(isEditing ? editAvatar : user.avatar_url) as string}
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
                    {(user.first_name?.[0] ?? '') +
                      (user.last_name?.[0] ?? '')}
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 rounded-3xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    {uploadingAvatar ? (
                      <Loader size={20} className="animate-spin text-white" />
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarEditUpload}
              />
            </div>

            <div className="mt-4">
              {/* Nom + badges */}
              {isEditing && isMe ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      maxLength={100}
                      placeholder="Ton prénom"
                      className={inputEditCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      maxLength={100}
                      placeholder="Ton nom"
                      className={inputEditCls}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {user.first_name} {user.last_name}
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
              )}

              <p className="text-sm text-gray-500 mt-1">
                @{user.username}
              </p>

              {isEditing && isMe && (
                <div className="mt-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Pencil size={12} />
                  Mode édition actif — modifie tes infos, ta bio, ta photo ou
                  ta couverture
                </div>
              )}

              {/* Bio */}
              {isEditing && isMe ? (
                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Bio
                  </label>
                  <div className="relative rounded-2xl border-2 border-emerald-100 bg-white focus-within:border-emerald-400 transition overflow-hidden">
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Parle un peu de toi…"
                      className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <EmojiPicker
                        align="left"
                        onSelect={(emoji) => setEditBio((b) => b + emoji)}
                      />
                    </div>
                    <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 font-semibold">
                      {editBio.length}/500
                    </span>
                  </div>
                </div>
              ) : user.bio ? (
                <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                  {user.bio}
                </p>
              ) : isMe ? (
                <p className="text-sm text-gray-400 italic mt-3">
                  Ajoute une bio pour te présenter…
                </p>
              ) : null}

              {/* Ville / site / membre depuis */}
              {isEditing && isMe ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin size={10} /> Ville
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      maxLength={100}
                      placeholder="Ex : Lyon"
                      className={inputEditCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Pays
                    </label>
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      maxLength={100}
                      placeholder="Ex : France"
                      className={inputEditCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
                      <Globe size={10} /> Site web
                    </label>
                    <input
                      type="url"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      maxLength={255}
                      placeholder="https://..."
                      className={inputEditCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Localisation libre
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      maxLength={255}
                      placeholder="Ex : Région lyonnaise"
                      className={inputEditCls}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                  {user.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {user.city}
                      {user.country ? `, ${user.country}` : ''}
                    </span>
                  )}
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-emerald-600 transition"
                    >
                      <Globe size={12} />{' '}
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar size={12} /> Membre depuis{' '}
                    {memberSince(user.created_at)}
                  </span>
                </div>
              )}

              {isMe && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-md hover:shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
                      }}
                    >
                      <Pencil size={14} />
                      Modifier mon profil
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={
                          savingProfile ||
                          uploadingAvatar ||
                          uploadingCover
                        }
                        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-md hover:shadow-lg disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
                        }}
                      >
                        {savingProfile ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        <X size={14} />
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              )}

              {!isMe && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {friendStatus === 'accepted' && (
                    <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold bg-emerald-100 text-emerald-700 border-2 border-emerald-200">
                      <UserCheck size={14} /> Amis
                    </span>
                  )}
                  {friendStatus === 'pending' && (
                    <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold bg-amber-100 text-amber-700 border-2 border-amber-200">
                      <Clock size={14} /> Demande envoyée
                    </span>
                  )}
                  {friendStatus === 'none' && (
                    <button
                      type="button"
                      onClick={handleSendFriendRequest}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition"
                      style={{ background: ANKU.green }}
                    >
                      <UserPlus size={14} /> Ajouter en ami
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleMessage}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition border-2"
                    style={{
                      background: '#ffffff',
                      color: ANKU.greenDark,
                      borderColor: ANKU.green,
                    }}
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                  {shop && (
                    <Link
                      to={`/shops/${shop.id}`}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition"
                      style={{ background: ANKU.green }}
                    >
                      <Store size={14} /> Sa boutique
                    </Link>
                  )}

                  <div className="flex items-center gap-0.5">
                    <UserActionsMenu
                      isBlocked={blockStatus.is_blocked}
                      isRestricted={blockStatus.is_restricted}
                      busy={blockBusy}
                      onBlock={handleBlock}
                      onUnblock={handleUnblock}
                      onRestrict={handleRestrict}
                      onUnrestrict={handleUnrestrict}
                      onReport={() => setUserReportOpen(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <FileText size={12} /> Posts
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.posts_count}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <Users size={12} /> Amis
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.friends_count}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <Star size={12} /> Avis
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {stats.reviews_count}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <Star size={12} /> Note
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {Number(stats.average_rating ?? 0).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Onglets */}
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
            Mur ({posts.length})
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

        {tab === 'posts' ? (
          loadingPosts ? (
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
              <Loader
                size={24}
                className="animate-spin text-gray-400 mx-auto"
              />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-800">
                Aucun post pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  currentUserId={authUserId}
                  onPostUpdated={loadPosts}
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
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {galleryItems.map((url, i) =>
              isVideoUrl(url) ? (
                <video
                  key={i}
                  src={url}
                  className="w-full aspect-square object-cover rounded-xl border border-gray-200 bg-black"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-xl border border-gray-200"
                  loading="lazy"
                />
              )
            )}
          </div>
        )}
      </div>

      {user && (
        <ReportModal
          open={userReportOpen}
          onClose={() => setUserReportOpen(false)}
          targetType="user"
          targetId={user.id}
          targetLabel={`le profil de @${user.username}`}
        />
      )}
    </div>
  )
}