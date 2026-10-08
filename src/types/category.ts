// ============================================================
// ANKU — Types Category
// ============================================================

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  image_url: string | null
  created_at: string
  shops_count?: number
}

export interface CategoriesListResponse {
  success: boolean
  count: number
  categories: Category[]
}

export interface CategoryResponse {
  success: boolean
  category: Category
}
