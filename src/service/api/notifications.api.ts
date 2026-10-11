// ============================================================
// ANKU — API Notifications (vraies notifications, pas settings)
// ============================================================

import httpClient from './httpClient'
import type {
  NotificationsListResponse,
  UnreadCountResponse,
  NotificationResponse,
} from '../../types/notification'

export const notificationsApi = {
  /** GET /notifications/me */
  list: async (params?: {
    limit?: number
    offset?: number
  }): Promise<NotificationsListResponse> => {
    const { data } = await httpClient.get<NotificationsListResponse>(
      '/notifications/me',
      { params }
    )
    return data
  },

  /** GET /notifications/me/unread-count */
  unreadCount: async (): Promise<UnreadCountResponse> => {
    const { data } = await httpClient.get<UnreadCountResponse>(
      '/notifications/me/unread-count'
    )
    return data
  },

  /** PUT /notifications/:id/read */
  markAsRead: async (id: number): Promise<NotificationResponse> => {
    const { data } = await httpClient.put<NotificationResponse>(
      `/notifications/${id}/read`
    )
    return data
  },

  /** PUT /notifications/read-all */
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const { data } = await httpClient.put<{ success: boolean }>(
      '/notifications/read-all'
    )
    return data
  },

  /** DELETE /notifications/:id */
  remove: async (id: number): Promise<void> => {
    await httpClient.delete(`/notifications/${id}`)
  },
}

export default notificationsApi