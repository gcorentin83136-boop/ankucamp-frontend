// ============================================================
// ANKU — UserMenu (version qui fonctionnait + fix mobile)
// ============================================================

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, MessageSquare, ShoppingBag, ShoppingCart, Heart,
  Store, Calendar, Settings, Shield, FileCheck,
  Sparkles, LogOut, ChevronDown, Home as HomeIcon,
  FileText, MapPin,
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'

const ANKU = {
  green: '#6aa84f',
  greenLight: '#8bc34a',
  greenDark: '#4a7a35',
  greenPale: '#e8f5e0',
  greenPale2: '#f0f9e8',
}

// Style injecté (nom unique pour forcer la mise à jour)
const STYLE_ID = 'anku-menu-scrollbar-v6'
if (typeof document !== 'undefined') {
  const existing = document.getElementById(STYLE_ID)
  if (existing) existing.remove()
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.innerHTML = `
    .anku-menu-scroll {
      overflow-y: scroll;
      overflow-x: hidden;
      max-height: min(85vh, 720px);
      scrollbar-width: none;
      -ms-overflow-style: none;
      scrollbar-gutter: stable;
      padding-right: 0;
      will-change: scroll-position;
    }
    .anku-menu-scroll::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
  `
  document.head.appendChild(style)
}

function computeMenuPosition(button: HTMLButtonElement | null) {
  if (!button) return { top: 0, left: 12, width: 330 }
  const rect = button.getBoundingClientRect()
  const vw = window.innerWidth
  const width = Math.min(330, vw - 24)

  let left: number
  if (vw < 640) {
    left = (vw - width) / 2
  } else {
    left = rect.right - width
    if (left < 12) left = 12
    if (left + width > vw - 12) left = vw - width - 12
  }

  return {
    top: rect.bottom + 10,
    left,
    width,
  }
}

export default function UserMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 12, width: 330 })
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Position initiale à l'ouverture
  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      setMenuStyle(computeMenuPosition(buttonRef.current))
    }
  }, [open])

  // Recalcul au resize/scroll
  useEffect(() => {
    if (!open) return
    const updatePosition = (e?: Event) => {
      // Ignorer les scrolls internes au menu
      if (e && e.target && menuRef.current?.contains(e.target as Node)) {
        return
      }
      setMenuStyle(computeMenuPosition(buttonRef.current))
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open])

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }
  }, [open])

  // Calculer la position/taille du thumb à chaque scroll
  const updateThumb = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const hasScroll = scrollHeight > clientHeight + 2
    if (!hasScroll) {
      setThumb({ height: 0, top: 0, visible: false })
      return
    }
    const thumbHeight = 40
    const maxTop = clientHeight - thumbHeight
    const scrollRatio = scrollTop / (scrollHeight - clientHeight)
    setThumb({
      height: thumbHeight,
      top: scrollRatio * maxTop,
      visible: true,
    })
  }

  useEffect(() => {
    if (open) {
      const timer = setTimeout(updateThumb, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!user) return null

  const isPro = user.role === 'professionnel'
  const isAdmin = user.role === 'admin'
  const isVerified = user.verification_status === 'verified'
  const isPending = user.verification_status === 'pending'
  const isRejected = user.verification_status === 'rejected'

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }

  const sections: {
    title: string
    items: {
      icon: typeof User
      label: string
      to: string
      badge?: string
      highlight?: boolean
    }[]
  }[] = [
    {
      title: 'Mon espace',
      items: [
        { icon: User, label: 'Mon profil ANKU', to: '/profile' },
        { icon: HomeIcon, label: "Mon fil d'actualité", to: '/feed' },
        { icon: MessageSquare, label: 'Messagerie', to: '/messages' },
      ],
    },
    {
      title: 'Mes activités',
      items: [
        { icon: ShoppingCart, label: 'Mon panier', to: '/cart' },
        { icon: ShoppingBag, label: 'Mes commandes', to: '/orders' },
        { icon: Heart, label: 'Ma wishlist', to: '/wishlist' },
        { icon: Calendar, label: 'Mes événements', to: '/events' },
        { icon: FileText, label: 'Mes articles', to: '/articles/me' },
        { icon: MapPin, label: 'Mes boutiques suivies', to: '/follows' },
      ],
    },
  ]

  if (isPro) {
    sections.push({
      title: 'Espace Pro',
      items: [
        { icon: Store, label: 'Ma boutique', to: '/shops/me' },
        { icon: ShoppingBag, label: 'Commandes', to: '/orders/seller' },
        { icon: Calendar, label: 'Mes événements créés', to: '/events/me' },
      ],
    })
  }

  if (!isPro) {
    sections.push({
      title: 'Professionnel',
      items: [
        {
          icon: Sparkles,
          label: 'Devenir Pro',
          to: '/become-pro',
          highlight: true,
        },
      ],
    })
  }

  if (isPro) {
    sections.push({
      title: 'Vérification',
      items: [
        {
          icon: FileCheck,
          label: isVerified
            ? 'Compte vérifié'
            : isPending
            ? 'KYC en cours'
            : isRejected
            ? 'KYC refusé'
            : 'Vérifier mon compte Pro',
          to: '/kyc',
          badge: isVerified ? '✓' : isPending ? '⏳' : isRejected ? '❌' : undefined,
          highlight: !isVerified,
        },
      ],
    })
  }

  // Section Admin (visible uniquement pour les admins)
  if (isAdmin) {
    sections.push({
      title: 'Administration',
      items: [
        {
          icon: Shield,
          label: 'Dashboard Admin',
          to: '/admin',
          highlight: true,
        },
      ],
    })
  }

  const menuContent = open ? (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${menuStyle.top}px`,
        left: `${menuStyle.left}px`,
        width: `${menuStyle.width}px`,
        zIndex: 999999,
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow:
          '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(106,168,79,0.15)',
        border: `1px solid ${ANKU.green}33`,
        padding: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Zone scrollable */}
      <div
        ref={scrollRef}
        className="anku-menu-scroll"
        onScroll={updateThumb}
      >
        {/* Header compact */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${ANKU.greenPale2} 0%, ${ANKU.greenPale} 100%)`,
            marginBottom: '6px',
          }}
        >
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.first_name}
                className="w-12 h-12 rounded-full object-cover"
                style={{
                  border: `2px solid ${ANKU.green}`,
                  boxShadow: `0 3px 8px ${ANKU.green}44`,
                }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
                  boxShadow: `0 3px 8px ${ANKU.green}55`,
                }}
              >
                {user.first_name?.[0]?.toUpperCase()}
                {user.last_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold truncate"
                style={{ color: '#0f1a0f' }}
              >
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                @{user.username}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: isPro ? ANKU.green : '#3b82f6',
                    color: '#ffffff',
                  }}
                >
                  {isPro ? '🏢 Pro' : '👤 Particulier'}
                </span>
                {isVerified && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: ANKU.greenLight, color: '#ffffff' }}
                  >
                    ✓ Vérifié
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} style={{ padding: '2px 0' }}>
            <p
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: '#9ca3af' }}
            >
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all mx-1.5"
                  style={{
                    color: item.highlight ? '#ffffff' : '#374151',
                    background: item.highlight ? ANKU.green : 'transparent',
                    fontWeight: item.highlight ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!item.highlight) {
                      e.currentTarget.style.background = ANKU.greenPale2
                      e.currentTarget.style.color = ANKU.greenDark
                    } else {
                      e.currentTarget.style.background = ANKU.greenDark
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.highlight) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#374151'
                    } else {
                      e.currentTarget.style.background = ANKU.green
                    }
                  }}
                >
                  <Icon
                    size={16}
                    className="shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      color: item.highlight ? '#ffffff' : ANKU.green,
                    }}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-sm font-bold">{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Paramètres + Logout */}
        <div style={{ paddingTop: '2px', borderTop: `1px solid #e5e7eb`, marginTop: '4px' }}>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all mx-1.5 mt-1.5"
            style={{ color: '#374151', fontWeight: 500 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = ANKU.greenPale2
              e.currentTarget.style.color = ANKU.greenDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#374151'
            }}
          >
            <Settings
              size={16}
              className="shrink-0 transition-transform group-hover:rotate-90"
              style={{ color: ANKU.green }}
            />
            <span>Paramètres</span>
          </Link>
          <Link
            to="/settings/security"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all mx-1.5"
            style={{ color: '#374151', fontWeight: 500 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = ANKU.greenPale2
              e.currentTarget.style.color = ANKU.greenDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#374151'
            }}
          >
            <Shield
              size={16}
              className="shrink-0 transition-transform group-hover:scale-110"
              style={{ color: ANKU.green }}
            />
            <span>Sécurité (2FA)</span>
          </Link>

          <div
            style={{
              height: '1px',
              margin: '6px 12px',
              background: '#e5e7eb',
            }}
          />

          <button
            type="button"
            onClick={handleLogout}
            className="group w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all mx-1.5 mb-1"
            style={{ color: '#dc2626', fontWeight: 500 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={16} className="shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Indicator custom (petite barre verte) */}
      {thumb.visible && (
        <div
          style={{
            position: 'absolute',
            top: `${thumb.top + 8}px`,
            right: '4px',
            width: '4px',
            height: `${thumb.height}px`,
            background: `linear-gradient(180deg, ${ANKU.greenLight} 0%, ${ANKU.green} 50%, ${ANKU.greenDark} 100%)`,
            borderRadius: '999px',
            pointerEvents: 'none',
            boxShadow: `0 0 6px ${ANKU.green}66`,
            transition: 'top 0.08s linear, height 0.1s ease',
          }}
        />
      )}
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:scale-105"
        style={{
          background: open
            ? `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`
            : 'rgba(255,255,255,0.12)',
          border: `1px solid ${open ? ANKU.greenLight : 'rgba(255,255,255,0.25)'}`,
          boxShadow: open ? `0 0 20px ${ANKU.green}88` : 'none',
          position: 'relative',
          zIndex: 999998,
        }}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.first_name}
            className="w-7 h-7 rounded-full object-cover"
            style={{ border: `2px solid ${open ? '#ffffff' : ANKU.greenLight}` }}
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: ANKU.green }}
          >
            {user.first_name?.[0]?.toUpperCase()}
            {user.last_name?.[0]?.toUpperCase()}
          </div>
        )}
        <span
          className="text-sm font-semibold hidden sm:inline"
          style={{ color: '#ffffff' }}
        >
          {user.first_name}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#ffffff',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {typeof window !== 'undefined' &&
        createPortal(menuContent, document.body)}
    </>
  )
}