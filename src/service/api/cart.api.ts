// ============================================================
// ANKU — API Cart
// ============================================================

import httpClient from './httpClient'
import type {
  Cart,
  AddToCartPayload,
  UpdateCartPayload,
  CartCheckoutPayload,
  CartCheckoutResponse,
} from '../../types/cart'

export const cartApi = {
  get: async (): Promise<Cart> => {
    const { data } = await httpClient.get<Cart>('/cart')
    return data
  },

  add: async (payload: AddToCartPayload): Promise<Cart> => {
    const { data } = await httpClient.post<Cart>('/cart/items', payload)
    return data
  },

  update: async (
    productId: number,
    payload: UpdateCartPayload
  ): Promise<Cart> => {
    const { data } = await httpClient.put<Cart>(
      `/cart/items/${productId}`,
      payload
    )
    return data
  },

  remove: async (productId: number): Promise<Cart> => {
    const { data } = await httpClient.delete<Cart>(
      `/cart/items/${productId}`
    )
    return data
  },

  clear: async (): Promise<{ success: boolean }> => {
    const { data } = await httpClient.delete<{ success: boolean }>('/cart')
    return data
  },

  checkout: async (
    payload: CartCheckoutPayload
  ): Promise<CartCheckoutResponse> => {
    const { data } = await httpClient.post<CartCheckoutResponse>(
      '/cart/checkout',
      payload
    )
    return data
  },
}

export default cartApi
