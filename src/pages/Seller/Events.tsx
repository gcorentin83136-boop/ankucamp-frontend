// ============================================================
// PARTIE 2 — Page principale, onglets, modal détail
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader,
  Filter,
  MapPin,
  Users,
  Ticket,
  Globe,
  Share2,
  UserCheck,
  Ban,
  Clock,
  ChevronRight,
  Euro,
  Upload,
} from 'lucide-react'
import eventsApi from '../../service/api/events.api'
import type {
  Event,
  EventType,
  CreateEventPayload,
} from '../../types/event'
import StatCard from '../../components/seller/StatCard'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

const TYPE_LABELS: Record<EventType, string> = {
  marche: 'Marché',
  atelier: 'Atelier',
  salon: 'Salon',
  porte_ouverte: 'Porte ouverte',
  degustation: 'Dégustation',
  autre: 'Autre',
}

const TYPE_COLORS: Record<EventType, { bg: string; color: string }> = {
  marche: { bg: '#dcfce7', color: '#15803d' },
  atelier: { bg: '#dbeafe', color: '#1d4ed8' },
  salon: { bg: '#fce7f3', color: '#be185d' },
  porte_ouverte: { bg: '#fef3c7', color: '#a16207' },
  degustation: { bg: '#fed7aa', color: '#c2410c' },
  autre: { bg: '#f3f4f6', color: '#4b5563' },
}

type StatusKey = 'draft' | 'published' | 'ongoing' | 'past' | 'cancelled'

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; bg: string; icon: any }
> = {
  draft: { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6', icon: Pencil },
  published: {
    label: 'Publié',
    color: '#0891b2',
    bg: '#cffafe',
    icon: Globe,
  },
  ongoing: {
    label: 'En cours',
    color: '#d97706',
    bg: '#fef3c7',
    icon: Clock,
  },
  past: {
    label: 'Terminé',
    color: '#059669',
    bg: '#d1fae5',
    icon: UserCheck,
  },
  cancelled: {
    label: 'Annulé',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: Ban,
  },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function formatEuro(v: number | null): string {
  if (v === null || v === undefined) return 'Gratuit'
  return `${v.toFixed(2).replace('.', ',')} €`
}


function computeStatus(e: Event): StatusKey {
  if (e.status === 'cancelled') return 'cancelled'
  if (e.status === 'draft') return 'draft'
  const now = Date.now()
  const start = new Date(e.start_at).getTime()
  const end = e.end_at ? new Date(e.end_at).getTime() : start + 3600 * 1000
  if (now < start) return 'published'
  if (now >= start && now <= end) return 'ongoing'
  return 'past'
}

function isEditable(e: Event): boolean {
  return e.status !== 'cancelled'
}

function EventTypeBadge({ type }: { type: EventType }) {
  const c = TYPE_COLORS[type] ?? { bg: '#e5e7eb', color: '#374151' }
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color }}
    >
      {TYPE_LABELS[type]}
    </span>
  )
}

function StatusBadge({ status }: { status: StatusKey }) {
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

// ============================================================
// MODAL CRÉATION / ÉDITION
// ============================================================
function EventModal({
  open,
  event,
  onClose,
  onSaved,
}: {
  open: boolean
  event: Event | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!event
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'marche' as EventType,
    cover_url: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '',
    address: '',
    city: '',
    postal_code: '',
    capacity: '',
    is_free: true,
    price: '',
    status: 'published' as 'draft' | 'published',
  })

  useEffect(() => {
    if (!open) return

    const pad = (n: number) => String(n).padStart(2, '0')
    const toDate = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

    if (event) {
      const sd = new Date(event.start_at)
      const ed = event.end_at ? new Date(event.end_at) : null

      setForm({
        title: event.title,
        description: event.description ?? '',
        type: event.type,
        cover_url: event.cover_url ?? '',
        start_date: toDate(sd),
        start_time: toTime(sd),
        end_date: ed ? toDate(ed) : '',
        end_time: ed ? toTime(ed) : '',
        address: event.address ?? '',
        city: event.city ?? '',
        postal_code: event.postal_code ?? '',
        capacity: event.capacity ? String(event.capacity) : '',
        is_free: event.is_free,
        price: event.price ? String(event.price) : '',
        status: event.status === 'draft' ? 'draft' : 'published',
      })
    } else {
      setForm({
        title: '',
        description: '',
        type: 'marche',
        cover_url: '',
        start_date: '',
        start_time: '09:00',
        end_date: '',
        end_time: '',
        address: '',
        city: '',
        postal_code: '',
        capacity: '',
        is_free: true,
        price: '',
        status: 'published',
      })
    }
  }, [open, event])

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true)
    try {
      const res = await eventsApi.uploadCover(file)
      setForm((f) => ({ ...f, cover_url: res.url }))
      toast.success('Image uploadée ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingCover(false)
    }
  }

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.title.trim().length < 2) {
      toast.error('Titre requis (min 2 caractères)')
      return
    }
    if (!form.start_date || !form.start_time) {
      toast.error('Date et heure de début requises')
      return
    }
    const startISO = new Date(
      `${form.start_date}T${form.start_time}:00`
    ).toISOString()
    let endISO: string | null = null
    if (form.end_date && form.end_time) {
      endISO = new Date(
        `${form.end_date}T${form.end_time}:00`
      ).toISOString()
      if (endISO < startISO) {
        toast.error('La date de fin doit être après le début')
        return
      }
    }
    if (!form.is_free) {
      const p = parseFloat(form.price)
      if (isNaN(p) || p <= 0) {
        toast.error('Prix invalide pour un événement payant')
        return
      }
    }

    setLoading(true)
    try {
      const payload: CreateEventPayload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        cover_url: form.cover_url || null,
        type: form.type,
        start_at: startISO,
        end_at: endISO,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        is_free: form.is_free,
        price: form.is_free ? null : parseFloat(form.price),
        status: form.status,
      }

      if (isEdit && event) {
        await eventsApi.update(event.id, payload)
        toast.success('Événement modifié ✅')
      } else {
        await eventsApi.create(payload)
        toast.success('Événement créé ✅')
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
              {isEdit ? "Modifier l'événement" : 'Nouvel événement'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? `#${event?.id} · ${event?.title}`
                : 'Crée un événement pour ta communauté'}
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Image de couverture
            </label>

            <input
              ref={coverInputRef}
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
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
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
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center h-40 transition hover:bg-gray-50 disabled:opacity-50"
                style={{
                  borderColor: `${ANKU.green}55`,
                  background: ANKU.greenPale,
                }}
              >
                {uploadingCover ? (
                  <Loader
                    size={24}
                    className="animate-spin"
                    style={{ color: ANKU.greenDark }}
                  />
                ) : (
                  <Upload size={24} style={{ color: ANKU.greenDark }} />
                )}
                <p className="text-xs text-gray-600 mt-2 font-semibold">
                  {uploadingCover
                    ? 'Upload en cours…'
                    : 'Clique pour ajouter une image'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  JPG, PNG, WEBP — max 5 Mo
                </p>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Titre de l'événement *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Marché des producteurs locaux"
              className={inputCls}
              maxLength={255}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_LABELS) as EventType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                    form.type === t
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background: form.type === t ? ANKU.green : undefined,
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              placeholder="Décris ton événement…"
              className={inputCls + ' resize-none'}
              maxLength={5000}
            />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date de début *
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Clock size={12} /> Heure de début *
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date de fin
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Clock size={12} /> Heure de fin
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={14} style={{ color: ANKU.greenDark }} />
              Lieu
            </p>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Adresse complète (auto-géocodée)"
              className={inputCls}
              maxLength={500}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ville"
                className={inputCls}
                maxLength={100}
              />
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) =>
                  setForm({ ...form, postal_code: e.target.value })
                }
                placeholder="Code postal"
                className={inputCls}
                maxLength={20}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Users size={12} /> Capacité max
              </label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: e.target.value })
                }
                placeholder="Illimité"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Ticket size={12} /> Tarif
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_free: true, price: '' })}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
                    form.is_free
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{ background: form.is_free ? ANKU.green : undefined }}
                >
                  Gratuit
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_free: false })}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-1 ${
                    !form.is_free
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    background: !form.is_free ? ANKU.green : undefined,
                  }}
                >
                  <Euro size={12} /> Payant
                </button>
              </div>
            </div>
          </div>

          {!form.is_free && (
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
                placeholder="15.00"
                className={inputCls}
              />
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Visibilité
            </p>
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
// MODAL DÉTAIL
// ============================================================
function EventDetailModal({
  event,
  isOwn,
  onClose,
  onEdit,
  onCancel,
  onShare,
}: {
  event: Event | null
  isOwn: boolean
  onClose: () => void
  onEdit: (e: Event) => void
  onCancel: (e: Event) => void
  onShare: (e: Event) => void
}) {
  if (!event) return null

  const status = computeStatus(event)
  const registered = event.registered_count ?? 0
  const capacity = event.capacity
  const pct = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">
                {event.title}
              </h3>
              <StatusBadge status={status} />
              <EventTypeBadge type={event.type} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(event.start_at)} · {formatTime(event.start_at)}
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
          {event.cover_url && (
            <img
              src={event.cover_url}
              alt=""
              className="w-full h-48 object-cover rounded-2xl"
            />
          )}

          {event.description && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-500 font-semibold flex items-center gap-1">
                <Calendar size={10} /> Début
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {formatDate(event.start_at)}
              </p>
              <p className="text-xs text-gray-500">{formatTime(event.start_at)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-500 font-semibold flex items-center gap-1">
                <Ticket size={10} /> Tarif
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {event.is_free ? 'Gratuit' : formatEuro(event.price)}
              </p>
              {capacity && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Capacité : {capacity}
                </p>
              )}
            </div>
          </div>

          {event.address && (
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-500 font-semibold flex items-center gap-1">
                <MapPin size={10} /> Lieu
              </p>
              <p className="text-sm text-gray-700 mt-0.5">
                {event.address}
              </p>
              {event.city && (
                <p className="text-xs text-gray-500">
                  {event.postal_code} {event.city}
                </p>
              )}
            </div>
          )}

          {/* Inscriptions */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users size={14} style={{ color: ANKU.greenDark }} />
                Inscriptions
              </p>
              <span className="text-sm font-bold text-gray-900">
                {registered}
                {capacity ? ` / ${capacity}` : ''}
              </span>
            </div>
            {pct !== null && (
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100 ? '#dc2626' : ANKU.green,
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isOwn && isEditable(event) && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onEdit(event)
                    onClose()
                  }}
                  className="rounded-full px-4 py-2 text-sm font-bold text-white transition flex items-center gap-2"
                  style={{ background: ANKU.green }}
                >
                  <Pencil size={14} /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCancel(event)
                    onClose()
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition flex items-center gap-2"
                >
                  <Ban size={14} /> Annuler
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onShare(event)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Share2 size={14} /> Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}

// ============================================================
// MODAL SUPPRESSION
// ============================================================
function DeleteEventModal({
  event,
  onClose,
  onConfirm,
  loading,
}: {
  event: Event | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!event) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Supprimer l'événement
            </h3>
            <p className="text-xs text-red-700 mt-0.5">{event.title}</p>
          </div>
        </header>
        <div className="p-5">
          <p className="text-sm text-gray-700">
            Cet événement sera <strong>définitivement supprimé</strong> ainsi
            que toutes les inscriptions.
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
// MODAL PARTAGE EN POST
// ============================================================
function ShareEventModal({
  event,
  onClose,
}: {
  event: Event | null
  onClose: () => void
}) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setComment('')
  }, [event])

  if (!event) return null

  const handleShare = async () => {
    setLoading(true)
    try {
      await eventsApi.share(event.id, {
        share_comment: comment.trim() || null,
      })
      toast.success('Événement partagé ✅')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header
          className="px-5 py-4 border-b flex items-start justify-between gap-3"
          style={{ borderColor: '#f3f4f6', background: ANKU.greenPale }}
        >
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Partager en post
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{event.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Ajoute un commentaire (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Ex : Venez nombreux, ça va être génial !"
            className={inputCls + ' resize-none'}
          />
        </div>
        <footer
          className="px-5 py-4 border-t flex justify-end gap-2"
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
            type="button"
            onClick={handleShare}
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: ANKU.green }}
          >
            <Share2 size={14} />
            {loading ? '...' : 'Partager'}
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
export default function SellerEvents() {
  const [tab, setTab] = useState<'mine' | 'friends'>('mine')
  const [loadingMine, setLoadingMine] = useState(true)
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [mine, setMine] = useState<Event[]>([])
  const [friends, setFriends] = useState<Event[]>([])
  const [filter, setFilter] = useState<StatusKey | 'all'>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [detailEvent, setDetailEvent] = useState<Event | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [shareTarget, setShareTarget] = useState<Event | null>(null)

  const fetchMine = async () => {
    setLoadingMine(true)
    try {
      const res = await eventsApi.listMine()
      setMine(res.events)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoadingMine(false)
    }
  }

  const fetchFriends = async () => {
    setLoadingFriends(true)
    try {
      const res = await eventsApi.feed()
      setFriends(res.events)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoadingFriends(false)
    }
  }

  useEffect(() => {
    fetchMine()
    fetchFriends()
  }, [])

  const source = tab === 'mine' ? mine : friends

  const withStatus = useMemo(
    () => source.map((e) => ({ ...e, _status: computeStatus(e) })),
    [source]
  )

  const stats = useMemo(() => {
    const all = mine.map(computeStatus)
    return {
      total: mine.length,
      upcoming: all.filter((s) => s === 'published').length,
      ongoing: all.filter((s) => s === 'ongoing').length,
      past: all.filter((s) => s === 'past').length,
      cancelled: all.filter((s) => s === 'cancelled').length,
    }
  }, [mine])

  const filtered = useMemo(() => {
    if (filter === 'all') return withStatus
    return withStatus.filter((e) => e._status === filter)
  }, [withStatus, filter])

  const STATUS_FILTERS: { value: StatusKey | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'published', label: 'À venir' },
    { value: 'ongoing', label: 'En cours' },
    { value: 'past', label: 'Terminés' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'cancelled', label: 'Annulés' },
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eventsApi.delete(deleteTarget.id)
      toast.success('Événement supprimé ✅')
      setMine((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeleting(false)
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
            <Calendar size={20} style={{ color: ANKU.greenDark }} />
            <h2 className="text-lg font-bold text-gray-900">
              Mes événements
            </h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Gère tes événements et découvre ceux de tes amis
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
          Nouvel événement
        </button>
      </div>

      {/* Onglets */}
      <div className="rounded-2xl p-1 border border-gray-200 bg-white flex gap-1">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
            tab === 'mine'
              ? 'text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ background: tab === 'mine' ? ANKU.green : undefined }}
        >
          Mes événements ({mine.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
            tab === 'friends'
              ? 'text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ background: tab === 'friends' ? ANKU.green : undefined }}
        >
          Mes amis ({friends.length})
        </button>
      </div>

      {/* Stats */}
      {tab === 'mine' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<Calendar size={18} />}
            onClick={() => setFilter('all')}
          />
          <StatCard
            label="À venir"
            value={stats.upcoming}
            icon={<Globe size={18} />}
            onClick={() => setFilter('published')}
          />
          <StatCard
            label="En cours"
            value={stats.ongoing}
            icon={<Clock size={18} />}
            onClick={() => setFilter('ongoing')}
          />
          <StatCard
            label="Terminés"
            value={stats.past}
            icon={<UserCheck size={18} />}
            onClick={() => setFilter('past')}
          />
          <StatCard
            label="Annulés"
            value={stats.cancelled}
            icon={<Ban size={18} />}
            onClick={() => setFilter('cancelled')}
          />
        </div>
      )}

      {/* Filtres */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <Filter size={14} />
          <span className="font-semibold">Filtrer :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
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

      {/* Liste */}
      {(tab === 'mine' ? loadingMine : loadingFriends) ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {source.length === 0
              ? tab === 'mine'
                ? 'Aucun événement créé'
                : 'Aucun événement chez tes amis'
              : 'Aucun événement dans ce filtre'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {filtered.map((e) => {
            const status = (e as any)._status as StatusKey
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setDetailEvent(e)}
                className="w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                {e.cover_url ? (
                  <img
                    src={e.cover_url}
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
                    <Calendar size={24} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {e.title}
                    </p>
                    <StatusBadge status={status} />
                    <EventTypeBadge type={e.type} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(e.start_at)} · {formatTime(e.start_at)}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                    {e.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {e.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {e.registered_count ?? 0}
                      {e.capacity ? ` / ${e.capacity}` : ''}
                    </span>
                    {!e.is_free && (
                      <span className="flex items-center gap-1 font-semibold text-gray-600">
                        <Euro size={10} /> {formatEuro(e.price)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-gray-400 shrink-0"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <EventModal
        open={modalOpen}
        event={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchMine}
      />

      <EventDetailModal
        event={detailEvent}
        isOwn={tab === 'mine'}
        onClose={() => setDetailEvent(null)}
        onEdit={(e) => {
          setEditing(e)
          setModalOpen(true)
        }}
        onCancel={(e) => setDeleteTarget(e)}
        onShare={(e) => {
          setShareTarget(e)
          setDetailEvent(null)
        }}
      />

      <DeleteEventModal
        event={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ShareEventModal
        event={shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </div>
  )
}
