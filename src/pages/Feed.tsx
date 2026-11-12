import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users, MessageSquare, Calendar, Newspaper, Store, Star, Send, Loader, 
  UserPlus, Globe, Lock, ChevronDown, Clock
} from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import postsApi from '../service/api/posts.api'
import httpClient from '../service/api/httpClient'
import storiesApi from '../service/api/stories.api'
import AppHeader from '../components/layout/AppHeader'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import PostCard from '../components/social/PostCard'
import PostModal from '../components/social/PostModal'
import MediaUploader, { type MediaItem } from '../components/common/MediaUploader'
import EmojiPicker from '../components/common/EmojiPicker'
import CreateStoryModal from '../components/stories/CreateStoryModal'
import StoryViewerModal from '../components/stories/StoryViewerModal'
import type { Post, PostVisibility } from '../types/post'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

const SHORTCUTS = [
  { to: '/friends', label: 'Mes amis', icon: Users, color: '#0ea5e9' },
  { to: '/messages', label: 'Messagerie', icon: MessageSquare, color: '#8b5cf6' },
  { to: '/events', label: 'Événements', icon: Calendar, color: '#ec4899' },
  { to: '/articles', label: 'Articles', icon: Newspaper, color: '#14b8a6' },
  { to: '/shops', label: 'Boutiques', icon: Store, color: '#6aa84f' },
  { to: '/dashboard/user/reviews', label: 'Mes avis', icon: Star, color: '#f59e0b' },
]

function VisibilityDropdown({ value, onChange }: { value: PostVisibility, onChange: (v: PostVisibility) => void }) {
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
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition">
        <Icon size={14} style={{ color: current.color }} />{current.label}<ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[150px]">
            {options.map((opt) => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }} className={'w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition flex items-center gap-2 ' + (value === opt.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50')}>
                <opt.icon size={12} style={{ color: opt.color }} /> {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProfileCard() {
  const auth = useAuthStore(); const user = (auth as any)?.user;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: ANKU.greenDark }}>{(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}</div>}
        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{user?.first_name} {user?.last_name}</p><p className="text-xs text-gray-500 truncate">@{user?.username ?? 'utilisateur'}</p></div>
      </div>
      <Link to={user?.username ? `/u/${user.username}` : '#'} className="mt-3 block text-center rounded-full py-2 text-xs font-bold transition border-2" style={{ background: '#ffffff', color: ANKU.greenDark, borderColor: ANKU.green }}>Voir mon profil</Link>
    </div>
  )
}

function FriendsPreview() {
  const [loading, setLoading] = useState(true); const [friends, setFriends] = useState<any[]>([]);
  useEffect(() => { ;(async () => { try { const { data } = await httpClient.get<{ friends: any[] }>('/friends/me'); setFriends((data.friends ?? []).slice(0, 6)) } catch {} finally { setLoading(false) } })() }, [])
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Users size={14} style={{ color: ANKU.greenDark }} />Mes amis</p><Link to="/friends" className="text-[10px] font-bold hover:underline" style={{ color: ANKU.greenDark }}>Voir tous</Link></div>
      {loading ? <Loader size={16} className="animate-spin text-gray-300 mx-auto" /> : friends.length === 0 ? <p className="text-xs text-gray-500 italic">Aucun ami pour l'instant</p> : (
        <div className="grid grid-cols-3 gap-2">
          {friends.map((f) => { const u = f.friend ?? f.user ?? f; return (
            <Link key={u.id} to={u.username ? `/u/${u.username}` : '#'} className="flex flex-col items-center gap-1 hover:opacity-80 transition" title={u.username}>
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: ANKU.greenDark }}>{(u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')}</div>}
              <p className="text-[9px] text-gray-600 truncate w-full text-center">{u.first_name}</p>
            </Link>
          )})}
        </div>
      )}
    </div>
  )
}

function MyShopPreview() {
  const auth = useAuthStore(); const user = (auth as any)?.user; const [loading, setLoading] = useState(true); const [shop, setShop] = useState<any>(null); const isPro = user?.role === 'professionnel';
  useEffect(() => { if (!isPro) { setLoading(false); return } ;(async () => { try { const res = await httpClient.get<{ shops: any[] }>('/shops/mine').catch(() => ({ data: { shops: [] } })); setShop((res.data.shops ?? [])[0] ?? null) } catch {} finally { setLoading(false) } })() }, [isPro])
  if (!isPro) return null
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-3"><Store size={14} style={{ color: ANKU.greenDark }} />Ma boutique</p>
      {loading ? <Loader size={16} className="animate-spin text-gray-300 mx-auto" /> : !shop ? <Link to="/become-pro" className="block text-center rounded-full py-2 text-xs font-bold text-white transition" style={{ background: ANKU.green }}>Créer ma boutique</Link> : (
        <>
          <div className="flex items-center gap-3">
            {shop.logo_url ? <img src={shop.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: ANKU.greenDark }}>{shop.name?.[0] ?? 'S'}</div>}
            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{shop.name}</p></div>
          </div>
          <Link to={`/shops/${shop.id}`} className="mt-3 block text-center rounded-full py-2 text-xs font-bold text-white transition" style={{ background: ANKU.green }}>Voir ma boutique</Link>
        </>
      )}
    </div>
  )
}

function QuickLinks() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900 mb-3">Raccourcis</p>
      <div className="space-y-1">
        {SHORTCUTS.slice(0, 5).map((s) => (
          <Link key={s.to} to={s.to} className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: s.color }}><s.icon size={13} /></div>{s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Feed() {
  const auth = useAuthStore(); const user = (auth as any)?.user;
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true); const [posts, setPosts] = useState<Post[]>([]); const [cursor, setCursor] = useState<string | null>(null); const [hasMore, setHasMore] = useState(true); const LIMIT = 10;
  const [content, setContent] = useState(''); const [visibility, setVisibility] = useState<PostVisibility>('public'); const [media, setMedia] = useState<MediaItem[]>([]); const [publishing, setPublishing] = useState(false);
  const [editVisibilityPost, setEditVisibilityPost] = useState<Post | null>(null)
  const [modalPostId, setModalPostId] = useState<number | null>(null); const [modalCommentId, setModalCommentId] = useState<number | null>(null)
  
  // 🆕 NOUVEAUX ÉTATS POUR LES STORIES GROUPÉES
  const [stories, setStories] = useState<any[]>([])
  const [activeStoryGroup, setActiveStoryGroup] = useState<any>(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef(false) 

  useEffect(() => {
    const postParam = searchParams.get('post'); const commentParam = searchParams.get('comment');
    if (postParam) {
      setModalPostId(Number(postParam)); if (commentParam) setModalCommentId(Number(commentParam));
      const newParams = new URLSearchParams(searchParams); newParams.delete('post'); newParams.delete('comment'); setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams])

  const loadStories = useCallback(() => {
    storiesApi.feed().then((res: any) => setStories(res.stories)).catch(() => {})
  }, [])

  useEffect(() => { loadStories() }, [loadStories])

  const loadPosts = useCallback(async (reset = false) => {
    if (loadingRef.current && !reset) return
    loadingRef.current = true
    if (reset) setLoading(true)
    
    try {
      const res = await postsApi.feed({ limit: LIMIT, cursor: reset ? undefined : (cursor || undefined) })
      setPosts((prev) => (reset ? res.posts : [...prev, ...res.posts]))
      setCursor(res.next_cursor ?? null)
      setHasMore(!!res.has_more && res.posts.length > 0)
    } catch (err: any) { 
      if (err?.response?.status !== 429) { toast.error(err?.response?.data?.message || 'Erreur') }
    } finally { 
      setLoading(false) 
      loadingRef.current = false
    }
  }, [cursor])

  useEffect(() => { loadPosts(true) }, [])

  useEffect(() => {
    if (loading || !hasMore) return
    observerRef.current = new IntersectionObserver((entries) => { 
      if (entries[0].isIntersecting) loadPosts(false) 
    }, { threshold: 0.1 })
    const sentinel = document.getElementById('feed-sentinel'); if (sentinel) observerRef.current.observe(sentinel)
    return () => { if (observerRef.current) observerRef.current.disconnect() }
  }, [loading, hasMore, loadPosts])

  const handlePublish = async () => {
    if (!content.trim() && media.length === 0) { toast.error('Écris quelque chose ou ajoute un média'); return }
    setPublishing(true)
    try {
      await postsApi.create({ content: content.trim() || null, visibility, media_urls: media.map((m) => m.url) })
      toast.success('Post publié ✅'); setContent(''); setMedia([]); await loadPosts(true);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur') } finally { setPublishing(false) }
  }

  const handleUpdateVisibility = async (newVis: PostVisibility) => {
    if (!editVisibilityPost) return
    try {
      await postsApi.update(editVisibilityPost.id, { visibility: newVis }); toast.success('Visibilité mise à jour ✅'); setEditVisibilityPost(null); await loadPosts(true);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="relative min-h-screen">
      <AppHeader />
      <AnimatedShopsBackground />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4"><QuickLinks /><MyShopPreview /><FriendsPreview /><ProfileCard /></div>
          </aside>

          <main className="space-y-4 min-w-0">
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              
              <button 
                onClick={() => setShowCreateStoryModal(true)}
                className="relative w-28 h-40 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-300 bg-emerald-50/50 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <span className="text-[10px] font-bold text-emerald-800">Story Anku</span>
              </button>

              {stories.map((group) => (
                <button 
                  key={group.author.id} 
                  onClick={() => {
                    setActiveStoryGroup(group)
                    setActiveStoryIndex(0)
                  }}
                  className={`relative w-28 h-40 shrink-0 rounded-2xl overflow-hidden shadow-sm group text-left border-2 border-emerald-400`}
                >
                  {group.stories[0].media_type === 'video' ? (
                    <video src={group.stories[0].media_url} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={group.stories[0].media_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full border-2 shadow-sm overflow-hidden bg-gray-200 border-emerald-400`}>
                      {group.author?.avatar_url ? (
                        <img src={group.author.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-600" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-white text-center leading-tight line-clamp-2">{group.author?.first_name}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-3">
                {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" /> : <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm" style={{ background: ANKU.greenDark }}>{(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}</div>}
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Quoi de neuf, ${user?.first_name ?? 'toi'} ?`} rows={content.length > 60 ? 5 : 2} maxLength={5000} className="flex-1 bg-transparent outline-none text-[15px] placeholder-gray-400 resize-none pt-2 leading-relaxed break-words" />
              </div>

              {media.length > 0 && <div className="px-4 pb-3"><MediaUploader media={media} onChange={setMedia} variant="preview" /></div>}

              <div className="px-3 py-2 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100 bg-gradient-to-t from-gray-50/50 to-white">
                <div className="flex items-center gap-0.5">
                  <MediaUploader media={media} onChange={setMedia} variant="buttons" />
                  <EmojiPicker align="left" onSelect={(emoji) => setContent((c) => c + emoji)} />
                  <VisibilityDropdown value={visibility} onChange={setVisibility} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 hidden sm:inline">{content.length}/5000</span>
                  <button type="button" onClick={handlePublish} disabled={publishing || (!content.trim() && media.length === 0)} className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-xs font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg" style={{ background: ANKU.green }}>
                    {publishing ? <Loader size={14} className="animate-spin" /> : <Send size={14} />} Publier
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-3">
              {SHORTCUTS.map((s) => (
                <Link key={s.to} to={s.to} className="rounded-2xl border border-gray-200 bg-white p-3 flex flex-col items-center gap-2 hover:shadow-md transition">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: s.color }}><s.icon size={18} /></div>
                  <p className="text-[11px] font-bold text-gray-800 text-center leading-tight">{s.label}</p>
                </Link>
              ))}
            </div>

            {loading && posts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center"><Loader size={24} className="animate-spin text-gray-400 mx-auto" /></div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-10 text-center">
                <Users size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-800">Aucun post pour le moment</p>
                <Link to="/friends" className="inline-flex items-center gap-2 mt-4 rounded-full px-4 py-2 text-xs font-bold text-white transition" style={{ background: ANKU.green }}><UserPlus size={14} /> Trouver des amis</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    currentUserId={user?.id}
                    onPostUpdated={() => loadPosts(true)}
                    onChangeVisibility={() => setEditVisibilityPost(p)}
                    onSeeAllComments={() => setModalPostId(p.id)}
                  />
                ))}
                <div id="feed-sentinel" className="h-10 flex items-center justify-center">
                  {hasMore && <Loader size={24} className="animate-spin text-gray-400" />}
                  {!hasMore && posts.length > 0 && <p className="text-xs text-gray-400 italic">Tu as tout vu !</p>}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {modalPostId && (
        <PostModal postId={modalPostId} commentId={modalCommentId} onClose={() => { setModalPostId(null); setModalCommentId(null) }} onPostUpdated={() => loadPosts(true)} />
      )}

      {editVisibilityPost && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50"><h3 className="text-base font-bold text-gray-900">Modifier la visibilité</h3></div>
            <div className="p-5 space-y-2">
              {[{ value: 'public', label: 'Public', icon: Globe, desc: 'Visible par tout le monde' }, { value: 'friends', label: 'Amis', icon: Users, desc: 'Visible par tes amis' }, { value: 'private', label: 'Privé', icon: Lock, desc: 'Visible uniquement par toi' }].map((opt) => (
                <button key={opt.value} type="button" onClick={() => handleUpdateVisibility(opt.value as PostVisibility)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-left">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0"><opt.icon size={18} className="text-gray-600" /></div>
                  <div><p className="text-sm font-bold text-gray-900">{opt.label}</p><p className="text-[10px] text-gray-500">{opt.desc}</p></div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50"><button type="button" onClick={() => setEditVisibilityPost(null)} className="w-full py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition">Annuler</button></div>
          </div>
        </div>
      )}

      {showCreateStoryModal && (
        <CreateStoryModal 
          onClose={() => { 
            setShowCreateStoryModal(false); 
            loadStories(); 
          }} 
        />
      )}

      {activeStoryGroup && (
        <StoryViewerModal 
          group={activeStoryGroup} 
          initialIndex={activeStoryIndex}
          onClose={() => { 
            setActiveStoryGroup(null); 
            loadStories(); 
          }} 
        />
      )}
    </div>
  )
}