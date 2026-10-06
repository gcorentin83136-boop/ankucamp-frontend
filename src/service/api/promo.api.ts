// ============================================================
// ANKU — API Promo (buyer + seller)
// ============================================================

import httpClient from './httpClient'
import type {
  ValidatePromoPayload,
  ValidatePromoResponse,
  CreateSellerPromoPayload,
  UpdateSellerPromoPayload,
  SellerPromoResponse,
  SellerPromosListResponse,
} from '../../types/promo'

// ------------------------------------------------------------
// BUYER — valider un code
// ------------------------------------------------------------
export const promoApi = {
  validate: async (
    payload: ValidatePromoPayload
  ): Promise<ValidatePromoResponse> => {
    const { data } = await httpClient.post<ValidatePromoResponse>(
      '/promo/validate',
      payload
    )
    return data
  },
}

// ------------------------------------------------------------
// SELLER — CRUD de mes codes
// ------------------------------------------------------------
export const promoSellerApi = {
  listMine: async (params?: {
    active_only?: boolean
    limit?: number
    offset?: number
  }): Promise<SellerPromosListResponse> => {
    const { data } = await httpClient.get<SellerPromosListResponse>(
      '/promo/my',
      { params }
    )
    return data
  },

  create: async (
    payload: CreateSellerPromoPayload
  ): Promise<SellerPromoResponse> => {
    const { data } = await httpClient.post<SellerPromoResponse>(
      '/promo/my',
      payload
    )
    return data
  },

  update: async (
    id: number,
    payload: UpdateSellerPromoPayload
  ): Promise<SellerPromoResponse> => {
    const { data } = await httpClient.put<SellerPromoResponse>(
      `/promo/my/${id}`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/promo/my/${id}`)
  },
}

export default promoApi
