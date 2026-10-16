// ============================================================
// ANKU — API Payments
// ============================================================

import httpClient from './httpClient'
import type { PaymentsListResponse } from '../../types/payment'


export interface CheckoutSessionResponse {
  success: boolean
  message: string
  url: string
  session_id: string
}

export interface ConnectStatusResponse {
  success: boolean
  status: string
  has_account: boolean
  charges_enabled?: boolean
  payouts_enabled?: boolean
}
export const paymentsApi = {
  // Mes paiements (buyer)
  listMine: async (): Promise<PaymentsListResponse> => {
    const { data } = await httpClient.get<PaymentsListResponse>('/payments/me')
    return data
  },

  // Paiements reçus (vendeur)
  listSellerMine: async (): Promise<PaymentsListResponse> => {
    const { data } = await httpClient.get<PaymentsListResponse>(
      '/payments/seller/me'
    )
    return data
  },

  /**
   * POST /payments/checkout
   * Crée une session Stripe Checkout pour une commande
   */
  createCheckout: async (orderId: number): Promise<CheckoutSessionResponse> => {
    const { data } = await httpClient.post<CheckoutSessionResponse>(
      '/payments/checkout',
      { order_id: orderId }
    )
    return data
  },

  /**
   * GET /payments/connect/status
   */
  connectStatus: async (): Promise<ConnectStatusResponse> => {
    const { data } = await httpClient.get<ConnectStatusResponse>(
      '/payments/connect/status'
    )
    return data
  },

  /**
   * POST /payments/connect/onboard
   */
  connectOnboard: async (): Promise<{
    success: boolean
    onboarding_url: string
    message: string
  }> => {
    const { data } = await httpClient.post('/payments/connect/onboard')
    return data
  },

  // Export PDF des factures vendeur
  exportPdf: async (month?: string): Promise<void> => {
    const params = month && month !== 'all' ? { month } : {}
    const res = await httpClient.get('/payments/seller/me/export', {
      params,
      responseType: 'blob',
    })

    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = month && month !== 'all'
      ? `mes-factures-anku-${month}.pdf`
      : 'mes-factures-anku.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
}

export default paymentsApi
