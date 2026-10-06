import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  Ticket,
  Calendar,
  FileText,
  Star,
  ArrowLeft,
} from 'lucide-react'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const links = [
  { to: '/dashboard/shop', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/dashboard/shop/settings', label: 'Ma boutique', icon: Store },
  { to: '/dashboard/shop/products', label: 'Produits', icon: Package },
  { to: '/dashboard/shop/orders', label: 'Commandes', icon: ShoppingBag },
  { to: '/dashboard/shop/promo', label: 'Codes promo', icon: Ticket },
  { to: '/dashboard/shop/events', label: 'Evenements', icon: Calendar },
  { to: '/dashboard/shop/articles', label: 'Articles', icon: FileText },
  { to: '/dashboard/shop/reviews', label: 'Avis recus', icon: Star },
]

export default function SellerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white"
              style={{ background: '#ffffff', border: '1px solid #6aa84f33' }}
            >
              <ArrowLeft size={16} style={{ color: ANKU.greenDark }} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Ma boutique
                </h1>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: ANKU.green }}
                >
                  PRO
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Gere ta boutique, tes produits et tes commandes
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          <aside className="md:w-60 shrink-0">
            <nav
              className="rounded-2xl bg-white p-2 shadow-sm sticky top-4"
              style={{ border: '1px solid #6aa84f22' }}
            >
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ' +
                      (isActive ? 'text-white' : 'text-gray-700')
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

          <main className="flex-1 min-w-0 space-y-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
