import { Link } from 'react-router-dom'
import { useAuthStore } from '../../context/AuthContext'
import UserMenu from './UserMenu'
import CartIcon from './CartIcon'
import NotificationBell from './NotificationBell'
import { LogOut } from 'lucide-react'

/**
 * Header réutilisable pour les pages en thème clair
 * (feed, profil, notifications, messages…)
 * Logo ANKU → clic = retour accueil
 */
export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-white/85 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        {/* Logo ANKU → clic = accueil */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          title="Retour à l'accueil"
        >
          <img
            src="/images/anku-logo.png"
            alt="ANKU"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain transition-transform group-hover:scale-110"
            style={{ filter: 'drop-shadow(0 0 8px rgba(106,168,79,0.25))' }}
          />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-emerald-700 transition">
            ANKU
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                title="Se déconnecter"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold transition"
              >
                <LogOut size={14} />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
              <UserMenu />
              <CartIcon />
              <NotificationBell />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition px-3 py-1.5"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition shadow-md"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}