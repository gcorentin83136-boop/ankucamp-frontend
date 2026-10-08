import { Link } from 'react-router-dom'
import {
  Store,
  Home as HomeIcon,
  MessageSquare,
  Heart,
  ShoppingBag,
  FileText,
  Calendar,
  RotateCcw,
  Star,
  MapPin,
  Sparkles,
  ArrowRight,
  Compass,
  Tag,
} from 'lucide-react'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenLight: '#8bc34a',
  greenPale: '#f0f9e8',
}

export interface Shortcut {
  icon: any
  label: string
  to: string
  desc?: string
  gradient: string
}

export type ShortcutsContext =
  | 'cart'
  | 'wishlist'
  | 'orders'
  | 'reviews'
  | 'events'
  | 'articles'
  | 'refunds'
  | 'follows'
  | 'dashboard'
  | 'default'

// ------------------------------------------------------------
// SHORTCUTS PRÉDÉFINIS
// ------------------------------------------------------------
const S = {
  shops: {
    icon: Store,
    label: 'Boutiques',
    desc: 'Nos producteurs',
    to: '/shops',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  feed: {
    icon: HomeIcon,
    label: "Fil d'actu",
    desc: 'Nouveautés',
    to: '/feed',
    gradient: 'from-blue-400 to-blue-600',
  },
  messages: {
    icon: MessageSquare,
    label: 'Messagerie',
    desc: 'Vendeurs',
    to: '/messages',
    gradient: 'from-violet-400 to-violet-600',
  },
  wishlist: {
    icon: Heart,
    label: 'Wishlist',
    desc: 'Favoris',
    to: '/dashboard/user/wishlist',
    gradient: 'from-rose-400 to-rose-600',
  },
  orders: {
    icon: ShoppingBag,
    label: 'Commandes',
    desc: 'Mes achats',
    to: '/dashboard/user/orders',
    gradient: 'from-amber-400 to-amber-600',
  },
  events: {
    icon: Calendar,
    label: 'Événements',
    desc: 'Marchés & ateliers',
    to: '/dashboard/user/events',
    gradient: 'from-cyan-400 to-cyan-600',
  },
  articles: {
    icon: FileText,
    label: 'Articles',
    desc: 'Conseils & recettes',
    to: '/dashboard/user/articles',
    gradient: 'from-teal-400 to-teal-600',
  },
  refunds: {
    icon: RotateCcw,
    label: 'Retours',
    desc: 'Remboursements',
    to: '/dashboard/user/refunds',
    gradient: 'from-orange-400 to-orange-600',
  },
  reviews: {
    icon: Star,
    label: 'Mes avis',
    desc: 'Ce que j’ai dit',
    to: '/dashboard/user/reviews',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  follows: {
    icon: MapPin,
    label: 'Boutiques suivies',
    desc: 'Mes abonnements',
    to: '/dashboard/user/follows',
    gradient: 'from-pink-400 to-pink-600',
  },
  cart: {
    icon: ShoppingBag,
    label: 'Panier',
    desc: 'Finaliser',
    to: '/cart',
    gradient: 'from-lime-400 to-lime-600',
  },
  promos: {
    icon: Tag,
    label: 'Codes promo',
    desc: 'Réductions',
    to: '/',
    gradient: 'from-purple-400 to-purple-600',
  },
}

const SHORTCUTS_BY_CONTEXT: Record<ShortcutsContext, Shortcut[]> = {
  cart: [S.shops, S.feed, S.wishlist, S.orders, S.events, S.messages],
  wishlist: [S.shops, S.feed, S.cart, S.events, S.articles, S.messages],
  orders: [S.shops, S.wishlist, S.feed, S.events, S.messages, S.cart],
  reviews: [S.shops, S.orders, S.wishlist, S.events, S.articles, S.feed],
  events: [S.shops, S.feed, S.orders, S.wishlist, S.messages, S.cart],
  articles: [S.feed, S.shops, S.events, S.wishlist, S.orders, S.cart],
  refunds: [S.orders, S.shops, S.messages, S.wishlist, S.feed, S.cart],
  follows: [S.shops, S.feed, S.wishlist, S.cart, S.events, S.articles],
  dashboard: [S.shops, S.feed, S.wishlist, S.events, S.messages, S.articles],
  default: [S.shops, S.feed, S.messages, S.wishlist, S.orders, S.events],
}

const TITLES: Record<ShortcutsContext, { title: string; subtitle: string }> = {
  cart: {
    title: "Continue d'explorer",
    subtitle: 'Découvre d’autres produits pendant que tu y es',
  },
  wishlist: {
    title: 'À découvrir aussi',
    subtitle: 'Enrichis ta liste de favoris',
  },
  orders: {
    title: 'Envie de nouveautés ?',
    subtitle: 'Parcours ANKU et trouve ton prochain coup de cœur',
  },
  reviews: {
    title: 'Tu aimes partager ?',
    subtitle: 'Découvre d’autres produits à tester',
  },
  events: {
    title: 'Envie d’autres sorties ?',
    subtitle: 'Explore ANKU et ses événements',
  },
  articles: {
    title: 'Continue à lire',
    subtitle: 'D’autres articles t’attendent',
  },
  refunds: {
    title: 'Besoin d’aide ?',
    subtitle: 'Contacte le vendeur ou explore la plateforme',
  },
  follows: {
    title: 'Découvre plus de boutiques',
    subtitle: 'Suis tes producteurs préférés',
  },
  dashboard: {
    title: 'Explore ANKU',
    subtitle: 'Des raccourcis pour tout trouver',
  },
  default: {
    title: 'Découvre ANKU',
    subtitle: 'Des raccourcis pour naviguer plus vite',
  },
}

// ------------------------------------------------------------
// COMPOSANT
// ------------------------------------------------------------
interface Props {
  context?: ShortcutsContext
  title?: string
  subtitle?: string
  shortcuts?: Shortcut[]
  compact?: boolean
}

export default function BuyerShortcuts({
  context = 'default',
  title,
  subtitle,
  shortcuts,
  compact = false,
}: Props) {
  const items = shortcuts ?? SHORTCUTS_BY_CONTEXT[context] ?? SHORTCUTS_BY_CONTEXT.default
  const heading = TITLES[context] ?? TITLES.default
  const finalTitle = title ?? heading.title
  const finalSubtitle = subtitle ?? heading.subtitle

  return (
    <div
      className="relative rounded-3xl p-5 sm:p-6 border overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #f0f9e8 0%, #ffffff 50%, #f7fef1 100%)',
        borderColor: `${ANKU.green}33`,
      }}
    >
      {/* Décor : 2 cercles flous vert pale */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${ANKU.greenLight}55 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${ANKU.green}44 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenLight} 0%, ${ANKU.greenDark} 100%)`,
          }}
        >
          <Compass size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-gray-900 leading-tight flex items-center gap-1.5">
            {finalTitle}
            <Sparkles
              size={14}
              style={{ color: ANKU.green }}
              className="shrink-0"
            />
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{finalSubtitle}</p>
        </div>
      </div>

      {/* Grid */}
      <div
        className={
          'relative grid gap-2.5 ' +
          (compact
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')
        }
      >
        {items.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.to + s.label}
              to={s.to}
              className="group relative rounded-2xl p-3 bg-white border border-gray-100 hover:border-transparent hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              {/* Hover gradient bg */}
              <div
                className={
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' +
                  s.gradient
                }
              />

              <div className="relative">
                <div
                  className={
                    'w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 bg-gradient-to-br shadow-sm ' +
                    s.gradient
                  }
                >
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-white leading-tight flex items-center gap-1 transition-colors">
                  {s.label}
                  <ArrowRight
                    size={10}
                    className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                  />
                </p>
                {s.desc && (
                  <p className="text-[10px] text-gray-500 group-hover:text-white/80 leading-tight transition-colors">
                    {s.desc}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
