import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Store,
  Save,
  Image as ImageIcon,
  Upload,
  Calendar,
  EyeOff,
  RotateCcw,
  Phone,
  AlertCircle,
  Plus,
  Loader,
  Pencil,
  Trash2,
  MapPin,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import shopsApi from '../../service/api/shops.api'
import type { Shop, ShopSettings } from '../../types/shop'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsToggle from '../../components/settings/SettingsToggle'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

// ============================================================
// NORMALISATION DES SETTINGS (backend peut renvoyer 0/1 OU true/false)
// ============================================================

function normalizeSettings(s: any): ShopSettings {
  const raw = s ?? {}

  const vacationMode =
    raw.vacation?.mode === true ||
    raw.vacation?.mode === 1 ||
    raw.vacation?.mode === "1" ||
    raw.vacation_mode === 1 ||
    raw.vacation_mode === true

  const isHidden =
    raw.is_hidden === true ||
    raw.is_hidden === 1 ||
    raw.is_hidden === "1"

  const acceptsReturns =
    raw.returns?.accepts === true ||
    raw.returns?.accepts === 1 ||
    raw.accepts_returns === 1 ||
    raw.accepts_returns === true

  return {
    id: raw.id ?? 0,
    shop_id: raw.shop_id ?? 0,
    vacation_mode: vacationMode ? 1 : 0,
    vacation_message: raw.vacation?.message ?? raw.vacation_message ?? null,
    vacation_until: raw.vacation?.until ?? raw.vacation_until ?? null,
    is_hidden: isHidden ? 1 : 0,
    accepts_returns: acceptsReturns ? 1 : 0,
    return_days: Number(raw.returns?.days ?? raw.return_days ?? 14),
    shipping_zones: raw.shipping_zones
      ? typeof raw.shipping_zones === "string"
        ? raw.shipping_zones
        : JSON.stringify(raw.shipping_zones)
      : null,
    contact_phone: raw.contact?.phone ?? raw.contact_phone ?? null,
    contact_email: raw.contact?.email ?? raw.contact_email ?? null,
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  }
}

// ============================================================
// FORMULAIRE CRÉATION BOUTIQUE
// ============================================================
function CreateShopForm({ onCreated }: { onCreated: (shop: Shop) => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      toast.error('Nom requis (min 2 caractères)')
      return
    }
    setLoading(true)
    try {
      const res = await shopsApi.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        phone: form.phone.trim() || undefined,
      })
      toast.success('Boutique créée !')
      onCreated(res.shop)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nom de la boutique *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex : Ferme du Soleil"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Présente ta boutique en quelques mots…"
          className={inputCls + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Adresse
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="12 rue des Lilas"
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ville
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Lyon"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Code postal
          </label>
          <input
            type="text"
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            placeholder="69001"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="06 12 34 56 78"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
        style={{ background: ANKU.green }}
      >
        <Plus size={16} />
        {loading ? 'Création…' : 'Créer ma boutique'}
      </button>
    </form>
  )
}

// ============================================================
// MODAL SUPPRESSION
// ============================================================
function DeleteShopModal({
  open,
  shopName,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean
  shopName: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (open) setConfirmText('')
  }, [open])

  if (!open) return null

  const isValid = confirmText.trim() === shopName

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-red-900">
              Supprimer la boutique
            </h3>
            <p className="text-xs text-red-700 mt-0.5">
              Cette action est irréversible
            </p>
          </div>
        </header>

        <div className="p-5 space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              Tous tes produits, codes promo et événements liés à cette
              boutique seront supprimés. Les commandes déjà passées resteront
              dans l'historique.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tape{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-700 font-bold">
                {shopName}
              </code>{' '}
              pour confirmer
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={shopName}
              className={inputCls}
              autoFocus
            />
          </div>
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
            disabled={!isValid || loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
            {loading ? '...' : 'Supprimer définitivement'}
          </button>
        </footer>
      </div>
    </div>
  )
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function SellerSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<Shop | null>(null)
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingReturns, setSavingReturns] = useState(false)
  const [savedReturns, setSavedReturns] = useState(false)
  const [savedContact, setSavedContact] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
  })

  const [contactForm, setContactForm] = useState({
    contact_phone: '',
    contact_email: '',
  })

  const [returnsForm, setReturnsForm] = useState({
    accepts_returns: false,
    return_days: 14,
  })

  const logoInputRef = useRef<HTMLInputElement>(null)

  const fillForm = (s: Shop) => {
    setForm({
      name: s.name,
      description: s.description ?? '',
      address: s.address ?? '',
      city: s.city ?? '',
      postal_code: s.postal_code ?? '',
      phone: s.phone ?? '',
    })
  }

  const fillSettingsForms = (s: ShopSettings) => {
    setContactForm({
      contact_phone: s.contact_phone ?? '',
      contact_email: s.contact_email ?? '',
    })
    setReturnsForm({
      accepts_returns: s.accepts_returns === 1,
      return_days: s.return_days ?? 14,
    })
  }

  const refetchSettings = async () => {
    if (!shop) return
    try {
      const s = await shopsApi.getSettings(shop.id)
      const normalized = normalizeSettings(s.settings)
      setSettings(normalized)
      fillSettingsForms(normalized)
    } catch {
      // silent
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const shopsRes = await shopsApi.listMine()
      const mine = shopsRes.shops?.[0] ?? null
      setShop(mine)

      if (mine) {
        fillForm(mine)
        try {
          const s = await shopsApi.getSettings(mine.id)
          const normalized = normalizeSettings(s.settings)
          setSettings(normalized)
          fillSettingsForms(normalized)
        } catch {
          setSettings(null)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    if (form.name.trim().length < 2) {
      toast.error('Le nom doit faire au moins 2 caractères')
      return
    }
    setSaving(true)
    try {
      const res = await shopsApi.update(shop.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        phone: form.phone.trim() || undefined,
      })
      setShop(res.shop)
      setEditing(false)
      toast.success('Boutique mise à jour')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (shop) fillForm(shop)
    setEditing(false)
  }

  const handleUploadLogo = async (file: File) => {
    if (!shop) return
    setUploadingLogo(true)
    try {
      const res = await shopsApi.uploadLogo(shop.id, file)
      toast.success('Logo mis à jour')
      setShop({ ...shop, logo_url: res.url })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleVacation = async (checked: boolean) => {
    if (!shop) return
    try {
      await shopsApi.updateVacation(shop.id, {
        vacation_mode: checked,
        vacation_message: settings?.vacation_message ?? null,
        vacation_until: settings?.vacation_until ?? null,
      })
      await refetchSettings()
      toast.success(checked ? 'Mode vacances activé ✅' : 'Mode vacances désactivé ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleHidden = async (checked: boolean) => {
    if (!shop) return
    try {
      await shopsApi.updateHidden(shop.id, checked)
      await refetchSettings()
      toast.success(checked ? 'Boutique masquée ✅' : 'Boutique visible ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    setSavingContact(true)
    try {
      await shopsApi.updateContact(shop.id, {
        contact_phone: contactForm.contact_phone.trim() || null,
        contact_email: contactForm.contact_email.trim() || null,
      })
      await refetchSettings()
      setSavedContact(true)
      setTimeout(() => setSavedContact(false), 2500)
      toast.success('Contact public enregistré ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSavingContact(false)
    }
  }

  const handleSaveReturns = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    setSavingReturns(true)
    try {
      await shopsApi.updateReturns(shop.id, {
        accepts_returns: returnsForm.accepts_returns,
        return_days: returnsForm.return_days,
      })
      await refetchSettings()
      setSavedReturns(true)
      setTimeout(() => setSavedReturns(false), 2500)
      toast.success('Politique de retours enregistrée ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSavingReturns(false)
    }
  }

  const handleDelete = async () => {
    if (!shop) return
    setDeleting(true)
    try {
      await shopsApi.delete(shop.id)
      toast.success('Boutique supprimée')
      setDeleteOpen(false)
      setShop(null)
      setSettings(null)
      navigate('/dashboard/shop')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const hasReturnsChanges =
    !!settings &&
    (returnsForm.accepts_returns !== (settings.accepts_returns === 1) ||
      returnsForm.return_days !== settings.return_days)

  const hasContactChanges =
    !!settings &&
    ((contactForm.contact_phone || '') !== (settings.contact_phone || '') ||
      (contactForm.contact_email || '') !== (settings.contact_email || ''))

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    )
  }

  // CAS 1 : PAS ENCORE DE BOUTIQUE
  if (!shop) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-2xl p-6"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
            border: `1px solid ${ANKU.green}22`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: '#ffffff', color: ANKU.greenDark }}
            >
              <Store size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Créer ta boutique
              </h2>
              <p className="text-sm text-gray-600">
                Ouvre ta boutique pour vendre tes produits
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
          <CreateShopForm onCreated={(s) => { setShop(s); fillForm(s) }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header boutique SANS bandeau vert */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        {editing ? (
          <form onSubmit={handleSaveInfo} className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <h3 className="text-base font-bold text-gray-900">
                Modifier ma boutique
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                  style={{ background: ANKU.green }}
                >
                  <Save size={14} />
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
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
                rows={3}
                placeholder="Présente ta boutique…"
                className={inputCls + ' resize-none'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  CP
                </label>
                <input
                  type="text"
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm({ ...form, postal_code: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
              />
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-20 h-20 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0"
                style={{ background: ANKU.green }}
              >
                {shop.name[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{shop.name}</h2>

              {shop.description ? (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {shop.description}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic mt-1">
                  Aucune description pour l'instant
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-gray-500">
                {shop.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {shop.city}
                    {shop.postal_code ? ` (${shop.postal_code})` : ''}
                  </span>
                )}
                {shop.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {shop.phone}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full px-4 py-2 text-sm font-bold transition flex items-center gap-2 shrink-0"
              style={{ background: ANKU.green, color: '#ffffff' }}
            >
              <Pencil size={14} />
              Modifier
            </button>
          </div>
        )}
      </div>

      {/* Logo */}
      <SettingsSection
        title="Logo de la boutique"
        description="Une image carrée est recommandée"
        icon={<ImageIcon size={18} />}
      >
        <div className="flex items-center gap-4">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt="Logo"
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: `1px solid ${ANKU.green}33` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
            >
              <Store size={28} />
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
              style={{ background: ANKU.green }}
            >
              {uploadingLogo ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {shop.logo_url ? 'Changer le logo' : 'Ajouter un logo'}
            </button>
            <p className="text-[11px] text-gray-500 mt-1">
              JPG, PNG, WEBP — max 5 Mo
            </p>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleUploadLogo(f)
              e.target.value = ''
            }}
          />
        </div>
      </SettingsSection>

      {/* Mode vacances */}
      {settings && (
        <SettingsSection
          title="Mode vacances"
          description="Indique à tes clients que tu es temporairement indisponible"
          icon={<Calendar size={18} />}
        >
          <SettingsToggle
            label="Activer le mode vacances"
            description="Les commandes seront refusées pendant cette période"
            checked={Number(settings.vacation_mode) === 1}
            onChange={handleVacation}
          />
          {settings.vacation_message && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Message actuel : « {settings.vacation_message} »
            </div>
          )}
        </SettingsSection>
      )}

      {/* Visibilité */}
      {settings && (
        <SettingsSection
          title="Visibilité de la boutique"
          description="Masquer ta boutique la rend invisible aux clients"
          icon={<EyeOff size={18} />}
        >
          <SettingsToggle
            label="Masquer ma boutique"
            description="Utile pour préparer ta boutique avant de la publier"
            checked={Number(settings.is_hidden) === 1}
            onChange={handleHidden}
          />
        </SettingsSection>
      )}

            {/* Politique de retours */}
      {settings && (
        <SettingsSection
          title="Politique de retours"
          description="Indique si tu acceptes les retours et sous quel délai"
          icon={<RotateCcw size={18} />}
        >
          <form onSubmit={handleSaveReturns} className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: settings.accepts_returns === 1 ? '#dcfce7' : '#f3f4f6',
                  color: settings.accepts_returns === 1 ? '#059669' : '#6b7280',
                }}
              >
                {settings.accepts_returns === 1
                  ? `Retours acceptés · ${settings.return_days} jours`
                  : 'Retours refusés'}
              </span>
              {savedReturns && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  ✓ Enregistré
                </span>
              )}
            </div>

            <SettingsToggle
              label="Accepter les retours"
              description="Autoriser les clients à renvoyer les produits"
              checked={returnsForm.accepts_returns}
              onChange={(v) =>
                setReturnsForm({ ...returnsForm, accepts_returns: v })
              }
            />

            {returnsForm.accepts_returns && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Délai de retour (jours)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={returnsForm.return_days}
                    onChange={(e) =>
                      setReturnsForm({
                        ...returnsForm,
                        return_days: parseInt(e.target.value) || 14,
                      })
                    }
                    className={inputCls + ' max-w-[120px]'}
                  />
                  <div className="flex gap-2">
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setReturnsForm({ ...returnsForm, return_days: d })
                        }
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
                          returnsForm.return_days === d
                            ? 'text-white'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{
                          background:
                            returnsForm.return_days === d
                              ? ANKU.green
                              : undefined,
                        }}
                      >
                        {d}j
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={savingReturns || !hasReturnsChanges}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                <Save size={14} />
                {savingReturns ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              {!hasReturnsChanges && (
                <span className="text-[11px] text-gray-400 italic">
                  Aucun changement
                </span>
              )}
            </div>
          </form>
        </SettingsSection>
      )}

            {/* Contact public */}
      {settings && (
        <SettingsSection
          title="Contact public"
          description="Téléphone et email visibles sur ta boutique"
          icon={<Phone size={18} />}
        >
          <form onSubmit={handleSaveContact} className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(settings.contact_phone || settings.contact_email) ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  ✓ Contact configuré
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Aucun contact public
                </span>
              )}
              {savedContact && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  ✓ Enregistré
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Phone size={12} /> Téléphone
                </span>
              </label>
              <input
                type="tel"
                value={contactForm.contact_phone}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    contact_phone: e.target.value,
                  })
                }
                placeholder="06 12 34 56 78"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} /> Email
                </span>
              </label>
              <input
                type="email"
                value={contactForm.contact_email}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    contact_email: e.target.value,
                  })
                }
                placeholder="contact@ma-boutique.fr"
                className={inputCls}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={savingContact || !hasContactChanges}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: ANKU.green }}
              >
                <Save size={14} />
                {savingContact ? 'Enregistrement…' : 'Enregistrer le contact'}
              </button>
              {!hasContactChanges && (
                <span className="text-[11px] text-gray-400 italic">
                  Aucun changement
                </span>
              )}
            </div>
          </form>
        </SettingsSection>
      )}

      {/* GÉRER MA BOUTIQUE (ex-Zone dangereuse) */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #fecaca', background: '#ffffff' }}
      >
        <header
          className="px-5 py-3 border-b"
          style={{ borderColor: '#fee2e2', background: '#fef2f2' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="text-base font-bold text-red-800">
              Gérer ma boutique
            </h3>
          </div>
        </header>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700">
            Supprimer ta boutique effacera tous tes produits, codes promo et
            événements liés. Cette action est <strong>irréversible</strong>.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
          >
            <Trash2 size={16} />
            Supprimer ma boutique
          </button>
        </div>
      </section>

      {/* Modal suppression */}
      <DeleteShopModal
        open={deleteOpen}
        shopName={shop.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
