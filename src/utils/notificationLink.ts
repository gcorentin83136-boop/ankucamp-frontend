// ============================================================
// ANKU — Résolveur de lien de notification
// Mappe les liens backend vers les routes front existantes.
// Ajoute des query params pour que la page cible sache quoi ouvrir.
// ============================================================

import type { Notification } from '../types/notification'

type Resolver = string | ((match: RegExpMatchArray) => string)

const ROUTE_MAP: Array<{ pattern: RegExp; to: Resolver }> = [
  // ----- Achats (buyer) -----
  { pattern: /^\/orders\/(\d+)\/review$/, to: (m) => `/dashboard/user/orders?review=${m[1]}` },
  { pattern: /^\/orders\/(\d+)$/, to: (m) => `/dashboard/user/orders?order=${m[1]}` },

  // ----- Ventes (seller) -----
  { pattern: /^\/dashboard\/orders\/(\d+)$/, to: (m) => `/dashboard/shop/orders?order=${m[1]}` },
  { pattern: /^\/dashboard\/reviews\/(\d+)$/, to: (m) => `/dashboard/shop/reviews?review=${m[1]}` },
  { pattern: /^\/dashboard\/followers$/, to: '/dashboard/shop' },
  { pattern: /^\/dashboard$/, to: '/dashboard/shop' },

  // ----- Réseau social -----
  { pattern: /^\/posts\/(\d+)$/, to: (m) => `/feed?post=${m[1]}` },
  { pattern: /^\/messages\/(\d+)$/, to: (m) => `/messages?conversation=${m[1]}` },
  { pattern: /^\/events\/(\d+)$/, to: (m) => `/events?event=${m[1]}` },
  { pattern: /^\/friends\/requests$/, to: '/friends?tab=requests' },

  // ----- Settings -----
  { pattern: /^\/settings\/kyc$/, to: '/kyc' },
]

// Routes statiques qui existent déjà dans App.tsx
const STATIC_ROUTES = new Set<string>([
  '/',
  '/feed',
  '/notifications',
  '/messages',
  '/friends',
  '/follows',
  '/orders',
  '/wishlist',
  '/cart',
  '/events',
  '/shops',
  '/kyc',
  '/become-pro',
  '/profile',
  '/settings',
  '/settings/account',
  '/settings/security',
  '/settings/sessions',
  '/settings/privacy',
  '/settings/notifications',
  '/settings/danger',
  '/dashboard/shop',
  '/dashboard/shop/settings',
  '/dashboard/shop/products',
  '/dashboard/shop/orders',
  '/dashboard/shop/promo',
  '/dashboard/shop/events',
  '/dashboard/shop/articles',
  '/dashboard/shop/reviews',
  '/dashboard/shop/invoices',
  '/dashboard/user',
  '/dashboard/user/orders',
  '/dashboard/user/wishlist',
  '/dashboard/user/reviews',
  '/dashboard/user/events',
  '/dashboard/user/articles',
  '/dashboard/user/refunds',
  '/dashboard/user/follows',
])

/**
 * Transforme un `notif.link` backend en route front navigable.
 * Retourne null si aucun lien (l'appelant peut alors choisir quoi faire).
 */
export function resolveNotificationLink(
  notif: Pick<Notification, 'link'>
): string | null {
  if (!notif.link) return null
  const link = notif.link

  // 1. Route statique directe
  if (STATIC_ROUTES.has(link)) return link

  // 2. Routes dynamiques front existantes (shop, product, user)
  if (/^\/shops\/\d+$/.test(link)) return link
  if (/^\/products\/\d+$/.test(link)) return link
  if (/^\/u\/[^/?#]+$/.test(link)) return link

  // 3. Mapping backend → front
  for (const { pattern, to } of ROUTE_MAP) {
    const m = link.match(pattern)
    if (m) return typeof to === 'function' ? to(m) : to
  }

  // 4. Fallback : page notifications (on ne perd pas l'utilisateur)
  console.warn('⚠️ Lien de notification inconnu, fallback /notifications :', link)
  return '/notifications'
}

export default resolveNotificationLink