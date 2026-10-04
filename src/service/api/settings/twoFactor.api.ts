import httpClient from '../httpClient'
import type {
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorVerifyResponse,
} from '../../../types/settings'

export interface TwoFactorStatusResponse extends TwoFactorStatus {
  success: boolean
}

export interface SimpleResponse {
  success: boolean
  message: string
}

export const twoFactorApi = {
  getStatus: async (): Promise<TwoFactorStatusResponse> => {
    const { data } = await httpClient.get<TwoFactorStatusResponse>(
      '/auth/2fa/status'
    )
    return data
  },

  setup: async (): Promise<TwoFactorSetupResponse> => {
    const { data } = await httpClient.post<TwoFactorSetupResponse>(
      '/auth/2fa/setup'
    )
    return data
  },

  verify: async (code: string): Promise<TwoFactorVerifyResponse> => {
    const { data } = await httpClient.post<TwoFactorVerifyResponse>(
      '/auth/2fa/verify',
      { code }
    )
    return data
  },

  disable: async (password: string, code: string): Promise<SimpleResponse> => {
    const { data } = await httpClient.post<SimpleResponse>(
      '/auth/2fa/disable',
      { password, code }
    )
    return data
  },
}

export default twoFactorApi
