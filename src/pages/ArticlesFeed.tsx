/* eslint-disable */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, Loader, Eye, Heart, Clock, BookOpen, Filter, Image as ImageIcon, MessageCircle, Share2 } from 'lucide-react'
import articlesApi from '../service/api/articles.api'
import type { Article } from '../types/article'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import QuickMenu from '../components/shops/QuickMenu'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

const CATEGORIES = [
  { value: 'all', label: 'Tout le Kiosque', color: '#1f1f1f' },
  { value: 'recette', label: 'Recettes', color: '#e67e22' },
  { value: 'conseil', label: 'Conseils', color: '#3498db' },
  { value: 'portrait', label: 'Portraits', color: '#9b59b6' },
  { value: 'actualite', label: 'Actualités', color: '#e74c3c' },
  { value: 'autre', label: 'Autres', color: '#7f8c8d' },
]

export default function ArticlesFeed() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [likingId, setLikingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await articlesApi.list({ status: 'published', sort: 'recent' })
        if (res && res.articles) {
          setAllArticles(res.articles)
        }
      } catch (err: any) {
        console.error("Erreur API Articles:", err)
        toast.error('Impossible de charger le kiosque.')
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [])

  const filteredArticles = useMemo(() => {
    let result = allArticles
    if (category !== 'all') {
      result = result.filter(a => (a.category || '').toLowerCase() === category)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(a => 
        (a.title || '').toLowerCase().includes(q) || 
        (a.excerpt || '').toLowerCase().includes(q) ||
        (a.author?.first_name || '').toLowerCase().includes(q) ||
        (a.author?.last_name || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [allArticles, search, category])

  const handleLike = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault()
    if (likingId === article.id) return
    setLikingId(article.id)
    try {
      const res = await articlesApi.like(article.id)
      setAllArticles(prev => prev.map(a => 
        a.id === article.id 
          ? { ...a, liked_by_me: res.liked, likes_count: res.liked ? a.likes_count + 1 : a.likes_count - 1 } 
          : a
      ))
    } catch (err: any) {
      toast.error('Erreur lors du like.')
    } finally {
      setLikingId(null)
    }
  }

  const handleShare = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault()
    const url = `${window.location.origin}/articles/${article.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: url,
        })
      } catch (err: any) {}
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Lien de l\'article copié !')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative overflow-hidden">
      
      <AnimatedShopsBackground />
      <QuickMenu />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:pl-24 pt-6">
        
        <div className="rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm mb-8" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)' }}>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md border border-emerald-100 shrink-0">
              <BookOpen size={32} style={{ color: ANKU.greenDark }} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Le Kiosque ANKU</h1>
              <p className="text-gray-600 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">
                Découvre les histoires, conseils et recettes de la communauté.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex flex-col md:flex-row gap-4 items-center mb-10">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full rounded-xl bg-gray-50 border-none py-3.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>
          <div className="w-full md:w-px h-px md:h-8 bg-gray-200"></div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
            <Filter size={16} className="text-gray-400 shrink-0 ml-2 mr-1" />
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  category === c.value
                    ? 'text-white border-transparent shadow-md scale-105'
                    : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                }`}
                style={{ background: category === c.value ? c.color : undefined }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-emerald-500 mb-4" />
            <p className="text-sm font-semibold text-gray-500">Chargement des articlesâ€¦</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun article trouvé</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {search || category !== 'all' ? 'Essaie de modifier tes filtres ou ta recherche.' : 'Le kiosque est vide pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((a) => {
              const catObj = CATEGORIES.find(c => c.value === (a.category || '').toLowerCase()) || CATEGORIES[5];
              const authorName = a.author ? `${a.author.first_name || ''} ${a.author.last_name || ''}`.trim() : 'Auteur inconnu';
              const authorUsername = a.author?.username || 'anonyme';
              const readTime = Math.max(1, Math.ceil((a.content?.length || 0) / 1000));

              return (
                <Link
                  key={a.id}
                  to={`/articles/${a.slug}`}
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                    {a.cover_url ? (
                      <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50">
                        <ImageIcon size={32} className="text-emerald-200 mb-2" />
                        <span className="text-xs text-emerald-600/50 font-medium">Pas d'image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white shadow-md" style={{ background: catObj.color }}>
                        {catObj.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition mb-2">
                      {a.title || "Sans titre"}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1 mb-4">
                      {a.excerpt || "Découvrez cet article..."}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-3">
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/author hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/u/${authorUsername}`);
                        }}
                      >
                        {a.author?.avatar_url ? (
                          <img src={a.author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 group-hover/author:border-emerald-400 transition-colors" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-emerald-500">
                            {authorName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800 leading-none group-hover/author:text-emerald-600 transition-colors">{authorName}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">@{authorUsername}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 text-[10px] font-medium text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={10} className="text-emerald-500" /> {readTime} min</span>
                        <span className="flex items-center gap-1"><Eye size={10} /> {a.views_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <button 
                        onClick={(e) => handleLike(e, a)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${a.liked_by_me ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <Heart size={14} fill={a.liked_by_me ? 'currentColor' : 'none'} /> 
                        {a.likes_count || 0}
                      </button>
                      
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          navigate(`/articles/${a.slug}#comments`); 
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
                      >
                        <MessageCircle size={14} /> Commenter
                      </button>

                      <button 
                        onClick={(e) => handleShare(e, a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
                      >
                        <Share2 size={14} /> Partager
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


