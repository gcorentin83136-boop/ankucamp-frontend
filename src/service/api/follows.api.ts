// ============================================================
// ANKU — API Follows (boutiques suivies)
// ============================================================

import httpClient from './httpClient'

export interface FollowedShop {
  id: number
  shop_id: number
  follower_id: number
  created_at: string
  name?: string
  logo_url?: string | null
  city?: string | null
  slug?: string
}

export interface FollowsListResponse {
  success: boolean
  count?: number
  follows: FollowedShop[]
}

export const followsApi = {
  // ----------------------------------------------------------
  // Mes boutiques suivies
  // ----------------------------------------------------------
  mine: async (): Promise<FollowsListResponse> => {
    const { data } = await httpClient.get<FollowsListResponse>('/follows/me')
    return data
  },

  mineCount: async (): Promise<{ success: boolean; count: number }> => {
    const { data } = await httpClient.get<{ success: boolean; count: number }>(
      '/follows/me/count'
    )
    return data
  },

  // ----------------------------------------------------------
  // Toggle follow/unfollow (URL corrigée pour matcher le backend)
  // ----------------------------------------------------------
  toggle: async (
    shopId: number
  ): Promise<{ success: boolean; following: boolean; message?: string }> => {
    const { data } = await httpClient.post<{
      success: boolean
      following: boolean
      message?: string
    }>(`/follows/shop/${shopId}`)
    return data
  },

  // ----------------------------------------------------------
  // Statut (suis-je abonné ?)
  // ----------------------------------------------------------
  status: async (shopId: number): Promise<{ following: boolean }> => {
    const { data } = await httpClient.get<{ success: boolean; following: boolean }>(
      `/follows/shop/${shopId}/status`
    )
    return data
  },

  // ----------------------------------------------------------
  // Nombre de followers d'une boutique
  // ----------------------------------------------------------
  shopFollowersCount: async (
    shopId: number
  ): Promise<{ success: boolean; count: number }> => {
    const { data } = await httpClient.get<{ success: boolean; count: number }>(
      `/follows/shop/${shopId}/count`
    )
    return data
  },
}

export default followsApi
