// ============================================================
// ANKU — API Categories
// ============================================================

import httpClient from './httpClient'
import type {
  CategoriesListResponse,
  CategoryResponse,
} from '../../types/category'

export const categoriesApi = {
  list: async (params?: {
    limit?: number
    offset?: number
  }): Promise<CategoriesListResponse> => {
    const { data } = await httpClient.get<CategoriesListResponse>(
      '/categories',
      { params }
    )
    return data
  },

  getById: async (id: number): Promise<CategoryResponse> => {
    const { data } = await httpClient.get<CategoryResponse>(
      `/categories/${id}`
    )
    return data
  },

  getBySlug: async (slug: string): Promise<CategoryResponse> => {
    const { data } = await httpClient.get<CategoryResponse>(
      `/categories/slug/${slug}`
    )
    return data
  },
}

export default categoriesApi
