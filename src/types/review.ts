// ============================================================
// ANKU — Types Reviews
// ============================================================

export interface ReviewAuthor {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
}

export interface Review {
  id: number
  order_id: number
  product_id: number
  seller_id: number
  author_id: number
  rating: number
  comment: string | null
  is_flagged: number
  created_at: string
  author?: ReviewAuthor | null
  product?: { id: number; name: string; image_url: string | null } | null
}

export interface ProductRatingStats {
  average: number
  count: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface CreateReviewPayload {
  order_id: number
  product_id: number
  rating: number
  comment?: string | null
}

export interface ListReviewsParams {
  limit?: number
  offset?: number
  sort?: 'recent' | 'rating_desc' | 'rating_asc'
}

export interface ReviewsListResponse {
  success: boolean
  count: number
  reviews: Review[]
}

export interface ProductStatsResponse {
  success: boolean
  stats: ProductRatingStats
}

export interface ReviewResponse {
  success: boolean
  message?: string
  review: Review
}
