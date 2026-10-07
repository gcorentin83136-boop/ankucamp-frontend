// ============================================================
// ANKU — API Refunds (demandes de remboursement)
// ============================================================

import httpClient from './httpClient'
import type {
  RefundsListResponse,
  RefundResponse,
  CreateRefundPayload,
} from '../../types/refund'

export const refundsApi = {
  // Mes demandes (buyer)
  listMine: async (): Promise<RefundsListResponse> => {
    const { data } = await httpClient.get<RefundsListResponse>('/refunds/me')
    return data
  },

  // Créer une demande
  request: async (
    payload: CreateRefundPayload
  ): Promise<RefundResponse> => {
    const { data } = await httpClient.post<RefundResponse>(
      '/refunds/request',
      payload
    )
    return data
  },

  // Voir une demande
  getOne: async (id: number): Promise<RefundResponse> => {
    const { data } = await httpClient.get<RefundResponse>(`/refunds/${id}`)
    return data
  },
}

export default refundsApi
