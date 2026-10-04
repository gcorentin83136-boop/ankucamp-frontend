import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, MessageSquare, Search } from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsToggle from '../../components/settings/SettingsToggle'
import privacyApi from '../../service/api/settings/privacy.api'
import type {
  PrivacySettings as PrivacySettingsType,
  ProfileVisibility,
  AllowMessagesFrom,
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
        description="Qui peut t’envoyer un message ?"
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
    </div>
  )
}
