// ============================================================
// ANKU — API Friends
// ============================================================

import httpClient from './httpClient'
import type {
  FriendsListResponse,
  FriendRequestsResponse,
  FriendStatsResponse,
  FriendStatusResponse,
  FriendActionResponse,
} from '../../types/friend'

export const friendsApi = {
  // ----------------------------------------------------------
  // LECTURE
  // ----------------------------------------------------------

  /** GET /friends/me */
  listMine: async (): Promise<FriendsListResponse> => {
    const { data } = await httpClient.get<FriendsListResponse>('/friends/me')
    return data
  },

  /** GET /friends/requests/received */
  receivedRequests: async (): Promise<FriendRequestsResponse> => {
    const { data } = await httpClient.get<FriendRequestsResponse>(
      '/friends/requests/received'
    )
    return data
  },

  /** GET /friends/requests/sent */
  sentRequests: async (): Promise<FriendRequestsResponse> => {
    const { data } = await httpClient.get<FriendRequestsResponse>(
      '/friends/requests/sent'
    )
    return data
  },

  /** GET /friends/stats */
  stats: async (): Promise<FriendStatsResponse> => {
    const { data } = await httpClient.get<FriendStatsResponse>('/friends/stats')
    return data
  },

  /** GET /friends/status/:userId */
  status: async (userId: number): Promise<FriendStatusResponse> => {
    const { data } = await httpClient.get<FriendStatusResponse>(
      `/friends/status/${userId}`
    )
    return data
  },

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  /** POST /friends/request/:userId */
  sendRequest: async (userId: number): Promise<FriendActionResponse> => {
    const { data } = await httpClient.post<FriendActionResponse>(
      `/friends/request/${userId}`
    )
    return data
  },

  /** PUT /friends/:id/accept */
  accept: async (friendshipId: number): Promise<FriendActionResponse> => {
    const { data } = await httpClient.put<FriendActionResponse>(
      `/friends/${friendshipId}/accept`
    )
    return data
  },

  /** PUT /friends/:id/decline */
  decline: async (friendshipId: number): Promise<FriendActionResponse> => {
    const { data } = await httpClient.put<FriendActionResponse>(
      `/friends/${friendshipId}/decline`
    )
    return data
  },

  /** DELETE /friends/:id/cancel */
  cancel: async (friendshipId: number): Promise<FriendActionResponse> => {
    const { data } = await httpClient.delete<FriendActionResponse>(
      `/friends/${friendshipId}/cancel`
    )
    return data
  },

  /** DELETE /friends/:userId */
  remove: async (userId: number): Promise<void> => {
    await httpClient.delete(`/friends/${userId}`)
  },
}

export default friendsApi