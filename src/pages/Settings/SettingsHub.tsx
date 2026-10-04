import { Link } from 'react-router-dom'
import {
  User as UserIcon,
  Shield,
  Monitor,
  Eye,
  Bell,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const cards = [
  {
    to: '/settings/account',
    icon: UserIcon,
    title: 'Compte',
    description: 'Email, nom d’utilisateur, mot de passe, infos personnelles',
  },
  {
    to: '/settings/security',
    icon: Shield,
    title: 'Sécurité',
    description: 'Double authentification (2FA), codes de secours',
  },
  {
    to: '/settings/sessions',
    icon: Monitor,
    title: 'Sessions actives',
    description: 'Appareils connectés à ton compte',
  },
  {
    to: '/settings/privacy',
    icon: Eye,
    title: 'Confidentialité',
    description: 'Visibilité du profil, messages, indexation',
  },
  {
    to: '/settings/notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Préférences email et push',
  },
  {
    to: '/settings/danger',
    icon: AlertTriangle,
    title: 'Zone dangereuse',
    description: 'Export RGPD, suppression du compte',
    danger: true,
  },
]

export default function SettingsHub() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <h2 className="text-lg font-bold text-gray-900">
          Bienvenue dans tes paramètres 🌱
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Gère ton compte, ta sécurité et tes préférences ANKU.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.to}
              to={card.to}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white border transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{
                borderColor: card.danger ? '#fecaca' : '#e5e7eb',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: card.danger ? '#fef2f2' : ANKU.greenPale,
                  color: card.danger ? '#dc2626' : ANKU.greenDark,
                }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-bold"
                  style={{ color: card.danger ? '#991b1b' : '#0f1a0f' }}
                >
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {card.description}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
