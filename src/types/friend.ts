// ============================================================
// ANKU — Types Friend (amis)
// ============================================================

export type FriendRelationStatus =
  | 'none'
  | 'pending'
  | 'accepted'
  | 'self'

export interface Friend {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  is_private?: number
  friendship_id?: number
  created_at?: string
}

export interface FriendRequest {
  id: number
  requester_id?: number
  receiver_id?: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface FriendStats {
  friends_count: number
  received_requests_count: number
}

export interface FriendsListResponse {
  success: boolean
  count: number
  friends: Friend[]
}

export interface FriendRequestsResponse {
  success: boolean
  count: number
  requests: FriendRequest[]
}

export interface FriendStatsResponse extends FriendStats {
  success: boolean
}

export interface FriendStatusResponse {
  success: boolean
  status: FriendRelationStatus
  friendship_id?: number | null
  is_requester?: boolean
}

export interface FriendActionResponse {
  success: boolean
  message: string
  friendship?: any
}