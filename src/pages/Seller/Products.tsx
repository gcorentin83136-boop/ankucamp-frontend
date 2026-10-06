import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader,
  Search,
  AlertCircle,
  X,
  Save,
  Video,
  MapPin,
  Truck,
  Store,
  Handshake,
} from 'lucide-react'
import shopsApi from '../../service/api/shops.api'
import productsApi from '../../service/api/products.api'
import type { Product } from '../../types/product'
import type { Shop } from '../../types/shop'

// Icone "infini" en SVG inline (fallback si lucide-react ne l'exporte pas)
function InfinityIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12c2-2.5 4-4 6-4 2.5 0 4 2 4 4s-1.5 4-4 4c-2 0-4-1.5-6-4-2-2.5-4-4-6-4-2.5 0-4 2-4 4s1.5 4 4 4c2 0 4-1.5 6-4z" />
    </svg>
  )
}
// ============================================================
// DebugErrorBoundary (affiche l'erreur à l'écran)
// ============================================================
class DebugErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; info: string | null }
> {
  state = { error: null as Error | null, info: null as string | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(_error: Error, info: ErrorInfo) {
    this.setState({ info: info.componentStack ?? null })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fee2e2', color: '#7f1d1d', padding: 24, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>ERREUR — fais une capture de ce bloc</h2>
          <p style={{ marginBottom: 8 }}><b>Message :</b> {this.state.error.message}</p>
          <pre style={{ background: '#fff', padding: 12, borderRadius: 8, overflow: 'auto', marginBottom: 12, whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
          {this.state.info && (
            <>
              <p style={{ marginBottom: 8 }}><b>Component stack :</b></p>
              <pre style={{ background: '#fff', padding: 12, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{this.state.info}</pre>
            </>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatEuro(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return `${n.toFixed(2).replace('.', ',')} €`
}

// Normalise video_urls : accepte string JSON, array, null, undefined
function normalizeVideoUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string")
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string")
      }
    } catch {
      if (raw.startsWith("http")) return [raw]
    }
  }
  return []
}
// ============================================================
// MODAL CRÉATION / ÉDITION
// ============================================================
function ProductModal({
  open,
  shop,
  product,
  onClose,
  onSaved,
}: {
  open: boolean
  shop: Shop
  product: Product | null
  onClose: () => void
  onSaved: (p: Product) => void
}) {
  const isEdit = !!product
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    stock: 0,
    has_unlimited_stock: false,
    price: '',
    image_url: '',
    video_urls: [] as string[],
    delivery_pickup: true,
    delivery_shipping: false,
    delivery_meeting: false,
    meeting_point_address: '',
    meeting_point_instructions: '',
  })

  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        location: product.location ?? '',
        stock: product.stock ?? 0,
        has_unlimited_stock: product.has_unlimited_stock === 1,
        price: String(parseFloat(product.price)),
        image_url: product.image_url ?? '',
        video_urls: normalizeVideoUrls(product.video_urls),
        delivery_pickup: product.delivery_pickup === 1,
        delivery_shipping: product.delivery_shipping === 1,
        delivery_meeting: product.delivery_meeting === 1,
        meeting_point_address: product.meeting_point_address ?? '',
        meeting_point_instructions: product.meeting_point_instructions ?? '',
      })
    } else {
      setForm({
        name: '',
        description: '',
        location: '',
        stock: 0,
        has_unlimited_stock: false,
        price: '',
        image_url: '',
        video_urls: [],
        delivery_pickup: true,
        delivery_shipping: false,
        delivery_meeting: false,
        meeting_point_address: '',
        meeting_point_instructions: '',
      })
    }
  }, [open, product])

  // Upload image (DRAFT ou UPDATE)
  const handleUploadImage = async (file: File) => {
    setUploadingImage(true)
    try {
      if (isEdit && product) {
        const res = await productsApi.uploadImage(product.id, file)
        setForm({ ...form, image_url: res.url })
      } else {
        const res = await productsApi.uploadImageDraft(file)
        setForm({ ...form, image_url: res.url })
      }
      toast.success('Image mise à jour')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingImage(false)
    }
  }

  // Upload vidéo (draft OU update selon contexte)
  const handleUploadVideo = async (file: File) => {
    if (form.video_urls.length >= 3) {
      toast.error('Maximum 3 vidéos par produit')
      return
    }
    setUploadingVideo(true)
    try {
      if (isEdit && product) {
        const res = await productsApi.uploadVideo(product.id, file)
        setForm({ ...form, video_urls: normalizeVideoUrls(res.video_urls) })
      } else {
        const res = await productsApi.uploadVideoDraft(file)
        setForm({
          ...form,
          video_urls: [...form.video_urls, res.url],
        })
      }
      toast.success('Vidéo ajoutée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingVideo(false)
    }
  }

  // Supprimer une vidéo
  const handleDeleteVideo = async (url: string) => {
    if (!confirm('Supprimer cette vidéo ?')) return
    setDeletingVideo(url)
    try {
      if (isEdit && product) {
        const res = await productsApi.deleteVideo(product.id, url)
        setForm({ ...form, video_urls: normalizeVideoUrls(res.video_urls) })
      } else {
        setForm({
          ...form,
          video_urls: form.video_urls.filter((v) => v !== url),
        })
      }
      toast.success('Vidéo supprimée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeletingVideo(null)
    }
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.name.trim().length < 2) {
      toast.error('Nom requis (min 2 caractères)')
      return
    }
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) {
      toast.error('Prix invalide')
      return
    }

    // Validation livraison
    if (
      !form.delivery_pickup &&
      !form.delivery_shipping &&
      !form.delivery_meeting
    ) {
      toast.error('Choisis au moins un mode de livraison')
      return
    }

    if (form.delivery_meeting && !form.meeting_point_address.trim()) {
      toast.error("Adresse du point de RDV requise")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image_url: form.image_url || undefined,
        video_urls: form.video_urls.length > 0 ? form.video_urls : undefined,
        location: form.location.trim() || undefined,
        stock: form.has_unlimited_stock ? 0 : form.stock,
        has_unlimited_stock: form.has_unlimited_stock,
        price,
        delivery_pickup: form.delivery_pickup,
        delivery_shipping: form.delivery_shipping,
        delivery_meeting: form.delivery_meeting,
        meeting_point_address: form.delivery_meeting
          ? form.meeting_point_address.trim() || null
          : null,
        meeting_point_instructions: form.delivery_meeting
          ? form.meeting_point_instructions.trim() || null
          : null,
      }

      if (isEdit && product) {
        const res = await productsApi.update(product.id, payload)
        toast.success('Produit modifié ✅')
        onSaved(res.product)
      } else {
        const res = await productsApi.create({ shop_id: shop.id, ...payload })
        toast.success('Produit créé ✅')
        onSaved(res.product)
      }
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? `#${product?.id} · ${product?.name}`
                : 'Ajoute un produit à ta boutique'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* IMAGE */}
          <div className="flex items-center gap-4">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt=""
                className="w-24 h-24 rounded-2xl object-cover"
                style={{ border: `1px solid ${ANKU.green}33` }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
              >
                <Package size={32} />
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                {uploadingImage ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {form.image_url ? 'Changer' : 'Ajouter une image'}
              </button>
              <p className="text-[11px] text-gray-500 mt-1">
                JPG, PNG, WEBP — max 5 Mo
              </p>
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUploadImage(f)
                e.target.value = ''
              }}
            />
          </div>

          {/* NOM */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nom du produit *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Panier de légumes bio"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Décris ton produit…"
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* PRIX */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Prix (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="19.99"
              className={inputCls}
            />
          </div>

          {/* STOCK + ILLIMITÉ */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Stock
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={form.has_unlimited_stock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      has_unlimited_stock: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <InfinityIcon size={12} />
                  Stock illimité
                </span>
              </label>
            </div>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: parseInt(e.target.value) || 0 })
              }
              disabled={form.has_unlimited_stock}
              className={inputCls + (form.has_unlimited_stock ? ' opacity-50' : '')}
            />
          </div>

          {/* LOCALISATION */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Localisation
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ex : Lyon 69"
              className={inputCls}
            />
          </div>

          {/* MODES DE LIVRAISON */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Modes de livraison *
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Comment le client peut-il récupérer ce produit ?
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={form.delivery_pickup}
                onChange={(e) =>
                  setForm({ ...form, delivery_pickup: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Store size={14} style={{ color: ANKU.greenDark }} />
                  Retrait sur place
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Le client vient récupérer chez toi
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={form.delivery_shipping}
                onChange={(e) =>
                  setForm({ ...form, delivery_shipping: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Truck size={14} style={{ color: ANKU.greenDark }} />
                  Livraison
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Envoi postal ou livraison à domicile
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={form.delivery_meeting}
                onChange={(e) =>
                  setForm({ ...form, delivery_meeting: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Handshake size={14} style={{ color: ANKU.greenDark }} />
                  Point de rendez-vous
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Rencontre à un endroit défini
                </p>
              </div>
            </label>

            {form.delivery_meeting && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Adresse du point de RDV *
                  </label>
                  <input
                    type="text"
                    value={form.meeting_point_address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        meeting_point_address: e.target.value,
                      })
                    }
                    placeholder="Ex : Place Bellecour, 69002 Lyon"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Instructions (optionnel)
                  </label>
                  <textarea
                    value={form.meeting_point_instructions}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        meeting_point_instructions: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Ex : Devant la fontaine, je porte un chapeau vert"
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* VIDÉOS */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Video size={14} style={{ color: ANKU.greenDark }} />
                  Vidéos ({form.video_urls.length}/3)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Présente ton produit en vidéo (optionnel)
                </p>
              </div>
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                disabled={uploadingVideo || form.video_urls.length >= 3}
                className="rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                {uploadingVideo ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                Ajouter
              </button>
              <input
                ref={videoRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadVideo(f)
                  e.target.value = ''
                }}
              />
            </div>


            {form.video_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.video_urls.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group"
                  >
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(url)}
                      disabled={deletingVideo === url}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      {deletingVideo === url ? (
                        <Loader size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-500">
              MP4, WEBM, MOV · max 50 Mo par vidéo · 3 vidéos max
            </p>
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
            {loading ? '...' : isEdit ? 'Enregistrer' : 'Créer le produit'}
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
function DeleteProductModal({
  product,
  onClose,
  onConfirm,
  loading,
}: {
  product: Product | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!product) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Supprimer le produit
            </h3>
            <p className="text-xs text-red-700 mt-0.5">{product.name}</p>
          </div>
        </header>

        <div className="p-5">
          <p className="text-sm text-gray-700">
            Ce produit sera <strong>définitivement supprimé</strong>. Les
            commandes déjà passées resteront dans l'historique.
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
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
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
// PAGE
// ============================================================
function SellerProductsInner() {
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const shopsRes = await shopsApi.listMine()
      const mine = shopsRes.shops?.[0] ?? null
      setShop(mine)

      if (mine) {
        const res = await productsApi.listByShop(mine.id)
        setProducts(res.products)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleSaved = (p: Product) => {
    setProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id)
      if (exists) {
        return prev.map((x) => (x.id === p.id ? { ...x, ...p } : x))
      }
      return [p, ...prev]
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await productsApi.delete(deleteTarget.id)
      toast.success('Produit supprimé ✅')
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Pas de boutique
  if (!loading && !shop) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200 text-center">
        <Package size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">
          Tu dois d'abord créer ta boutique
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Va dans <strong>Ma boutique</strong> pour en créer une
        </p>
      </div>
    )
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
            <Package size={20} style={{ color: ANKU.greenDark }} />
            <h2 className="text-lg font-bold text-gray-900">Mes produits</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''} dans ta
            boutique
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
          Nouveau produit
        </button>
      </div>

      {/* Recherche */}
      {products.length > 0 && (
        <div className="rounded-2xl p-4 border border-gray-200 bg-white">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className={inputCls + ' !pl-10'}
            />
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {products.length === 0
              ? 'Aucun produit pour l’instant'
              : 'Aucun résultat'}
          </p>
          {products.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white transition"
              style={{ background: ANKU.green }}
            >
              Créer mon premier produit
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <Package size={20} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {p.name}
                  </p>
                  {Array.isArray(p.video_urls) && p.video_urls.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5 shrink-0">
                      <Video size={9} />
                      {p.video_urls.length}
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {p.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap">
                  <span className="font-bold text-gray-900">
                    {formatEuro(p.price)}
                  </span>
                  {p.has_unlimited_stock === 1 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                      <InfinityIcon size={9} />
                      Stock illimité
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background:
                          (p.stock ?? 0) > 0 ? '#dcfce7' : '#fee2e2',
                        color: (p.stock ?? 0) > 0 ? '#059669' : '#dc2626',
                      }}
                    >
                      Stock : {p.stock ?? 0}
                    </span>
                  )}
                  {p.delivery_pickup === 1 && (
                    <span className="text-[10px] text-gray-400">Retrait</span>
                  )}
                  {p.delivery_shipping === 1 && (
                    <span className="text-[10px] text-gray-400">
                      Livraison
                    </span>
                  )}
                  {p.delivery_meeting === 1 && (
                    <span className="text-[10px] text-gray-400">RDV</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(p)
                    setModalOpen(true)
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                  title="Modifier"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(p)}
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
      {shop && (
        <ProductModal
          open={modalOpen}
          shop={shop}
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <DeleteProductModal
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}


export default function SellerProducts() {
  return (
    <DebugErrorBoundary>
      <SellerProductsInner />
    </DebugErrorBoundary>
  )
}