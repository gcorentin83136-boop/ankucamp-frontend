// ============================================================
// ANKU — API Reviews
// ============================================================

import httpClient from './httpClient'
import type {
  ReviewResponse,
  ReviewsListResponse,
  ProductStatsResponse,
  CreateReviewPayload,
  ListReviewsParams,
} from '../../types/review'

export const reviewsApi = {
  // ----------------------------------------------------------
  // PUBLIC
  // ----------------------------------------------------------
  listByProduct: async (
    productId: number,
    params?: ListReviewsParams
  ): Promise<ReviewsListResponse> => {
    const { data } = await httpClient.get<ReviewsListResponse>(
      `/reviews/product/${productId}`,
      { params }
    )
    return data
  },

  productStats: async (
    productId: number
  ): Promise<ProductStatsResponse> => {
    const { data } = await httpClient.get<ProductStatsResponse>(
      `/reviews/product/${productId}/stats`
    )
    return data
  },

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------
  create: async (payload: CreateReviewPayload): Promise<ReviewResponse> => {
    const { data } = await httpClient.post<ReviewResponse>(
      '/reviews',
      payload
    )
    return data
  },

  listMine: async (): Promise<ReviewsListResponse> => {
    const { data } = await httpClient.get<ReviewsListResponse>('/reviews/me')
    return data
  },

  listSellerReviews: async (
    params?: ListReviewsParams
  ): Promise<ReviewsListResponse> => {
    const { data } = await httpClient.get<ReviewsListResponse>(
      '/reviews/seller/me',
      { params }
    )
    return data
  },

  report: async (id: number, reason: string): Promise<any> => {
    const { data } = await httpClient.post(`/reviews/${id}/report`, {
      reason,
    })
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/reviews/${id}`)
  },
}

export default reviewsApi
