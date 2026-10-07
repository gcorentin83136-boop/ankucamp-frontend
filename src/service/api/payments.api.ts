// ============================================================
// ANKU — API Payments
// ============================================================

import httpClient from './httpClient'
import type { PaymentsListResponse } from '../../types/payment'

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
