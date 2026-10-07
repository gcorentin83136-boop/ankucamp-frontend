import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, Loader, Eye, Heart, Calendar, Plus } from 'lucide-react'
import articlesApi from '../../service/api/articles.api'
import type { Article } from '../../types/article'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const CATEGORY_LABELS: Record<string, string> = {
  recette: 'Recette', conseil: 'Conseil', portrait: 'Portrait', actualite: 'Actualité', autre: 'Autre',
}

export default function BuyerArticles() {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await articlesApi.listMine()
        setArticles(res.articles)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)', border: '1px solid rgba(106,168,79,0.13)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={20} style={{ color: ANKU.greenDark }} />
              <h2 className="text-lg font-bold text-gray-900">Mes articles</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {articles.length} article{articles.length > 1 ? 's' : ''} publié{articles.length > 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/dashboard/shop/articles" className="rounded-full px-4 py-2 text-sm font-bold text-white flex items-center gap-2" style={{ background: ANKU.green }}>
            <Plus size={14} /> Écrire un article
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">Tu n’as pas encore écrit d’article</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link key={a.id} to={`/articles/${a.slug}`} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3 hover:bg-gray-50 transition">
              {a.cover_url ? (
                <img src={a.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: ANKU.greenPale, color: ANKU.greenDark }}>
                  <FileText size={20} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 truncate">{a.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ANKU.greenPale, color: ANKU.greenDark }}>
                    {CATEGORY_LABELS[a.category] ?? a.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(a.published_at ?? a.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye size={10} />{a.views_count}</span>
                  <span className="flex items-center gap-1"><Heart size={10} />{a.likes_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
