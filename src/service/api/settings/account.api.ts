import httpClient from '../httpClient'
import type { UserMe } from '../../../types/user'
import type {
  ChangeEmailPayload,
  ChangePasswordPayload,
  ChangeUsernamePayload,
  UpdateInfoPayload,
  DeactivateAccountPayload,
} from '../../../types/settings'

// Le backend renvoie "account" (pas "user") et parfois partiel
export type AccountPartial = Partial<UserMe>

export interface AccountResponse {
  success: boolean
  message?: string
  account: AccountPartial
}

export interface SimpleResponse {
  success: boolean
  message: string
}

export const accountApi = {
  getMe: async (): Promise<AccountResponse> => {
    // ✅ ?_t=... évite le 304 (cache navigateur)
    const { data } = await httpClient.get<AccountResponse>(
      `/settings/account?_t=${Date.now()}`
    )
    return data
  },

  changeEmail: async (payload: ChangeEmailPayload): Promise<AccountResponse> => {
    const { data } = await httpClient.put<AccountResponse>(
      '/settings/account/email',
      payload
    )
    return data
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<SimpleResponse> => {
    const { data } = await httpClient.put<SimpleResponse>(
      '/settings/account/password',
      payload
    )
    return data
  },

  changeUsername: async (payload: ChangeUsernamePayload): Promise<AccountResponse> => {
    const { data } = await httpClient.put<AccountResponse>(
      '/settings/account/username',
      payload
    )
    return data
  },

  updateInfo: async (payload: UpdateInfoPayload): Promise<AccountResponse> => {
    const { data } = await httpClient.put<AccountResponse>(
      '/settings/account/info',
      payload
    )
    return data
  },

  deactivate: async (payload: DeactivateAccountPayload): Promise<SimpleResponse> => {
    const { data } = await httpClient.delete<SimpleResponse>(
      '/settings/account/deactivate',
      { data: payload }
    )
    return data
  },
}

export default accountApi
