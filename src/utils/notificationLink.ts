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
  { pattern: /^\/articles\/([^/?#]+)$/, to: (m) => `/articles/${m[1]}` },
  { pattern: /^\/messages\/(\d+)$/, to: (m) => `/messages?c=${m[1]}` },
  { pattern: /^\/events\/(\d+)$/, to: (m) => `/events/${m[1]}` },
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

export function resolveNotificationLink(notif: Pick<Notification, 'link'>): string | null {
  if (!notif.link) return null

  // 1. Séparer le hash (#comment-123)
  const hashIdx = notif.link.indexOf('#')
  const hash = hashIdx >= 0 ? notif.link.slice(hashIdx) : ''
  const linkWithoutHash = hashIdx >= 0 ? notif.link.slice(0, hashIdx) : notif.link

  // 2. Séparer la query string (?order=123)
  const searchIdx = linkWithoutHash.indexOf('?')
  const search = searchIdx >= 0 ? linkWithoutHash.slice(searchIdx) : ''
  const path = searchIdx >= 0 ? linkWithoutHash.slice(0, searchIdx) : linkWithoutHash

  // 3. Trouver la route de base
  let baseTarget = ''

  if (STATIC_ROUTES.has(path)) {
    baseTarget = path
  } else if (/^\/shops\/\d+$/.test(path) || /^\/products\/\d+$/.test(path) || /^\/u\/[^/?#]+$/.test(path)) {
    baseTarget = path
  } else {
    let matched = false
    for (const { pattern, to } of ROUTE_MAP) {
      const m = path.match(pattern)
      if (m) {
        baseTarget = typeof to === 'function' ? to(m) : to
        matched = true
        break
      }
    }
    if (!matched) {
      console.warn('⚠️ Lien de notification inconnu, fallback /notifications :', notif.link)
      return '/notifications'
    }
  }

  // 4. Reconstruire l'URL finale proprement
  let finalUrl = baseTarget
  if (search && !finalUrl.includes('?')) {
    finalUrl += search
  } else if (search && finalUrl.includes('?')) {
    finalUrl += '&' + search.slice(1)
  }

  return finalUrl + hash
}

export default resolveNotificationLink