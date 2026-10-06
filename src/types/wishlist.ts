// ============================================================
// ANKU — Types Wishlist
// ============================================================

import type { Product } from './product'

export interface WishlistItem {
  id: number
  product_id: number
  product?: Product
  created_at: string
}

export interface WishlistResponse {
  success: boolean
  count: number
  items: WishlistItem[]
}

export interface WishlistToggleResponse {
  success: boolean
  message: string
  in_wishlist: boolean
}

export interface WishlistCheckResponse {
  success: boolean
  in_wishlist: boolean
}

export interface WishlistIdsResponse {
  success: boolean
  product_ids: number[]
}
