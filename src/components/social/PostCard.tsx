import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Calendar, Newspaper, Heart, MessageCircle, Share2, MapPin, Lock, Play, Clock, Video
} from 'lucide-react'
import postsApi from '../../service/api/posts.api'
import blocksApi from '../../service/api/blocks.api'
import PostActionsMenu from '../common/PostActionsMenu'
import ReportModal from '../common/ReportModal'
import ImageLightbox from '../common/ImageLightbox'
import CommentsSection from './CommentsSection'
import ShareMenu from './ShareMenu'
import CreateReelModal from '../reels/CreateReelModal'
import type { Post } from '../../types/post'
import type { ReportTargetType } from '../../types/report'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

export function formatDate(iso: string) {
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
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}
export function authorName(p: Post): string { if (!p.author) return 'Utilisateur'; return `${p.author.first_name} ${p.author.last_name}`.trim() || p.author.username }
export function parseMedia(p: Post): string[] {
  if (p.media && Array.isArray(p.media)) return p.media.map((m: any) => (typeof m === 'string' ? m : m.url)).filter(Boolean)
  const raw: any = (p as any).media_urls
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}
export function isVideoUrl(url: string): boolean { return url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') }

function MediaGrid({ media, onOpenLightbox }: { media: string[], onOpenLightbox: (i: number) => void }) {
  if (media.length === 0) return null
  const hasMoreThan4 = media.length > 4
  const visible = media.slice(0, 4)
  const remaining = media.length - 4
  if (media.length === 1) {
    const url = media[0]
    return (
      <div className="px-4 pb-3">
        {isVideoUrl(url) ? <video src={url} className="w-full rounded-xl bg-black max-h-[500px] object-contain" controls preload="metadata" /> : <button type="button" onClick={() => onOpenLightbox(0)} className="w-full rounded-xl overflow-hidden cursor-zoom-in"><img src={url} alt="" className="w-full max-h-[500px] object-cover hover:opacity-95 transition" loading="lazy" /></button>}
      </div>
    )
  }
  return (
    <div className="px-4 pb-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {visible.map((url, i) => {
          const isLast = i === 3 && hasMoreThan4
          const isVideo = isVideoUrl(url)
          return (
            <button key={i} type="button" onClick={() => onOpenLightbox(i)} className="relative w-full aspect-square overflow-hidden bg-gray-100">
              {isVideo ? <><video src={url} className="w-full h-full object-cover" preload="metadata" muted /><div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play size={32} fill="#fff" className="text-white" strokeWidth={0} /></div></> : <img src={url} alt="" className="w-full h-full object-cover hover:opacity-95 transition" loading="lazy" />}
              {isLast && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"><span className="text-white font-extrabold text-2xl">+{remaining}</span><span className="text-white/80 text-[10px] font-bold mt-0.5">Voir plus</span></div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PostCard({
  post,
  currentUserId,
  onPostUpdated,
  onChangeVisibility,
  isModal = false,
  onSeeAllComments,
  highlightCommentId,
}: {
  post: Post
  currentUserId: number | undefined
  onPostUpdated: () => void
  onChangeVisibility?: () => void
  isModal?: boolean
  onSeeAllComments?: () => void
  highlightCommentId?: number | null
}) {
  const isOwn = post.author_id === currentUserId
  const [liked, setLiked] = useState(!!post.is_liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [shareOpen, setShareOpen] = useState(false)
  const [showFullText, setShowFullText] = useState(isModal)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTargetType, setReportTargetType] = useState<ReportTargetType>('post')
  const [reportTargetId, setReportTargetId] = useState<number>(0)
  const [reportTargetLabel, setReportTargetLabel] = useState<string>('')
  
  // 🆕 État pour la modale Live
  const [showReelModal, setShowReelModal] = useState(false)

  const media = parseMedia(post)
  const sharedEvent = (post as any).shared_event
  const sharedArticle = (post as any).shared_article
  const sharedReel = (post as any).shared_reel
  const MAX_CHARS = 300
  const contentStr = post.content || ''
  const isLongText = contentStr.length > MAX_CHARS && !isModal
  const displayContent = isLongText && !showFullText ? contentStr.slice(0, MAX_CHARS) + '...' : contentStr

  const toggleLike = async () => { try { const res = await postsApi.like(post.id); setLiked(res.liked); setLikesCount((c) => (res.liked ? c + 1 : Math.max(0, c - 1))) } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur') } }
  const deletePost = async () => { if (!confirm('Supprimer ce post ?')) return; try { await postsApi.remove(post.id); toast.success('Post supprimé'); onPostUpdated() } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur') } }
  const handleBlockAuthor = async () => { if (!post.author_id) return; if (!confirm(`Bloquer ${authorName(post)} ?`)) return; try { await blocksApi.block(post.author_id); toast.success('Bloqué'); onPostUpdated() } catch {} }
  const handleRestrictAuthor = async () => { if (!post.author_id) return; try { await blocksApi.restrict(post.author_id); toast.success('Restreint'); onPostUpdated() } catch {} }
  const openReportPost = () => { setReportTargetType('post'); setReportTargetId(post.id); setReportTargetLabel('ce post'); setReportOpen(true) }
  const openReportComment = (commentId: number) => { setReportTargetType('comment'); setReportTargetId(commentId); setReportTargetLabel('ce commentaire'); setReportOpen(true) }

  return (
    <>
      <article id={`post-${post.id}`} className={`rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-sm overflow-hidden transition-all duration-500 ${isModal ? 'border-none shadow-none bg-transparent' : ''}`}>
        <div className="flex items-start gap-3 p-4">
          <Link to={post.author?.username ? `/u/${post.author.username}` : '#'}>
            {post.author?.avatar_url ? <img src={post.author.avatar_url} alt={authorName(post)} className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: ANKU.greenDark }}>{(post.author?.first_name?.[0] ?? '') + (post.author?.last_name?.[0] ?? '')}</div>}
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={post.author?.username ? `/u/${post.author.username}` : '#'} className="text-sm font-bold text-gray-900 hover:underline">{authorName(post)}</Link>
            <p className="text-xs text-gray-500">@{post.author?.username ?? 'utilisateur'} · {formatDate(post.created_at)}</p>
          </div>
          {post.visibility === 'private' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><Lock size={9} /> Privé</span>}
          {post.visibility === 'friends' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">👥 Amis</span>}
          <PostActionsMenu isOwn={isOwn} onReport={openReportPost} onDelete={isOwn ? deletePost : undefined} onBlock={!isOwn ? handleBlockAuthor : undefined} onRestrict={!isOwn ? handleRestrictAuthor : undefined} onChangeVisibility={isOwn ? onChangeVisibility : undefined} />
        </div>
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-800 whitespace-pre-line break-words">{displayContent}</p>
            {isLongText && <button type="button" onClick={() => setShowFullText(true)} className="text-xs font-bold mt-1 hover:underline" style={{ color: ANKU.green }}>Voir plus</button>}
          </div>
        )}
        {sharedEvent && (
          <div className="px-4 pb-3">
            <Link to={`/events/${sharedEvent.id}`} className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-gray-200 overflow-hidden hover:bg-gray-50 transition p-3 bg-gray-50/50">
              {sharedEvent.cover_url && <img src={sharedEvent.cover_url} alt="" className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg shrink-0" />}
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1"><Calendar size={10} /> Événement partagé</p>
                <p className="text-sm font-bold text-gray-900 truncate">{sharedEvent.title}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12} /> {new Date(sharedEvent.start_at).toLocaleDateString('fr-FR')}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> {sharedEvent.city || 'Lieu non précisé'}</p>
              </div>
            </Link>
          </div>
        )}
        {sharedArticle && (
          <div className="px-4 pb-3">
            <Link to={`/articles/${sharedArticle.slug}`} className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-gray-200 overflow-hidden hover:bg-gray-50 transition p-3 bg-gray-50/50">
              {sharedArticle.cover_url && <img src={sharedArticle.cover_url} alt="" className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg shrink-0" />}
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1"><Newspaper size={10} /> Article partagé</p>
                <p className="text-sm font-bold text-gray-900 truncate">{sharedArticle.title}</p>
                {sharedArticle.excerpt && <p className="text-xs text-gray-500 truncate mt-1">{sharedArticle.excerpt}</p>}
              </div>
            </Link>
          </div>
        )}
        
        {/* 🆕 BLOC REEL PARTAGÉ (Anku Live) */}
        {sharedReel && (
          <div className="px-4 pb-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-gray-200 overflow-hidden hover:bg-gray-50 transition p-3 bg-gray-50/50">
              <div className="relative w-full sm:w-24 h-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-black">
                {sharedReel.media_type === 'video' ? (
                  <video src={sharedReel.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={sharedReel.media_url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Video size={24} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1"><Video size={10} /> Anku Live partagé</p>
                <p className="text-sm font-bold text-gray-900 truncate">@{sharedReel.author?.username}</p>
                {sharedReel.caption && <p className="text-xs text-gray-500 truncate mt-1">{sharedReel.caption}</p>}
              </div>
            </div>
          </div>
        )}

        <MediaGrid media={media} onOpenLightbox={setLightboxIndex} />
        <div className="px-4 py-2 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100">
          <span className="flex items-center gap-1"><Heart size={12} className={liked ? 'fill-red-500 text-red-500' : ''} />{likesCount}</span>
          <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comments_count ?? 0}</span>
          <span className="flex items-center gap-1"><Share2 size={12} />{post.shares_count ?? 0}</span>
        </div>
        <div className="px-2 py-1 flex border-t border-gray-100">
          <button type="button" onClick={toggleLike} className={'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ' + (liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-50')}><Heart size={14} className={liked ? 'fill-red-500' : ''} /> J'aime</button>
          <button type="button" onClick={() => { if (!isModal && onSeeAllComments) onSeeAllComments() }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition"><MessageCircle size={14} /> Commenter</button>
          
          {/* 🆕 BOUTON ANKU LIVE */}
          <button 
            type="button" 
            onClick={() => setShowReelModal(true)} 
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            <Video size={14} /> Live
          </button>

          <button type="button" onClick={() => setShareOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition"><Share2 size={14} /> Partager</button>
        </div>

        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={onPostUpdated}
          onReport={openReportComment}
          initialLimit={2}
          isModal={isModal}
          onSeeAll={onSeeAllComments}
          highlightCommentId={highlightCommentId}
        />
      </article>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType={reportTargetType} targetId={reportTargetId} targetLabel={reportTargetLabel} />
      <ImageLightbox images={media} index={lightboxIndex} onClose={() => setLightboxIndex(-1)} onNavigate={setLightboxIndex} />
      {shareOpen && <ShareMenu postId={post.id} shareText={post.content?.slice(0, 100) ?? ''} onClose={() => setShareOpen(false)} onShareToAnku={async () => { try { await postsApi.share(post.id, { share_comment: null, visibility: 'public' }); toast.success('Partagé ! 🎉'); onPostUpdated() } catch (err: any) { toast.error('Erreur') } }} />}
      
      {/* 🆕 MODALE CREATE REEL DEPUIS UN POST */}
      {showReelModal && (
        <CreateReelModal 
          onClose={() => setShowReelModal(false)} 
          sharedPost={post} 
        />
      )}
    </>
  )
}