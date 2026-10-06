// ============================================================
// ANKU — API Shops
// ============================================================

import httpClient from './httpClient'
import type {
  ShopResponse,
  ShopSettingsResponse,
  ShopsListResponse,
  ShopsNearbyResponse,
  CreateShopPayload,
  UpdateShopPayload,
  UpdateShopSettingsPayload,
} from '../../types/shop'

export const shopsApi = {
  // ----------------------------------------------------------
  // LECTURE PUBLIQUE
  // ----------------------------------------------------------
  list: async (): Promise<ShopsListResponse> => {
    const { data } = await httpClient.get<ShopsListResponse>('/shops')
    return data
  },

  nearby: async (params: {
    lat: number
    lng: number
    radius?: number
    limit?: number
    offset?: number
  }): Promise<ShopsNearbyResponse> => {
    const { data } = await httpClient.get<ShopsNearbyResponse>(
      '/shops/nearby',
      { params }
    )
    return data
  },

  getById: async (id: number): Promise<ShopResponse> => {
    const { data } = await httpClient.get<ShopResponse>(`/shops/${id}`)
    return data
  },

  // ----------------------------------------------------------
  // MES BOUTIQUES (pro/admin)
  // ----------------------------------------------------------
  listMine: async (): Promise<ShopsListResponse> => {
    const { data } = await httpClient.get<ShopsListResponse>(
      `/shops/owner/me?_t=${Date.now()}`
    )
    return data
  },

  // ----------------------------------------------------------
  // CRUD
  // ----------------------------------------------------------
  create: async (payload: CreateShopPayload): Promise<ShopResponse> => {
    const { data } = await httpClient.post<ShopResponse>('/shops', payload)
    return data
  },

  update: async (
    shopId: number,
    payload: UpdateShopPayload
  ): Promise<ShopResponse> => {
    const { data } = await httpClient.put<ShopResponse>(
      `/shops/${shopId}`,
      payload
    )
    return data
  },

  delete: async (shopId: number): Promise<void> => {
    await httpClient.delete(`/shops/${shopId}`)
  },

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------
  getSettings: async (shopId: number): Promise<ShopSettingsResponse> => {
    const { data } = await httpClient.get<ShopSettingsResponse>(
      `/settings/shop/${shopId}?_t=${Date.now()}`
    )
    return data
  },

  updateSettings: async (
    shopId: number,
    payload: UpdateShopSettingsPayload
  ): Promise<ShopSettingsResponse> => {
    const { data } = await httpClient.put<ShopSettingsResponse>(
      `/settings/shop/${shopId}`,
      payload
    )
    return data
  },

  updateVacation: async (
    shopId: number,
    payload: {
      vacation_mode: boolean
      vacation_message?: string | null
      vacation_until?: string | null
    }
  ): Promise<ShopSettingsResponse> => {
    const { data } = await httpClient.put<ShopSettingsResponse>(
      `/settings/shop/${shopId}/vacation`,
      payload
    )
    return data
  },

  updateHidden: async (
    shopId: number,
    is_hidden: boolean
  ): Promise<ShopSettingsResponse> => {
    const { data } = await httpClient.put<ShopSettingsResponse>(
      `/settings/shop/${shopId}/hidden`,
      { is_hidden }
    )
    return data
  },

  // ----------------------------------------------------------
  // UPLOADS (logo / bannière via multipart)
  // ----------------------------------------------------------
  uploadLogo: async (
    shopId: number,
    file: File
  ): Promise<{ success: boolean; message: string; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('shop_id', String(shopId))
    const { data } = await httpClient.post(
      '/uploads/shop-logo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  updateReturns: async (
    shopId: number,
    payload: { accepts_returns: boolean; return_days?: number }
  ): Promise<ShopSettingsResponse> => {
    const { data } = await httpClient.put<ShopSettingsResponse>(
      `/settings/shop/${shopId}/returns`,
      payload
    )
    return data
  },

  updateContact: async (
    shopId: number,
    payload: { contact_phone?: string | null; contact_email?: string | null }
  ): Promise<ShopSettingsResponse> => {
    const { data } = await httpClient.put<ShopSettingsResponse>(
      `/settings/shop/${shopId}/contact`,
      payload
    )
    return data
  },
}

export default shopsApi
