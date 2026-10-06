// ============================================================
// ANKU — API Wishlist
// ============================================================

import httpClient from './httpClient'
import type {
  WishlistResponse,
  WishlistToggleResponse,
  WishlistCheckResponse,
  WishlistIdsResponse,
} from '../../types/wishlist'

export const wishlistApi = {
  list: async (params?: {
    limit?: number
    offset?: number
  }): Promise<WishlistResponse> => {
    const { data } = await httpClient.get<WishlistResponse>('/wishlist', {
      params,
    })
    return data
  },

  toggle: async (productId: number): Promise<WishlistToggleResponse> => {
    const { data } = await httpClient.post<WishlistToggleResponse>(
      `/wishlist/${productId}`
    )
    return data
  },

  check: async (productId: number): Promise<WishlistCheckResponse> => {
    const { data } = await httpClient.get<WishlistCheckResponse>(
      `/wishlist/check/${productId}`
    )
    return data
  },

  count: async (): Promise<{ success: boolean; count: number }> => {
    const { data } = await httpClient.get<{ success: boolean; count: number }>(
      '/wishlist/count'
    )
    return data
  },

  productIds: async (): Promise<WishlistIdsResponse> => {
    const { data } = await httpClient.get<WishlistIdsResponse>(
      '/wishlist/product-ids'
    )
    return data
  },
}

export default wishlistApi
