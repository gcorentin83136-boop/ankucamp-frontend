// ============================================================
// ANKU — Menu rapide (gauche desktop / top mobile) + DEBUG overlay
// ============================================================
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Store, ShoppingCart, Heart, MessageCircle,
  User as UserIcon, Users, Send,
} from 'lucide-react'

export interface QuickMenuProps {
  following?: boolean
  onToggleFollow?: () => void
  onContact?: () => void
}

const ITEMS = [
  { to: '/',                        icon: Home,          label: 'Accueil',    desc: 'Retour à l\'accueil ANKU',        color: '#0ba360' },
  { to: '/shops',                   icon: Store,         label: 'Boutiques',  desc: 'Toutes les boutiques',             color: '#3b82f6' },
  { to: '/cart',                    icon: ShoppingCart,  label: 'Panier',     desc: 'Mon panier',                       color: '#ef4444' },
  { to: '/dashboard/user/wishlist', icon: Heart,         label: 'Wishlist',   desc: 'Mes favoris',                      color: '#06b6d4' },
  { to: '/messages',                icon: MessageCircle, label: 'Messages',   desc: 'Ma messagerie',                    color: '#8b5cf6' },
  { to: '/dashboard/user',          icon: UserIcon,      label: 'Mon espace', desc: 'Tableau de bord acheteur',         color: '#14b8a6' },
]

export default function QuickMenu({
  following,
  onToggleFollow,
  onContact,
}: QuickMenuProps = {}) {
  const [hovered, setHovered] = useState<string | null>(null)

  // ===== Items avec actions ajoutees =====
  const allItems: {
    to?: string
    icon: any
    label: string
    desc: string
    color: string
    onClick?: () => void
  }[] = [...ITEMS]

  if (onToggleFollow) {
    allItems.push({
      icon: Users,
      label: following ? 'Suivi·e' : 'Suivre',
      desc: following ? 'Ne plus suivre cette boutique' : 'Suivre cette boutique',
      color: following ? '#94a3b8' : '#0ba360',
      onClick: onToggleFollow,
    })
  }
  if (onContact) {
    allItems.push({
      icon: Send,
      label: 'Contacter',
      desc: 'Envoyer un message au vendeur',
      color: '#10b981',
      onClick: onContact,
    })
  }

  return (
    <>
      {/* ===== Desktop : vertical a GAUCHE ===== */}
      <div className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-[9999]">
        <div className="flex flex-col gap-2 rounded-2xl bg-white/95 backdrop-blur-xl p-2 shadow-xl border border-gray-100">
          {allItems.map((it, i) => {
            const Icon = it.icon
            const key = it.label + i
            const isHovered = hovered === key

            const commonProps = {
              onMouseEnter: () => setHovered(key),
              onMouseLeave: () => setHovered(null),
              title: it.label,
              className:
                'relative w-10 h-10 rounded-xl flex items-center justify-center transition hover:scale-110 text-white shadow-sm',
              style: { background: it.color },
            }

            return it.to ? (
              <NavLink key={key} to={it.to} {...commonProps}>
                <Icon size={18} />
                {isHovered && <Tooltip label={it.label} desc={it.desc} />}
              </NavLink>
            ) : (
              <button key={key} type="button" onClick={it.onClick} {...commonProps}>
                <Icon size={18} />
                {isHovered && <Tooltip label={it.label} desc={it.desc} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== Mobile : horizontal en HAUT ===== */}
      <div className="lg:hidden fixed top-2 left-1/2 -translate-x-1/2 z-[9999]">
        <div className="flex flex-row gap-2 rounded-2xl bg-white/95 backdrop-blur-xl p-2 shadow-xl border border-gray-100">
          {allItems.map((it, i) => {
            const Icon = it.icon
            const key = it.label + i
            const isHovered = hovered === key

            const commonProps = {
              onMouseEnter: () => setHovered(key),
              onMouseLeave: () => setHovered(null),
              title: it.label,
              className:
                'relative w-9 h-9 rounded-xl flex items-center justify-center transition text-white shadow-sm',
              style: { background: it.color },
            }

            return it.to ? (
              <NavLink key={key} to={it.to} {...commonProps}>
                <Icon size={16} />
                {isHovered && <Tooltip label={it.label} desc={it.desc} />}
              </NavLink>
            ) : (
              <button key={key} type="button" onClick={it.onClick} {...commonProps}>
                <Icon size={16} />
                {isHovered && <Tooltip label={it.label} desc={it.desc} />}
              </button>
            )
          })}
        </div>
      </div>


    </>
  )
}

// ============================================================
// Petit tooltip local (pas de dependance externe)
// ============================================================
function Tooltip({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] px-2.5 py-1.5 shadow-xl pointer-events-none z-[10001]">
      <div className="font-bold">{label}</div>
      <div className="text-white/70 text-[10px]">{desc}</div>
    </div>
  )
}
