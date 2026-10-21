import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Mail,
  Bell,
  CheckCircle2,
  MessageSquare,
  Music,
} from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsToggle from '../../components/settings/SettingsToggle'
import notificationsApi from '../../service/api/settings/notifications.api'
import type {
  NotificationSettings,
  CallRingtone,
} from '../../types/settings'

// ============================================================
// Helper : toast unifié
// ============================================================
function toastOk(detail?: string) {
  toast.success(
    <div className="flex items-start gap-2">
      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-sm">Modifications prises en compte ✅</p>
        {detail && <p className="text-xs text-gray-600 mt-0.5">{detail}</p>}
      </div>
    </div>,
    { duration: 3000 }
  )
}

// Labels humains pour les toasts
const EMAIL_LABELS: Record<string, string> = {
  order_updates: 'Mises à jour de commandes (email)',
  new_messages: 'Nouveaux messages (email)',
  social_activity: 'Activité sociale (email)',
  marketing: 'Emails marketing',
}

const PUSH_LABELS: Record<string, string> = {
  order_updates: 'Mises à jour de commandes (push)',
  new_messages: 'Nouveaux messages (push)',
  social_activity: 'Activité sociale (push)',
}

const RINGTONE_OPTIONS: { value: CallRingtone; label: string }[] = [
  { value: 'nature', label: '🌿 Nature ANKU (par défaut)' },
  { value: 'classic', label: '📞 Classique' },
  { value: 'silent', label: '🔇 Silencieux' },
]

const selectCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-400 focus:bg-white transition appearance-none cursor-pointer'

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [chatBubbleEnabled, setChatBubbleEnabled] = useState(true)

  useEffect(() => {
    notificationsApi
      .get()
      .then((res) => setSettings(res.notifications))
      .catch(() => toast.error('Impossible de charger les préférences'))
      .finally(() => setLoading(false))
  }, [])

  const toggleChatBubble = () => {
    const next = !chatBubbleEnabled
    setChatBubbleEnabled(next)
    localStorage.setItem('anku_chat_bubble_enabled', String(next))
    window.dispatchEvent(new CustomEvent('anku:chat-bubble-toggle', { detail: next }))
    toastOk(`Bulles de chat : ${next ? 'activées' : 'désactivées'}`)
  }

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
      toastOk(
        `${EMAIL_LABELS[key] ?? key} : ${next.email[key] ? 'activé' : 'désactivé'}`
      )
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
      toastOk(
        `${PUSH_LABELS[key] ?? key} : ${next.push[key] ? 'activé' : 'désactivé'}`
      )
    } catch (err: any) {
      setSettings(previous)
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const updateMessaging = async (patch: Partial<NotificationSettings['messaging']>) => {
    if (!settings) return
    const previous = settings
    const next = {
      ...settings,
      messaging: { ...settings.messaging, ...patch },
    }
    setSettings(next)
    setSaving(true)
    try {
      const res = await notificationsApi.updateAll(patch as any)
      setSettings(res.notifications)
      toastOk('Préférences messagerie mises à jour')
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
        title="Bulles de chat"
        description="Affiche une mini-fenêtre de discussion quand tu reçois un message"
        icon={<MessageSquare size={18} />}
      >
        <SettingsToggle
          label="Activer les bulles de chat"
          description="Si désactivé, tu recevras une simple notification en haut à droite"
          checked={chatBubbleEnabled}
          onChange={toggleChatBubble}
        />
      </SettingsSection>

      {/* 🆕 Notifications messagerie */}
      <SettingsSection
        title="Messagerie"
        description="Sons et sonneries pour la messagerie et les appels"
        icon={<Music size={18} />}
      >
        <SettingsToggle
          label="Sonnerie des messages"
          description="Joue un son court à chaque nouveau message reçu"
          checked={settings.messaging.notification_sound}
          onChange={(v) => updateMessaging({ notification_sound: v })}
          disabled={saving}
        />

        <div className="pt-3 mt-3 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Sonnerie d'appel
          </label>
          <select
            value={settings.messaging.call_ringtone}
            onChange={(e) =>
              updateMessaging({ call_ringtone: e.target.value as CallRingtone })
            }
            disabled={saving}
            className={selectCls}
          >
            {RINGTONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1.5">
            Sonnerie jouée pendant les appels entrants (vocal et vidéo)
          </p>
        </div>
      </SettingsSection>

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
          description="Reçois un email quand on t'envoie un message"
          checked={settings.email.new_messages}
          onChange={() => updateEmail('new_messages')}
          disabled={saving}
        />
        <SettingsToggle
          label="Activité sociale"
          description="Likes, commentaires, demandes d'amis"
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