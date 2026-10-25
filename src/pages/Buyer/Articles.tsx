import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader,
  Filter,
  Search,
  Upload,
  Eye,
  Heart,
  Globe,
  Lock,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Archive,
  Calendar,
} from 'lucide-react'
import articlesApi from '../../service/api/articles.api'
import type {
  Article,
  ArticleStatus,
  ArticleVisibility,
  CreateArticlePayload,
} from '../../types/article'
import StatCard from '../../components/seller/StatCard'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'recette', label: 'Recette' },
  { value: 'conseil', label: 'Conseil' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'actualite', label: 'Actualité' },
  { value: 'autre', label: 'Autre' },
]

const STATUS_CONFIG: Record<
  ArticleStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  draft: {
    label: 'Brouillon',
    color: '#6b7280',
    bg: '#f3f4f6',
    icon: Pencil,
  },
  published: {
    label: 'Publié',
    color: '#059669',
    bg: '#d1fae5',
    icon: CheckCircle2,
  },
  archived: {
    label: 'Archivé',
    color: '#9ca3af',
    bg: '#f3f4f6',
    icon: Archive,
  },
}

const VISIBILITY_CONFIG: Record<
  ArticleVisibility,
  { label: string; icon: any; description: string; gradient: string }
> = {
  public: {
    label: 'Tout le monde',
    icon: Globe,
    description: 'Visible par tous les utilisateurs',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  friends: {
    label: 'Mes amis',
    icon: Users,
    description: 'Seulement tes amis acceptés',
    gradient: 'from-blue-400 to-blue-600',
  },
  followers: {
    label: 'Mes abonnés',
    icon: UserCheck,
    description: 'Les personnes qui te suivent',
    gradient: 'from-purple-400 to-purple-600',
  },
  private: {
    label: 'Privé',
    icon: Lock,
    description: 'Toi uniquement — brouillon',
    gradient: 'from-gray-400 to-gray-600',
  },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  const c = STATUS_CONFIG[status]
  const Icon = c.icon
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
      style={{ background: c.bg, color: c.color }}
    >
      <Icon size={9} />
      {c.label}
    </span>
  )
}

function VisibilityBadge({ visibility }: { visibility: ArticleVisibility }) {
  const c = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.public
  const Icon = c.icon
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-blue-50 text-blue-700">
      <Icon size={9} />
      {c.label}
    </span>
  )
}

// ============================================================
// MODAL CRÉATION / ÉDITION
// ============================================================
function ArticleModal({
  open,
  article,
  onClose,
  onSaved,
}: {
  open: boolean
  article: Article | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!article
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_url: '',
    category: 'conseil',
    tags_input: '',
    status: 'published' as 'draft' | 'published' | 'archived',
    visibility: 'public' as ArticleVisibility,
  })

  useEffect(() => {
    if (!open) return
    if (article) {
      let tagsArr: string[] = []
      if (article.tags) {
        try {
          tagsArr = JSON.parse(article.tags)
        } catch {
          tagsArr = []
        }
      }
      setForm({
        title: article.title,
        excerpt: article.excerpt ?? '',
        content: article.content,
        cover_url: article.cover_url ?? '',
        category: article.category,
        tags_input: tagsArr.join(', '),
        status: article.status,
        visibility: article.visibility,
      })
    } else {
      setForm({
        title: '',
        excerpt: '',
        content: '',
        cover_url: '',
        category: 'conseil',
        tags_input: '',
        status: 'published',
        visibility: 'public',
      })
    }
  }, [open, article])

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true)
    try {
      const res = await articlesApi.uploadCover(file)
      setForm((f) => ({ ...f, cover_url: res.url }))
      toast.success('Image uploadée ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.title.trim().length < 3) {
      toast.error('Titre requis (min 3 caractères)')
      return
    }
    if (form.content.trim().length < 20) {
      toast.error('Contenu requis (min 20 caractères)')
      return
    }

    const tags = form.tags_input
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    setLoading(true)
    try {
      const payload: CreateArticlePayload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        cover_url: form.cover_url || null,
        category: form.category,
        tags: tags,
        status: form.status === 'archived' ? 'published' : form.status,
        visibility: form.visibility,
      }

      if (isEdit && article) {
        await articlesApi.update(article.id, payload)
        toast.success('Article modifié ✅')
      } else {
        await articlesApi.create(payload)
        toast.success('Article créé ✅')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEdit ? "Modifier l'article" : 'Nouvel article'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? `#${article?.id} · ${article?.title}`
                : 'Partage ton savoir avec la communauté'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* COVER */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Image de couverture
            </label>
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUploadCover(f)
                e.target.value = ''
              }}
            />
            {form.cover_url ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={form.cover_url}
                  alt=""
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cover_url: '' })}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  disabled={uploadingCover}
                  className="absolute bottom-2 right-2 rounded-full px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  {uploadingCover ? (
                    <Loader size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  Changer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
                className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center h-40 transition hover:bg-gray-50 disabled:opacity-50"
                style={{
                  borderColor: `${ANKU.green}55`,
                  background: ANKU.greenPale,
                }}
              >
                {uploadingCover ? (
                  <Loader size={24} className="animate-spin" style={{ color: ANKU.greenDark }} />
                ) : (
                  <Upload size={24} style={{ color: ANKU.greenDark }} />
                )}
                <p className="text-xs text-gray-600 mt-2 font-semibold">
                  {uploadingCover ? 'Upload…' : 'Clique pour ajouter une image'}
                </p>
              </button>
            )}
          </div>

          {/* TITRE */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : 5 astuces pour un potager bio"
              className={inputCls}
              maxLength={255}
              autoFocus
            />
          </div>

          {/* CATÉGORIE */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catégorie *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                    form.category === c.value
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background:
                      form.category === c.value ? ANKU.green : undefined,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* EXTRAIT */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Extrait (optionnel)
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              placeholder="Résumé court visible dans la liste"
              className={inputCls + ' resize-none'}
              maxLength={500}
            />
          </div>

          {/* CONTENU */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contenu *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              placeholder="Écris ton article ici…"
              className={inputCls + ' resize-none'}
              maxLength={50000}
            />
          </div>

          {/* TAGS */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={form.tags_input}
              onChange={(e) =>
                setForm({ ...form, tags_input: e.target.value })
              }
              placeholder="Ex : potager, bio, astuces"
              className={inputCls}
            />
          </div>

          {/* STATUT + VISIBILITÉ */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Statut
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: 'draft' })}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                    form.status === 'draft'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background: form.status === 'draft' ? ANKU.green : undefined,
                  }}
                >
                  Brouillon
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: 'published' })}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                    form.status === 'published'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background:
                      form.status === 'published' ? ANKU.green : undefined,
                  }}
                >
                  Publier
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Qui peut voir cet article ?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VISIBILITY_CONFIG) as ArticleVisibility[]).map(
                  (v) => {
                    const cfg = VISIBILITY_CONFIG[v]
                    const Icon = cfg.icon
                    const isActive = form.visibility === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, visibility: v })
                        }
                        className={`relative rounded-xl p-3 text-left transition-all ${
                          isActive
                            ? 'ring-2 ring-emerald-400 bg-white shadow-md scale-[1.02]'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${cfg.gradient} shrink-0`}
                          >
                            <Icon size={15} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900">
                              {cfg.label}
                            </p>
                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                              {cfg.description}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2
                              size={10}
                              className="text-white"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </button>
                    )
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        <footer
          className="px-5 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white"
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
            type="submit"
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: ANKU.green }}
          >
            <Save size={14} />
            {loading ? '...' : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </footer>
      </form>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}

// ============================================================
// MODAL SUPPRESSION
// ============================================================
function DeleteArticleModal({
  article,
  onClose,
  onConfirm,
  loading,
}: {
  article: Article | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!article) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Supprimer l'article
            </h3>
            <p className="text-xs text-red-700 mt-0.5">{article.title}</p>
          </div>
        </header>
        <div className="p-5">
          <p className="text-sm text-gray-700">
            Cet article sera <strong>définitivement supprimé</strong> ainsi
            que ses likes et commentaires.
          </p>
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
            onClick={onConfirm}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? '...' : 'Supprimer'}
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
// PAGE PRINCIPALE
// ============================================================
export default function SellerArticles() {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [filter, setFilter] = useState<ArticleStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await articlesApi.listMine()
      setArticles(res.articles)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const stats = useMemo(() => {
    return {
      total: articles.length,
      published: articles.filter((a) => a.status === 'published').length,
      draft: articles.filter((a) => a.status === 'draft').length,
      archived: articles.filter((a) => a.status === 'archived').length,
      views: articles.reduce((s, a) => s + a.views_count, 0),
      likes: articles.reduce((s, a) => s + a.likes_count, 0),
    }
  }, [articles])

  const filtered = useMemo(() => {
    let list = articles
    if (filter !== 'all') list = list.filter((a) => a.status === filter)
    if (categoryFilter !== 'all')
      list = list.filter((a) => a.category === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [articles, filter, categoryFilter, search])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await articlesApi.delete(deleteTarget.id)
      toast.success('Article supprimé ✅')
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeleting(false)
    }
  }

  const handleLike = async (article: Article) => {
    try {
      await articlesApi.like(article.id)
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? {
                ...a,
                likes_count: a.liked_by_me
                  ? a.likes_count - 1
                  : a.likes_count + 1,
                liked_by_me: !a.liked_by_me,
              }
            : a
        )
      )
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <FileText size={20} style={{ color: ANKU.greenDark }} />
            <h2 className="text-lg font-bold text-gray-900">Mes articles</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Partage tes conseils, recettes et actualités
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition flex items-center gap-2"
          style={{ background: ANKU.green }}
        >
          <Plus size={16} />
          Nouvel article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<FileText size={18} />}
          onClick={() => setFilter('all')}
        />
        <StatCard
          label="Publiés"
          value={stats.published}
          icon={<CheckCircle2 size={18} />}
          onClick={() => setFilter('published')}
        />
        <StatCard
          label="Brouillons"
          value={stats.draft}
          icon={<Pencil size={18} />}
          onClick={() => setFilter('draft')}
        />
        <StatCard
          label="Archivés"
          value={stats.archived}
          icon={<Archive size={18} />}
          onClick={() => setFilter('archived')}
        />
        <StatCard
          label="Vues"
          value={stats.views}
          icon={<Eye size={18} />}
        />
        <StatCard
          label="Likes"
          value={stats.likes}
          icon={<Heart size={18} />}
        />
      </div>

      {/* Filtres */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white space-y-3">
        {/* Recherche */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article…"
            className={inputCls + ' !pl-10'}
          />
        </div>

        {/* Filtres catégorie + statut */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
            <Filter size={14} />
            <span className="font-semibold">Statut :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'published', label: 'Publiés' },
              { value: 'draft', label: 'Brouillons' },
              { value: 'archived', label: 'Archivés' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value as any)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  filter === f.value
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{
                  background: filter === f.value ? ANKU.green : '#f3f4f6',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
            <Filter size={14} />
            <span className="font-semibold">Catégorie :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                categoryFilter === 'all'
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                background:
                  categoryFilter === 'all' ? ANKU.green : '#f3f4f6',
              }}
            >
              Toutes
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoryFilter(c.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  categoryFilter === c.value
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{
                  background:
                    categoryFilter === c.value ? ANKU.green : '#f3f4f6',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {articles.length === 0
              ? 'Aucun article pour l’instant'
              : 'Aucun article dans ce filtre'}
          </p>
          {articles.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white transition"
              style={{ background: ANKU.green }}
            >
              Créer mon premier article
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
            >
              {a.cover_url ? (
                <img
                  src={a.cover_url}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: ANKU.greenPale,
                    color: ANKU.greenDark,
                  }}
                >
                  <FileText size={20} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {a.title}
                  </p>
                  <StatusBadge status={a.status} />
                  <VisibilityBadge visibility={a.visibility} />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {categoryLabel(a.category)}
                  </span>
                </div>
                {a.excerpt && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {a.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(a.published_at ?? a.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={10} /> {a.views_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={10} /> {a.likes_count}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLike(a)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                    a.liked_by_me
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Liker"
                >
                  <Heart
                    size={15}
                    fill={a.liked_by_me ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(a)
                    setModalOpen(true)
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                  title="Modifier"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(a)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                  title="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ArticleModal
        open={modalOpen}
        article={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />

      <DeleteArticleModal
        article={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
