// ============================================================
// ANKU — AdminLayout (même design que SettingsLayout)
// ============================================================

import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Users,
  FolderTree,
  Ticket,
  ScrollText,
  Database,
  ArrowLeft,
  Shield,
} from 'lucide-react'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const links = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/kyc', label: 'Validation KYC', icon: FileCheck },
  { to: '/admin/moderation', label: 'Modération', icon: AlertTriangle },
  { to: '/admin/refunds', label: 'Remboursements', icon: RotateCcw },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
  { to: '/admin/promo', label: 'Codes promo', icon: Ticket },
  { to: '/admin/audit', label: 'Journal d’audit', icon: ScrollText },
  { to: '/admin/backup', label: 'Sauvegardes', icon: Database },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white"
              style={{ background: '#ffffff', border: `1px solid ${ANKU.green}33` }}
              title="Retour au site"
            >
              <ArrowLeft size={16} style={{ color: ANKU.greenDark }} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Dashboard Admin
                </h1>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  <Shield size={10} />
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Vue globale, validation et modération
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
