import httpClient from '../httpClient'
import type { ActiveSession } from '../../../types/settings'

export interface SessionsListResponse {
  success: boolean
  count: number
  sessions: ActiveSession[]
}

export interface SimpleResponse {
  success: boolean
  message: string
}

export interface RevokeAllResponse extends SimpleResponse {
  count: number
}

export const sessionsApi = {
  list: async (): Promise<SessionsListResponse> => {
    const { data } = await httpClient.get<SessionsListResponse>(
      '/settings/sessions'
    )
    return data
  },

  revoke: async (sessionId: number): Promise<SimpleResponse> => {
    const { data } = await httpClient.delete<SimpleResponse>(
      `/settings/sessions/${sessionId}`
    )
    return data
  },

  revokeAll: async (): Promise<RevokeAllResponse> => {
    const { data } = await httpClient.delete<RevokeAllResponse>(
      '/settings/sessions/all'
    )
    return data
  },
}

export default sessionsApi
