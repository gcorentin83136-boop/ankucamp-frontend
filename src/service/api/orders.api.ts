// ============================================================
// ANKU — API Orders
// ============================================================

import httpClient from './httpClient'
import type {
  OrderResponse,
  OrdersListResponse,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
} from '../../types/order'

export const ordersApi = {
  // BUYER
  listMine: async (): Promise<OrdersListResponse> => {
    const { data } = await httpClient.get<OrdersListResponse>('/orders/me')
    return data
  },

  // SELLER
  listSeller: async (): Promise<OrdersListResponse> => {
    const { data } = await httpClient.get<OrdersListResponse>(
      '/orders/seller/me'
    )
    return data
  },

  getOne: async (id: number): Promise<OrderResponse> => {
    const { data } = await httpClient.get<OrderResponse>(`/orders/${id}`)
    return data
  },

  create: async (payload: CreateOrderPayload): Promise<OrderResponse> => {
    const { data } = await httpClient.post<OrderResponse>('/orders', payload)
    return data
  },

  updateStatus: async (
    id: number,
    payload: UpdateOrderStatusPayload
  ): Promise<OrderResponse> => {
    const { data } = await httpClient.put<OrderResponse>(
      `/orders/${id}/status`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/orders/${id}`)
  },

  // FACTURE — téléchargement via blob (header Authorization)
  downloadInvoice: async (id: number): Promise<void> => {
    const res = await httpClient.get(`/orders/${id}/invoice`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-anku-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },

  resendInvoice: async (
    id: number
  ): Promise<{ success: boolean; message: string; sentTo: string }> => {
    const { data } = await httpClient.post(
      `/orders/${id}/invoice/resend`
    )
    return data
  },
}

export default ordersApi
