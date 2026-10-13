// ============================================================
// ANKU — API Search
// ============================================================

import httpClient from './httpClient'

export type SearchSort =
  | 'relevance'
  | 'recent'
  | 'alphabetical'
  | 'rating'
  | 'price_asc'
  | 'price_desc'
  | 'products_count'

export interface SearchFilters {
  q?: string
  limit?: number
  offset?: number
  lat?: number
  lng?: number
  radius?: number
  role?: 'particulier' | 'professionnel'
  city?: string
  category_id?: number
  min_rating?: number
  delivery?: 'pickup' | 'shipping' | 'meeting'
  has_stock?: boolean
  shop_id?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort?: SearchSort
}

export const searchApi = {
  all: async (params: {
    q: string
    limit_per_type?: number
    lat?: number
    lng?: number
    radius?: number
  }) => {
    const { data } = await httpClient.get('/search/all', { params })
    return data
  },

  users: async (filters: SearchFilters) => {
    const { data } = await httpClient.get('/search/users', { params: filters })
    return data
  },

  shops: async (filters: SearchFilters) => {
    const { data } = await httpClient.get('/search/shops', { params: filters })
    return data
  },

  products: async (filters: SearchFilters) => {
    const { data } = await httpClient.get('/search/products', {
      params: filters,
    })
    return data
  },

  suggest: async (q: string, limit = 5) => {
    const { data } = await httpClient.get('/search/suggest', {
      params: { q, limit },
    })
    return data
  },
}

export default searchApi