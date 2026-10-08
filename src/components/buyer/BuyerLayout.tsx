// ============================================================
// ANKU — BuyerLayout (sidebar dashboard acheteur)
// ============================================================

import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Star,
  Calendar,
  FileText,
  RotateCcw,
  MapPin,
  ArrowLeft,
  User as UserIcon,
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const links = [
  { to: '/dashboard/user', label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
  { to: '/dashboard/user/orders', label: 'Mes commandes', icon: ShoppingBag },
  { to: '/dashboard/user/wishlist', label: 'Ma wishlist', icon: Heart },
  { to: '/dashboard/user/reviews', label: 'Mes avis', icon: Star },
  { to: '/dashboard/user/events', label: 'Mes événements', icon: Calendar },
  { to: '/dashboard/user/articles', label: 'Mes articles', icon: FileText },
  { to: '/dashboard/user/refunds', label: 'Mes retours', icon: RotateCcw },
  { to: '/dashboard/user/follows', label: 'Boutiques suivies', icon: MapPin },
]

export default function BuyerLayout() {
  const user = useAuthStore((s) => s.user)

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
                  Mon espace
                </h1>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  <UserIcon size={10} />
                  {user?.first_name?.[0]?.toUpperCase()}
                  {user?.last_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Commandes, favoris, avis et activités
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
                          style={{ color: isActive ? '#ffffff' : ANKU.green }}
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
