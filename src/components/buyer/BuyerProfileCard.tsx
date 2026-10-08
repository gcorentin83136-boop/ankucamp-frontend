import { Link } from 'react-router-dom'
import {
  User as UserIcon,
  Home as HomeIcon,
  MessageSquare,
  FileText,
  ShoppingBag,
  Heart,
  Calendar,
  MapPin,
  Settings,
  Star,
  Store,
  Camera,
  Leaf,
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenLight: '#8bc34a',
  greenPale: '#f0f9e8',
  cream: '#fafdf6',
}

const ICONS = [
  { icon: UserIcon, label: 'Profil', to: '/profile', colorFrom: '#34d399', colorTo: '#059669' },
  { icon: HomeIcon, label: 'Fil d’actu', to: '/feed', colorFrom: '#60a5fa', colorTo: '#2563eb' },
  { icon: MessageSquare, label: 'Messages', to: '/messages', colorFrom: '#a78bfa', colorTo: '#7c3aed' },
  { icon: FileText, label: 'Articles', to: '/dashboard/user/articles', colorFrom: '#2dd4bf', colorTo: '#0d9488' },
  { icon: ShoppingBag, label: 'Commandes', to: '/dashboard/user/orders', colorFrom: '#fbbf24', colorTo: '#d97706' },
  { icon: Heart, label: 'Wishlist', to: '/dashboard/user/wishlist', colorFrom: '#fb7185', colorTo: '#e11d48' },
  { icon: Calendar, label: 'Événements', to: '/dashboard/user/events', colorFrom: '#22d3ee', colorTo: '#0891b2' },
  { icon: MapPin, label: 'Suivis', to: '/dashboard/user/follows', colorFrom: '#f472b6', colorTo: '#db2777' },
  { icon: Star, label: 'Mes avis', to: '/dashboard/user/reviews', colorFrom: '#facc15', colorTo: '#ca8a04' },
  { icon: Store, label: 'Boutiques', to: '/', colorFrom: '#a3e635', colorTo: '#65a30d' },
  { icon: Camera, label: 'Publier', to: '/feed', colorFrom: '#4ade80', colorTo: '#16a34a' },
  { icon: Settings, label: 'Réglages', to: '/settings', colorFrom: '#94a3b8', colorTo: '#475569' },
]

export default function BuyerProfileCard() {
  const user = useAuthStore((s) => s.user)

  if (!user) return null

  const initials = (
    (user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')
  ).toUpperCase()
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  const username = (user as any).username ?? ''

  return (
    <div
      className="relative rounded-3xl overflow-hidden border shadow-sm backdrop-blur-xl"
      style={{
        borderColor: `${ANKU.green}33`,
        background: 'rgba(255, 255, 255, 0.78)',
      }}
    >
      {/* Bannière ANKU — douce + glassmorphism */}
      <div
        className="h-24 relative overflow-hidden backdrop-blur-sm"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,195,74,0.65) 0%, rgba(106,168,79,0.45) 50%, rgba(74,122,53,0.30) 100%)',
        }}
      >
        {/* Cercles décoratifs subtils */}
        <div
          className="absolute -top-10 -right-8 w-40 h-40 rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-12 -left-6 w-44 h-44 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
          }}
        />

        {/* Logo + slogan */}
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <div className="flex items-center gap-2 drop-shadow-sm">
            <Leaf size={18} className="opacity-95" />
            <p className="text-lg font-extrabold tracking-wider">ANKU</p>
          </div>

        </div>
      </div>

      {/* Contenu */}
      <div className="px-5 pt-3 pb-5">
        {/* Avatar débordant */}
        <div className="-mt-14 mb-3">
          <div className="relative inline-block">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white border-4 border-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${ANKU.greenLight} 0%, ${ANKU.greenDark} 100%)`,
                }}
              >
                {initials || '👤'}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow"
              style={{ background: ANKU.green }}
            >
              <Leaf size={11} className="text-white" />
            </div>
          </div>
        </div>

        {/* Nom + username */}
        <div className="mb-3">
          <h2 className="text-base font-extrabold text-gray-900 leading-tight">
            {fullName || 'Mon profil'}
          </h2>
          {username && (
            <p className="text-[11px] text-gray-500 font-semibold">
              @{username}
            </p>
          )}
        </div>

        {/* Stats alignées proprement */}
        <div className="flex items-center gap-6 mb-4 py-3 border-y border-gray-100">
          <div>
            <p className="text-base font-extrabold text-gray-900 leading-tight">
              0
            </p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              Abonnés
            </p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div>
            <p className="text-base font-extrabold text-gray-900 leading-tight">
              0
            </p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              Suivis
            </p>
          </div>
        </div>

        {/* Bio */}
        <div
          className="rounded-2xl p-3 mb-4 border"
          style={{
            background: `linear-gradient(135deg, rgba(240,249,232,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
            borderColor: `${ANKU.green}22`,
          }}
        >
          <p className="text-[11px] text-gray-700 leading-relaxed">
            🌿 <strong>Explore, partage, échange.</strong>
            <br />
            Découvre les producteurs près de chez toi et construis ta
            communauté engagée sur ANKU.
          </p>
        </div>

        {/* Grille d'icônes */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
          {ICONS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.to}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${item.colorFrom} 0%, ${item.colorTo} 100%)`,
                  }}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t text-center bg-white/60">
        <p className="text-[9px] text-gray-400 font-medium">
          © {new Date().getFullYear()} ANKU — Circuits courts
        </p>
      </div>
    </div>
  )
}
