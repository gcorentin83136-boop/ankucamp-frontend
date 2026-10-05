import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Shield,
  Monitor,
  Eye,
  Bell,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const links = [
  { to: '/settings', label: 'Vue d’ensemble', icon: SettingsIcon, end: true },
  { to: '/settings/account', label: 'Compte', icon: UserIcon },
  { to: '/settings/security', label: 'Sécurité', icon: Shield },
  { to: '/settings/sessions', label: 'Sessions', icon: Monitor },
  { to: '/settings/privacy', label: 'Confidentialité', icon: Eye },
  { to: '/settings/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings/danger', label: 'Gérer mon compte', icon: AlertTriangle },
]

export default function SettingsLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white"
              style={{ background: '#ffffff', border: `1px solid ${ANKU.green}33` }}
            >
              <ArrowLeft size={16} style={{ color: ANKU.greenDark }} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Paramètres
              </h1>
              <p className="text-xs text-gray-500">
                Gère ton compte, ta sécurité et tes préférences
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Sidebar */}
          <aside className="md:w-60 shrink-0">
            <nav
              className="rounded-2xl bg-white p-2 shadow-sm sticky top-4"
              style={{ border: `1px solid ${ANKU.green}22` }}
            >
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                        isActive ? 'text-white' : 'text-gray-700'
                      }`
                    }
                    style={({ isActive }) => ({
                      background: isActive ? ANKU.green : 'transparent',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          style={{
                            color: isActive ? '#ffffff' : ANKU.green,
                          }}
                        />
                        <span>{link.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 space-y-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
