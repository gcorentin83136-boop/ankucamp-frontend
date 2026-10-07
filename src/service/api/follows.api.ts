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
  follows: FollowedShop[]
}

export const followsApi = {
  // Mes boutiques suivies
  mine: async (): Promise<FollowsListResponse> => {
    const { data } = await httpClient.get<FollowsListResponse>('/follows/me')
    return data
  },

  // Toggle follow/unfollow
  toggle: async (shopId: number): Promise<{ success: boolean; following: boolean }> => {
    const { data } = await httpClient.post<{ success: boolean; following: boolean }>(
      `/follows/${shopId}`
    )
    return data
  },

  // Statut (suis-je abonné ?)
  status: async (shopId: number): Promise<{ following: boolean }> => {
    const { data } = await httpClient.get<{ following: boolean }>(
      `/follows/status/${shopId}`
    )
    return data
  },
}

export default followsApi
