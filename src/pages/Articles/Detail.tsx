/* eslint-disable */
import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Heart, Eye, Calendar, Clock, Loader, Share2, BookOpen, Link as LinkIcon, MessageCircle, Send, CornerDownRight, Smile, Image as ImageIcon, X, ChevronDown, ChevronUp } from 'lucide-react'
import articlesApi from '../../service/api/articles.api'
import { commentsApi, type Comment } from '../../service/api/comments.api'
import type { Article } from '../../types/article'
import AnimatedShopsBackground from '../../components/shops/AnimatedShopsBackground'
import QuickMenu from '../../components/shops/QuickMenu'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

const CATEGORIES: Record<string, { label: string, color: string }> = {
  recette: { label: 'Recette', color: '#e67e22' },
  conseil: { label: 'Conseil', color: '#3498db' },
  portrait: { label: 'Portrait', color: '#9b59b6' },
  actualite: { label: 'ActualitÃ©', color: '#e74c3c' },
  autre: { label: 'Autre', color: '#7f8c8d' },
}

const EMOJIS = ['ðŸ˜€', 'ðŸ˜‚', 'â¤ï¸', 'ðŸ‘', 'ðŸ”¥', 'ðŸ˜®', 'ðŸ˜¢', 'ðŸŽ‰', 'ðŸŒ¿', 'ðŸ¥—', 'âœ¨', 'ðŸ’¯', 'ðŸ‘', 'ðŸ™Œ', 'ðŸ¤”']

const IconFacebook = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
const IconInstagram = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const IconWhatsApp = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>

function countAllComments(comments: Comment[]): number {
  let count = comments.length;
  for (const c of comments) {
    if (c.replies) {
      count += countAllComments(c.replies);
    }
  }
  return count;
}

// ðŸ†• Composant CommentNode avec bouton unique
function CommentNode({ comment, onReplySubmit, onReact, isTarget, depth = 0 }: { comment: Comment, onReplySubmit: (id: number, content: string, mediaUrl?: string) => Promise<void>, onReact: (id: number, emoji: string) => void, isTarget?: boolean, depth?: number }) {
  const [showReplies, setShowReplies] = useState(isTarget);
  const [isReplying, setIsReplying] = useState(false);
  
  const [replyText, setReplyText] = useState('');
  const [replyMediaUrl, setReplyMediaUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalReplies = comment.replies?.length || 0;
  
  // Limite visuelle de l'indentation pour Ã©viter l'effet "escalier"
  const paddingLeft = depth === 0 ? 'ml-0' : depth > 2 ? 'ml-4' : 'ml-8';

  const heartCount = comment.reactions?.['â¤ï¸']?.length || 0;
  const hasLiked = comment.my_reactions?.includes('â¤ï¸');

  const handleSendReply = async () => {
    if (!replyText.trim() && !replyMediaUrl) return;
    setPosting(true);
    try {
      await onReplySubmit(comment.id, replyText.trim(), replyMediaUrl || undefined);
      setReplyText('');
      setReplyMediaUrl(null);
      setIsReplying(false);
      setShowReplies(true); // Ouvre les rÃ©ponses aprÃ¨s avoir rÃ©pondu
    } finally {
      setPosting(false);
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await articlesApi.uploadCover(file);
      setReplyMediaUrl(res.url);
    } catch (err: any) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div id={`comment-${comment.id}`} className="flex flex-col gap-2 transition-all duration-700 rounded-2xl">
      <div className="flex gap-3">
        {comment.author?.avatar_url ? (
          <img src={comment.author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gray-400 shrink-0">
            {comment.author?.first_name?.[0] || 'U'}{comment.author?.last_name?.[0] || 'U'}
          </div>
        )}
        <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-bold text-sm text-gray-900">{comment.author?.first_name} {comment.author?.last_name}</span>
              <span className="text-xs text-gray-500 ml-2">@{comment.author?.username}</span>
            </div>
            <span className="text-[10px] font-medium text-gray-400">
              {new Date(comment.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          
          {comment.media_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 max-w-sm">
              <img src={comment.media_url} alt="PiÃ¨ce jointe" className="w-full h-auto max-h-60 object-cover" />
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-4">
            <button 
              onClick={() => setIsReplying(!isReplying)} 
              className={`text-xs font-bold flex items-center gap-1 transition ${isReplying ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'}`}
            >
              <CornerDownRight size={12} /> RÃ©pondre
            </button>
            <button 
              onClick={() => onReact(comment.id, 'â¤ï¸')}
              className={`text-xs font-bold flex items-center gap-1 transition ${hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart size={12} fill={hasLiked ? 'currentColor' : 'none'} /> 
              {heartCount > 0 ? heartCount : 'J\'aime'}
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className={`${paddingLeft} ml-11 mt-1`}>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-emerald-400 focus-within:bg-white transition shadow-sm">
            {replyMediaUrl && (
              <div className="px-3 pt-3 pb-1">
                <div className="relative inline-block">
                  <img src={replyMediaUrl} alt="Preview" className="h-16 rounded-lg border border-gray-200 object-cover" />
                  <button type="button" onClick={() => setReplyMediaUrl(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md">
                    <X size={10} />
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ã‰cris ta rÃ©ponse ici..."
              className="w-full bg-transparent p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
              rows={2}
              autoFocus
            />

            <div className="px-2 pb-2 flex items-center justify-between border-t border-gray-100/50">
              <div className="flex items-center gap-1">
                <div className="relative emoji-picker-container">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Emoji">
                    <Smile size={16} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 grid grid-cols-5 gap-1 z-50">
                      {EMOJIS.map(e => (
                        <button key={e} type="button" onClick={() => { setReplyText(prev => prev + e); setShowEmojiPicker(false); }} className="text-xl hover:bg-gray-100 rounded-lg p-1 transition">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleMediaUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition disabled:opacity-50" title="Image">
                  {uploading ? <Loader size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsReplying(false)} className="text-xs font-bold text-gray-500 hover:text-red-500 px-2">
                  Annuler
                </button>
                <button onClick={handleSendReply} disabled={posting || (!replyText.trim() && !replyMediaUrl)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition disabled:opacity-50" style={{ background: ANKU.green }}>
                  {posting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />} Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ðŸ†• Bouton Unique pour Afficher / Masquer les rÃ©ponses */}
      {totalReplies > 0 && (
        <div className={`${paddingLeft} mt-1`}>
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs font-bold text-gray-600 hover:text-emerald-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition w-fit"
          >
            {showReplies ? (
              <>
                <ChevronUp size={14} /> Masquer les rÃ©ponses
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Afficher {totalReplies} {totalReplies === 1 ? 'rÃ©ponse' : 'rÃ©ponses'}
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Affichage des rÃ©ponses si activÃ© */}
      {showReplies && totalReplies > 0 && (
        <div className={`${paddingLeft} pl-4 border-l-2 border-gray-100 space-y-3 mt-2`}>
          {comment.replies!.map(reply => (
            <CommentNode key={reply.id} comment={reply} onReplySubmit={onReplySubmit} onReact={onReact} isTarget={isTarget} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [commentMediaUrl, setCommentMediaUrl] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchArticleAndComments = async () => {
      if (!slug) return
      setLoading(true)
      try {
        const res = await articlesApi.getBySlug(slug)
        if (res && res.article) {
          setArticle(res.article)
          const commentsRes = await commentsApi.listByArticle(res.article.id)
          if (commentsRes && commentsRes.comments) setComments(commentsRes.comments)
        }
      } catch (err: any) {
        toast.error('Article introuvable.')
        navigate('/articles')
      } finally { setLoading(false) }
    }
    fetchArticleAndComments()
  }, [slug, navigate])

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (!hash) return;

    setTimeout(() => {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-emerald-50', 'ring-2', 'ring-emerald-400', 'p-2', '-m-2');
        setTimeout(() => el.classList.remove('bg-emerald-50', 'ring-2', 'ring-emerald-400', 'p-2', '-m-2'), 2500);
      }
    }, 300);
  }, [loading, comments])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) setShowShareMenu(false)
      if (!(event.target as Element).closest('.emoji-picker-container')) setShowEmojiPicker(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLike = async () => {
    if (!article || liking) return
    setLiking(true)
    try {
      const res = await articlesApi.like(article.id)
      setArticle(prev => prev ? { ...prev, liked_by_me: res.liked, likes_count: res.liked ? prev.likes_count + 1 : prev.likes_count - 1 } : null)
    } catch (err: any) { toast.error('Erreur lors du like.') } finally { setLiking(false) }
  }

  const handleReactComment = async (commentId: number, emoji: string) => {
    try {
      await commentsApi.react(commentId, emoji)
      if (article) {
        const commentsRes = await commentsApi.listByArticle(article.id)
        if (commentsRes && commentsRes.comments) setComments(commentsRes.comments)
      }
    } catch (err: any) { toast.error('Erreur lors de la rÃ©action') }
  }

  const handleReplySubmit = async (parentId: number, content: string, mediaUrl?: string) => {
    if (!article) return
    try {
      await commentsApi.create(article.id, content, parentId, mediaUrl)
      const commentsRes = await commentsApi.listByArticle(article.id)
      if (commentsRes && commentsRes.comments) setComments(commentsRes.comments)
      toast.success('RÃ©ponse ajoutÃ©e !')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur")
      throw err
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setNewComment(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMedia(true)
    try {
      const res = await articlesApi.uploadCover(file)
      setCommentMediaUrl(res.url)
      toast.success('Image ajoutÃ©e âœ…')
    } catch (err: any) { toast.error("Erreur lors de l'upload") } finally {
      setUploadingMedia(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!article || (!newComment.trim() && !commentMediaUrl) || postingComment) return
    setPostingComment(true)
    try {
      const res = await commentsApi.create(article.id, newComment.trim(), undefined, commentMediaUrl || undefined)
      if (res && res.comment) {
        setComments(prev => [...prev, res.comment])
        setNewComment('')
        setCommentMediaUrl(null)
        toast.success('Commentaire ajoutÃ© !')
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (err: any) { toast.error(err?.response?.data?.message || "Erreur") } finally { setPostingComment(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader size={32} className="animate-spin text-emerald-500" /></div>
  if (!article) return null

  const cat = CATEGORIES[article.category?.toLowerCase()] || CATEGORIES['autre']
  const authorName = article.author ? `${article.author.first_name} ${article.author.last_name}` : 'Auteur inconnu'
  const readTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1000))
  const publishDate = article.published_at ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue'
  
  const shareUrl = window.location.href
  const shareTitle = encodeURIComponent(article.title)

  const shareLinks = [
    { name: 'WhatsApp', icon: IconWhatsApp, url: `https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`, color: '#25D366' },
    { name: 'Facebook', icon: IconFacebook, url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, color: '#1877F2' },
    { name: 'X (Twitter)', icon: IconX, url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`, color: '#000000' },
    { name: 'Instagram', icon: IconInstagram, url: `https://www.instagram.com/`, color: '#E1306C' },
  ]

  const totalCommentsCount = countAllComments(comments);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative overflow-hidden">
      <AnimatedShopsBackground />
      <QuickMenu />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:pl-24 pt-8">
        <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition mb-6 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <ArrowLeft size={16} /> Retour au Kiosque
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2" style={{ background: cat.color }}></div>
          <div className="flex items-center gap-3 mb-4 mt-2">
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white shadow-sm" style={{ background: cat.color }}>
              {cat.label}
            </span>
            <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
              <Calendar size={14} /> {publishDate}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-gray-900 leading-tight mb-4">{article.title}</h1>
          {article.excerpt && <p className="text-lg text-gray-600 leading-relaxed font-serif italic mb-6">{article.excerpt}</p>}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3">
              {article.author?.avatar_url ? (
                <img src={article.author.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white bg-emerald-500 shadow-sm">{authorName.substring(0, 2).toUpperCase()}</div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{authorName}</p>
                <p className="text-xs text-gray-500">@{article.author?.username || 'anonyme'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <span className="flex items-center gap-1.5"><Clock size={16} className="text-emerald-500"/> {readTime} min</span>
              <span className="flex items-center gap-1.5"><Eye size={16} /> {article.views_count || 0}</span>
            </div>
          </div>
        </div>

        {article.cover_url && (
          <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-10 bg-white p-2">
            <img src={article.cover_url} alt={article.title} className="w-full max-h-[500px] object-cover rounded-2xl" />
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-sm border border-gray-100 mb-8">
          <div className="prose prose-lg max-w-none text-gray-800 leading-loose whitespace-pre-wrap font-sans">{article.content}</div>
        </div>

        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} disabled={liking} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all ${article.liked_by_me ? 'bg-red-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
              <Heart size={18} fill={article.liked_by_me ? 'currentColor' : 'none'} /> {article.likes_count || 0}
            </button>
            <div className="relative" ref={shareMenuRef}>
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
                <Share2 size={18} /> Partager
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-2 space-y-1">
                    {shareLinks.map((link) => (
                      <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition">
                        <link.icon /> <span style={{ color: link.color }}>{link.name}</span>
                      </a>
                    ))}
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Lien copiÃ© !'); setShowShareMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition">
                      <LinkIcon size={18} className="text-gray-400" /> Copier le lien
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-emerald-600 font-bold text-sm"><BookOpen size={18} /> Le Kiosque ANKU</div>
        </div>

        <div id="comments" className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-serif font-black text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle size={24} className="text-emerald-500" /> Discussions ({totalCommentsCount})
          </h2>

          <form onSubmit={handlePostComment} className="mb-10 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-700 font-bold mt-1">Moi</div>
            <div className="flex-1">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-emerald-400 focus-within:bg-white transition">
                {commentMediaUrl && (
                  <div className="px-4 pt-4 pb-2">
                    <div className="relative inline-block">
                      <img src={commentMediaUrl} alt="Preview" className="h-24 rounded-lg border border-gray-200 object-cover" />
                      <button type="button" onClick={() => setCommentMediaUrl(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partage ton avis sur cet article..."
                  className="w-full bg-transparent p-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
                  rows={3}
                  maxLength={1000}
                />

                <div className="px-2 pb-2 flex items-center justify-between border-t border-gray-100/50">
                  <div className="flex items-center gap-1">
                    <div className="relative emoji-picker-container">
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Ajouter un emoji">
                        <Smile size={20} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 grid grid-cols-5 gap-1 z-50">
                          {EMOJIS.map(e => (
                            <button key={e} type="button" onClick={() => handleEmojiClick(e)} className="text-2xl hover:bg-gray-100 rounded-lg p-1 transition">{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleMediaUpload} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition disabled:opacity-50" title="Ajouter une image">
                      {uploadingMedia ? <Loader size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                    </button>
                  </div>

                  <button type="submit" disabled={postingComment || (!newComment.trim() && !commentMediaUrl)} className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition disabled:opacity-50" style={{ background: ANKU.green }}>
                    {postingComment ? <Loader size={16} className="animate-spin" /> : <Send size={16} />} Envoyer
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="flex flex-col gap-6">
            {comments.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Sois le premier Ã  commenter cet article !</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={comment.id} className={index > 0 ? "pt-6 border-t border-gray-100" : ""}>
                  <CommentNode 
                    comment={comment} 
                    onReplySubmit={handleReplySubmit}
                    onReact={handleReactComment}
                    isTarget={window.location.hash === `#comment-${comment.id}`}
                  />
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}


