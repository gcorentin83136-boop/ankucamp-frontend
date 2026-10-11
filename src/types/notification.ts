// ============================================================
// ANKU — Types Notification
// ============================================================

export type NotificationType =
  | 'order'
  | 'review'
  | 'message'
  | 'social'
  | 'system'
  | 'welcome'

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  content: string
  link: string | null
  data: string | null
  is_read: number
  read_at: string | null
  created_at: string
}

export interface NotificationsListResponse {
  success: boolean
  count: number
  notifications: Notification[]
}

export interface UnreadCountResponse {
  success: boolean
  count: number
}

export interface NotificationResponse {
  success: boolean
  notification: Notification
}