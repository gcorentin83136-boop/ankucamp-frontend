import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { FolderTree, Plus, Pencil, Trash2, X } from 'lucide-react'
import { categoriesAdminApi } from '../../service/api/admin.api'
import type { Category } from '../../types/admin'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

// ============================================================
// Modal create/edit
// ============================================================
function CategoryModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setSlug(editing?.slug ?? '')
      setIcon(editing?.icon ?? '')
      setImageUrl(editing?.image_url ?? '')
    }
  }, [open, editing])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Nom et slug requis')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        icon: icon.trim() || null,
        image_url: imageUrl.trim() || null,
      }
      if (editing) {
        await categoriesAdminApi.update(editing.id, payload)
        toast.success('Catégorie modifiée')
      } else {
        await categoriesAdminApi.create(payload)
        toast.success('Catégorie créée')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <h3 className="text-base font-bold text-gray-900">
            {editing ? 'Modifier' : 'Créer'} une catégorie
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!editing) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                  )
                }
              }}
              placeholder="Ex : Fruits et légumes"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="fruits-legumes"
              className={inputCls + ' font-mono text-xs'}
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Minuscules, chiffres et tirets uniquement
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Icône (optionnel)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ex : 🍎 ou apple"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              URL image (optionnel)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {loading ? '...' : editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null
}

// ============================================================
// Page
// ============================================================
export default function AdminCategories() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await categoriesAdminApi.list()
      setCategories(res.categories)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return
    try {
      await categoriesAdminApi.delete(cat.id)
      toast.success('Catégorie supprimée')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-3"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <FolderTree size={20} style={{ color: ANKU.greenDark }} />
            <h2 className="text-lg font-bold text-gray-900">Catégories</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Gère les catégories de produits de la plateforme.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition flex items-center gap-2 shrink-0"
          style={{ background: ANKU.green }}
        >
          <Plus size={16} />
          Nouvelle catégorie
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6 text-center">Chargement…</p>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <FolderTree size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucune catégorie</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white transition"
              style={{ background: ANKU.green }}
            >
              Créer la première
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ background: ANKU.greenPale }}
                >
                  {c.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    /{c.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                    title="Modifier"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
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
      </div>

      <CategoryModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />
    </div>
  )
}
