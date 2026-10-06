// ============================================================
// ANKU — API Dashboard (buyer + seller)
// ============================================================

import httpClient from './httpClient'

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export interface SellerSummary {
  success: boolean
  to_treat: {
    orders_pending: number
    orders_shipped: number
    refunds_pending: number
    event_registrations: number
    kyc_pending: number
    total: number
  }
  revenue: {
    all_time: string
    this_month: string
  }
  rating: { average: number; count: number }
  shops: number
  products: number
  promo: { active_codes: number; total_uses: number }
  events: { upcoming: number }
  articles: { published: number }
}

export interface SellerRevenueChartPoint {
  month: string
  total: string
  count: number
}

export interface BuyerSummary {
  success: boolean
  orders: { total: number; pending: number }
  total_spent: string
  wishlist_count: number
  cart: { items_count: number; total_quantity: number }
  events: {
    upcoming_count: number
    upcoming: Array<{
      event_id: number
      title: string
      type: string
      start_at: string
      city: string | null
      cover_url: string | null
      status: string
    }>
  }
  article_likes: number
}

// ------------------------------------------------------------
// SELLER
// ------------------------------------------------------------
export const dashboardSellerApi = {
  summary: async (): Promise<SellerSummary> => {
    const { data } = await httpClient.get<SellerSummary>(
      '/dashboard/seller/summary'
    )
    return data
  },

  revenueChart: async (
    months = 12
  ): Promise<{ success: boolean; months: number; chart: SellerRevenueChartPoint[] }> => {
    const { data } = await httpClient.get(
      '/dashboard/seller/revenue-chart',
      { params: { months } }
    )
    return data
  },

  recentOrders: async (): Promise<{ success: boolean; count: number; orders: any[] }> => {
    const { data } = await httpClient.get('/dashboard/seller/recent-orders')
    return data
  },

  topProducts: async (): Promise<{ success: boolean; count: number; products: any[] }> => {
    const { data } = await httpClient.get('/dashboard/seller/top-products')
    return data
  },
}

// ------------------------------------------------------------
// BUYER
// ------------------------------------------------------------
export const dashboardBuyerApi = {
  summary: async (): Promise<BuyerSummary> => {
    const { data } = await httpClient.get<BuyerSummary>(
      '/dashboard/buyer/summary'
    )
    return data
  },

  recentOrders: async (): Promise<{ success: boolean; count: number; orders: any[] }> => {
    const { data } = await httpClient.get('/dashboard/buyer/recent-orders')
    return data
  },

  spendingChart: async (months = 12) => {
    const { data } = await httpClient.get('/dashboard/buyer/spending-chart', {
      params: { months },
    })
    return data
  },
}
