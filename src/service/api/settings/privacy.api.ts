import httpClient from '../httpClient'
import type {
  PrivacySettings,
  UpdatePrivacyPayload,
  ProfileVisibility,
  AllowMessagesFrom,
} from '../../../types/settings'

export interface PrivacyResponse {
  success: boolean
  message?: string
  privacy: PrivacySettings
}

export const privacyApi = {
  get: async (): Promise<PrivacyResponse> => {
    const { data } = await httpClient.get<PrivacyResponse>('/settings/privacy')
    return data
  },

  updateAll: async (payload: UpdatePrivacyPayload): Promise<PrivacyResponse> => {
    const { data } = await httpClient.put<PrivacyResponse>(
      '/settings/privacy',
      payload
    )
    return data
  },

  updateVisibility: async (
    profile_visibility: ProfileVisibility
  ): Promise<PrivacyResponse> => {
    const { data } = await httpClient.put<PrivacyResponse>(
      '/settings/privacy/visibility',
      { profile_visibility }
    )
    return data
  },

  updateMessages: async (
    allow_messages_from: AllowMessagesFrom
  ): Promise<PrivacyResponse> => {
    const { data } = await httpClient.put<PrivacyResponse>(
      '/settings/privacy/messages',
      { allow_messages_from }
    )
    return data
  },
}

export default privacyApi
