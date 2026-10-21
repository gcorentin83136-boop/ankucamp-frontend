import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Eye,
  MessageSquare,
  Search,
  Ban,
  ShieldOff,
  ChevronRight,
  Clock,
  Phone,
  MessageCircle,
} from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsToggle from '../../components/settings/SettingsToggle'
import privacyApi from '../../service/api/settings/privacy.api'
import type {
  PrivacySettings as PrivacySettingsType,
  ProfileVisibility,
  AllowMessagesFrom,
  OnlineStatusVisibility,
  CallPermissions,
} from '../../types/settings'

const selectCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-400 focus:bg-white transition appearance-none cursor-pointer'

const visibilityOptions: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Public — tout le monde peut voir' },
  { value: 'friends', label: 'Amis uniquement' },
  { value: 'private', label: 'Privé — personne' },
]

const messagesOptions: { value: AllowMessagesFrom; label: string }[] = [
  { value: 'everyone', label: 'Tout le monde' },
  { value: 'friends', label: 'Amis uniquement' },
  { value: 'nobody', label: 'Personne' },
]

const onlineStatusOptions: { value: OnlineStatusVisibility; label: string }[] = [
  { value: 'everyone', label: 'Tout le monde' },
  { value: 'friends', label: 'Amis uniquement' },
  { value: 'nobody', label: 'Personne' },
]

const callPermissionsOptions: { value: CallPermissions; label: string }[] = [
  { value: 'everyone', label: 'Tout le monde' },
  { value: 'friends', label: 'Amis uniquement' },
  { value: 'nobody', label: 'Personne' },
]

export default function PrivacySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null)

  useEffect(() => {
    privacyApi
      .get()
      .then((res) => setSettings(res.privacy))
      .catch(() => toast.error('Impossible de charger les paramètres'))
      .finally(() => setLoading(false))
  }, [])

  const update = async (patch: Partial<PrivacySettingsType>) => {
    if (!settings) return
    const previous = settings
    const next = { ...settings, ...patch }
    setSettings(next)
    setSaving(true)
    try {
      const res = await privacyApi.updateAll(patch)
      setSettings(res.privacy)
      toast.success('Mis à jour')
    } catch (err: any) {
      setSettings(previous)
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return <p className="text-sm text-gray-500 p-4">Chargement…</p>
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Visibilité du profil"
        description="Qui peut voir ton profil ?"
        icon={<Eye size={18} />}
      >
        <select
          value={settings.profile_visibility}
          onChange={(e) =>
            update({ profile_visibility: e.target.value as ProfileVisibility })
          }
          disabled={saving}
          className={selectCls}
        >
          {visibilityOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SettingsSection>

      <SettingsSection
        title="Messages privés"
        description="Qui peut t'envoyer un message ?"
        icon={<MessageSquare size={18} />}
      >
        <select
          value={settings.allow_messages_from}
          onChange={(e) =>
            update({ allow_messages_from: e.target.value as AllowMessagesFrom })
          }
          disabled={saving}
          className={selectCls}
        >
          {messagesOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SettingsSection>

      {/* 🆕 Messages avancés */}
      <SettingsSection
        title="Messages avancés"
        description="Contrôle les indicateurs visibles dans la messagerie"
        icon={<MessageCircle size={18} />}
      >
        <SettingsToggle
          label="Accusés de lecture"
          description="Affiche le double-check bleu quand tu lis un message. Si désactivé, tu ne vois pas non plus les accusés des autres."
          checked={settings.read_receipts}
          onChange={(v) => update({ read_receipts: v })}
          disabled={saving}
        />
        <SettingsToggle
          label="Indicateur de frappe"
          description="Affiche « en train d'écrire… » aux autres quand tu rédiges un message."
          checked={settings.typing_indicator}
          onChange={(v) => update({ typing_indicator: v })}
          disabled={saving}
        />
      </SettingsSection>

      {/* 🆕 Statut en ligne */}
      <SettingsSection
        title="Statut en ligne"
        description="Qui peut voir que tu es connecté ?"
        icon={<Clock size={18} />}
      >
        <select
          value={settings.online_status_visibility}
          onChange={(e) =>
            update({
              online_status_visibility: e.target.value as OnlineStatusVisibility,
            })
          }
          disabled={saving}
          className={selectCls}
        >
          {onlineStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SettingsSection>

      {/* 🆕 Appels entrants */}
      <SettingsSection
        title="Appels entrants"
        description="Qui peut t'appeler (vocal ou vidéo) ?"
        icon={<Phone size={18} />}
      >
        <select
          value={settings.call_permissions}
          onChange={(e) =>
            update({ call_permissions: e.target.value as CallPermissions })
          }
          disabled={saving}
          className={selectCls}
        >
          {callPermissionsOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SettingsSection>

      <SettingsSection
        title="Informations visibles"
        description="Choisis ce que les autres voient"
        icon={<Search size={18} />}
      >
        <SettingsToggle
          label="Afficher mon email"
          description="Ton email sera visible sur ton profil public"
          checked={settings.show_email}
          onChange={(v) => update({ show_email: v })}
          disabled={saving}
        />
        <SettingsToggle
          label="Afficher mon téléphone"
          description="Ton numéro sera visible sur ton profil public"
          checked={settings.show_phone}
          onChange={(v) => update({ show_phone: v })}
          disabled={saving}
        />
        <SettingsToggle
          label="Indexable par les moteurs de recherche"
          description="Ton profil pourra apparaître dans Google, etc."
          checked={settings.search_indexable}
          onChange={(v) => update({ search_indexable: v })}
          disabled={saving}
        />
      </SettingsSection>

      <SettingsSection
        title="Comptes bloqués"
        description="Gère les utilisateurs que tu ne veux plus voir."
        icon={<Ban size={18} />}
      >
        <Link
          to="/settings/blocked?tab=blocked"
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <Ban size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">
                Voir les personnes bloquées
              </p>
              <p className="text-xs text-gray-500">
                Bloque ou débloque des utilisateurs
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-gray-400 group-hover:text-gray-700 transition shrink-0"
          />
        </Link>
      </SettingsSection>

      <SettingsSection
        title="Comptes restreints"
        description="Gère les utilisateurs qui ne peuvent plus interagir avec toi."
        icon={<ShieldOff size={18} />}
      >
        <Link
          to="/settings/blocked?tab=restricted"
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldOff size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">
                Voir les personnes restreintes
              </p>
              <p className="text-xs text-gray-500">
                Restreins ou retire des restrictions
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-gray-400 group-hover:text-gray-700 transition shrink-0"
          />
        </Link>
      </SettingsSection>
    </div>
  )
}
