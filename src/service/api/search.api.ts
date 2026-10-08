// ============================================================
// ANKU — API Search
// ============================================================

import httpClient from './httpClient'
import type {
  ShopsSearchResponse,
  ProductsSearchResponse,
  UsersSearchResponse,
  SearchAllResponse,
  SuggestResponse,
  ShopSearchParams,
  ProductSearchParams,
} from '../../types/search'

export const searchApi = {
  // ----------------------------------------------------------
  // SHOPS
  // ----------------------------------------------------------
  shops: async (params?: ShopSearchParams): Promise<ShopsSearchResponse> => {
    const { data } = await httpClient.get<ShopsSearchResponse>(
      '/search/shops',
      { params }
    )
    return data
  },

  // ----------------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------------
  products: async (
    params?: ProductSearchParams
  ): Promise<ProductsSearchResponse> => {
    const { data } = await httpClient.get<ProductsSearchResponse>(
      '/search/products',
      { params }
    )
    return data
  },

  // ----------------------------------------------------------
  // USERS
  // ----------------------------------------------------------
  users: async (params?: {
    q?: string
    role?: string
    city?: string
    sort?: 'relevance' | 'alphabetical' | 'recent'
    limit?: number
    offset?: number
  }): Promise<UsersSearchResponse> => {
    const { data } = await httpClient.get<UsersSearchResponse>(
      '/search/users',
      { params }
    )
    return data
  },

  // ----------------------------------------------------------
  // ALL
  // ----------------------------------------------------------
  all: async (params: {
    q: string
    limit_per_type?: number
    lat?: number
    lng?: number
    radius?: number
  }): Promise<SearchAllResponse> => {
    const { data } = await httpClient.get<SearchAllResponse>('/search/all', {
      params,
    })
    return data
  },

  // ----------------------------------------------------------
  // SUGGEST (autocomplete)
  // ----------------------------------------------------------
  suggest: async (
    q: string,
    limit = 5
  ): Promise<SuggestResponse> => {
    const { data } = await httpClient.get<SuggestResponse>('/search/suggest', {
      params: { q, limit },
    })
    return data
  },
}

export default searchApi
