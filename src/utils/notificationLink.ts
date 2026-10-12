// ============================================================
// ANKU — Résolveur de lien de notification
// ============================================================

import type { Notification } from '../types/notification'

type Resolver = string | ((match: RegExpMatchArray) => string)

const ROUTE_MAP: Array<{ pattern: RegExp; to: Resolver }> = [
  { pattern: /^\/orders\/(\d+)\/review$/, to: (m) => `/dashboard/user/orders?order=${m[1]}` },
  { pattern: /^\/orders\/(\d+)$/, to: (m) => `/dashboard/user/orders?order=${m[1]}` },
  { pattern: /^\/dashboard\/orders\/(\d+)$/, to: (m) => `/dashboard/shop/orders?order=${m[1]}` },
  { pattern: /^\/dashboard\/reviews\/(\d+)$/, to: (m) => `/dashboard/shop/reviews?review=${m[1]}` },
  { pattern: /^\/dashboard\/followers$/, to: '/dashboard/shop' },
  { pattern: /^\/dashboard$/, to: '/dashboard/shop' },
  { pattern: /^\/posts\/(\d+)$/, to: (m) => `/feed?post=${m[1]}` },
  { pattern: /^\/messages\/(\d+)$/, to: (m) => `/messages?conversation=${m[1]}` },
  { pattern: /^\/events\/(\d+)$/, to: (m) => `/events?event=${m[1]}` },
  { pattern: /^\/friends\/requests$/, to: '/friends?tab=requests' },
  { pattern: /^\/settings\/kyc$/, to: '/kyc' },
]

const STATIC_ROUTES = new Set<string>([
  '/', '/feed', '/notifications', '/messages', '/friends', '/follows',
  '/orders', '/wishlist', '/cart', '/events', '/shops', '/kyc',
  '/become-pro', '/profile',
  '/settings', '/settings/account', '/settings/security', '/settings/sessions',
  '/settings/privacy', '/settings/notifications', '/settings/danger',
  '/dashboard/shop', '/dashboard/shop/settings', '/dashboard/shop/products',
  '/dashboard/shop/orders', '/dashboard/shop/promo', '/dashboard/shop/events',
  '/dashboard/shop/articles', '/dashboard/shop/reviews', '/dashboard/shop/invoices',
  '/dashboard/user', '/dashboard/user/orders', '/dashboard/user/wishlist',
  '/dashboard/user/reviews', '/dashboard/user/events', '/dashboard/user/articles',
  '/dashboard/user/refunds', '/dashboard/user/follows',
])

function splitLink(link: string): { path: string; search: string } {
  const i = link.indexOf('?')
  if (i < 0) return { path: link, search: '' }
  return { path: link.slice(0, i), search: link.slice(i) }
}

function mergeQuery(target: string, extra: string): string {
  if (!extra) return target
  const [basePath, baseQuery] = target.split('?')
  const base = new URLSearchParams(baseQuery || '')
  const add = new URLSearchParams(extra.slice(1))
  for (const [k, v] of add.entries()) {
    if (!base.has(k)) base.set(k, v)
  }
  const qs = base.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function resolveNotificationLink(
  notif: Pick<Notification, 'link'>
): string | null {
  if (!notif.link) return null
  const { path, search } = splitLink(notif.link)

  if (STATIC_ROUTES.has(path)) return search ? `${path}${search}` : path

  if (/^\/shops\/\d+$/.test(path)) return `${path}${search}`
  if (/^\/products\/\d+$/.test(path)) return `${path}${search}`
  if (/^\/u\/[^/?#]+$/.test(path)) return `${path}${search}`

  for (const { pattern, to } of ROUTE_MAP) {
    const m = path.match(pattern)
    if (m) {
      const target = typeof to === 'function' ? to(m) : to
      return mergeQuery(target, search)
    }
  }

  console.warn('⚠️ Lien de notification inconnu, fallback /notifications :', notif.link)
  return '/notifications'
}

export default resolveNotificationLink