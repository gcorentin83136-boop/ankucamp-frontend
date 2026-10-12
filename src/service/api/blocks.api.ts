// ============================================================
// ANKU — API Blocage / Restriction
// ============================================================

import httpClient from './httpClient'

export interface BlockedUser {
  id: number
  created_at: string
  user_id: number
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export interface BlockStatus {
  is_blocked: boolean
  is_restricted: boolean
}

export const blocksApi = {
  /** POST /users/:id/block */
  block: async (userId: number) => {
    const { data } = await httpClient.post<{ success: boolean }>(
      `/users/${userId}/block`
    )
    return data
  },

  /** DELETE /users/:id/block */
  unblock: async (userId: number) => {
    const { data } = await httpClient.delete<{ success: boolean }>(
      `/users/${userId}/block`
    )
    return data
  },

  /** POST /users/:id/restrict */
  restrict: async (userId: number) => {
    const { data } = await httpClient.post<{ success: boolean }>(
      `/users/${userId}/restrict`
    )
    return data
  },

  /** DELETE /users/:id/restrict */
  unrestrict: async (userId: number) => {
    const { data } = await httpClient.delete<{ success: boolean }>(
      `/users/${userId}/restrict`
    )
    return data
  },

  /** GET /users/me/blocked */
  listBlocked: async (): Promise<{ blocked: BlockedUser[]; count: number }> => {
    const { data } = await httpClient.get<{
      success: boolean
      count: number
      blocked: BlockedUser[]
    }>('/users/me/blocked')
    return { blocked: data.blocked ?? [], count: data.count ?? 0 }
  },

  /** GET /users/me/restricted */
  listRestricted: async (): Promise<{
    restricted: BlockedUser[]
    count: number
  }> => {
    const { data } = await httpClient.get<{
      success: boolean
      count: number
      restricted: BlockedUser[]
    }>('/users/me/restricted')
    return { restricted: data.restricted ?? [], count: data.count ?? 0 }
  },

  /** GET /users/:id/block-status */
  status: async (userId: number): Promise<BlockStatus> => {
    const { data } = await httpClient.get<{
      success: boolean
      is_blocked: boolean
      is_restricted: boolean
    }>(`/users/${userId}/block-status`)
    return { is_blocked: data.is_blocked, is_restricted: data.is_restricted }
  },
}

export default blocksApi