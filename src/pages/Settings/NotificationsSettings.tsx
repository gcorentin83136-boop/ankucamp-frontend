import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, Bell } from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsToggle from '../../components/settings/SettingsToggle'
import notificationsApi from '../../service/api/settings/notifications.api'
import type { NotificationSettings } from '../../types/settings'

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  useEffect(() => {
    notificationsApi
      .get()
      .then((res) => setSettings(res.notifications))
      .catch(() => toast.error('Impossible de charger les préférences'))
      .finally(() => setLoading(false))
  }, [])

  const updateEmail = async (key: keyof NotificationSettings['email']) => {
    if (!settings) return
    const previous = settings
    const next = {
      ...settings,
      email: { ...settings.email, [key]: !settings.email[key] },
    }
    setSettings(next)
    setSaving(true)
    try {
      const res = await notificationsApi.updateEmail({
        [`email_${key}`]: next.email[key],
      } as any)
      setSettings(res.notifications)
    } catch (err: any) {
      setSettings(previous)
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const updatePush = async (key: keyof NotificationSettings['push']) => {
    if (!settings) return
    const previous = settings
    const next = {
      ...settings,
      push: { ...settings.push, [key]: !settings.push[key] },
    }
    setSettings(next)
    setSaving(true)
    try {
      const res = await notificationsApi.updatePush({
        [`push_${key}`]: next.push[key],
      } as any)
      setSettings(res.notifications)
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
        title="Notifications par email"
        description="Choisis les emails que tu veux recevoir"
        icon={<Mail size={18} />}
      >
        <SettingsToggle
          label="Mises à jour de commandes"
          description="Confirmations, expéditions, livraisons"
          checked={settings.email.order_updates}
          onChange={() => updateEmail('order_updates')}
          disabled={saving}
        />
        <SettingsToggle
          label="Nouveaux messages"
          description="Reçois un email quand on t’envoie un message"
          checked={settings.email.new_messages}
          onChange={() => updateEmail('new_messages')}
          disabled={saving}
        />
        <SettingsToggle
          label="Activité sociale"
          description="Likes, commentaires, demandes d’amis"
          checked={settings.email.social_activity}
          onChange={() => updateEmail('social_activity')}
          disabled={saving}
        />
        <SettingsToggle
          label="Emails marketing"
          description="Promotions et nouveautés ANKU"
          checked={settings.email.marketing}
          onChange={() => updateEmail('marketing')}
          disabled={saving}
        />
      </SettingsSection>

      <SettingsSection
        title="Notifications push"
        description="Notifications envoyées sur tes appareils"
        icon={<Bell size={18} />}
      >
        <SettingsToggle
          label="Mises à jour de commandes"
          checked={settings.push.order_updates}
          onChange={() => updatePush('order_updates')}
          disabled={saving}
        />
        <SettingsToggle
          label="Nouveaux messages"
          checked={settings.push.new_messages}
          onChange={() => updatePush('new_messages')}
          disabled={saving}
        />
        <SettingsToggle
          label="Activité sociale"
          checked={settings.push.social_activity}
          onChange={() => updatePush('social_activity')}
          disabled={saving}
        />
      </SettingsSection>
    </div>
  )
}
