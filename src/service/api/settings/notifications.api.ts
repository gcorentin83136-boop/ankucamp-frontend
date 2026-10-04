import httpClient from '../httpClient'
import type {
  NotificationSettings,
  UpdateNotificationsPayload,
} from '../../../types/settings'

export interface NotificationsResponse {
  success: boolean
  message?: string
  notifications: NotificationSettings
}

export const notificationsApi = {
  get: async (): Promise<NotificationsResponse> => {
    const { data } = await httpClient.get<NotificationsResponse>(
      '/settings/notifications'
    )
    return data
  },

  updateAll: async (
    payload: UpdateNotificationsPayload
  ): Promise<NotificationsResponse> => {
    const { data } = await httpClient.put<NotificationsResponse>(
      '/settings/notifications',
      payload
    )
    return data
  },

  updateEmail: async (
    payload: Partial<{
      email_order_updates: boolean
      email_new_messages: boolean
      email_social_activity: boolean
      email_marketing: boolean
    }>
  ): Promise<NotificationsResponse> => {
    const { data } = await httpClient.put<NotificationsResponse>(
      '/settings/notifications/email',
      payload
    )
    return data
  },

  updatePush: async (
    payload: Partial<{
      push_order_updates: boolean
      push_new_messages: boolean
      push_social_activity: boolean
    }>
  ): Promise<NotificationsResponse> => {
    const { data } = await httpClient.put<NotificationsResponse>(
      '/settings/notifications/push',
      payload
    )
    return data
  },
}

export default notificationsApi
