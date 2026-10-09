// ============================================================
// ANKU — Types Search
// ============================================================

export interface ShopSearchResult {
  id: number
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  city: string | null
  postal_code: string | null
  created_at: string
  products_count: number
  followers_count: number
  average_rating: number
  vacation_mode: number
  owner_id: number
  owner_username: string | null
  owner_avatar_url: string | null
  owner_verification_status: string | null
  owner_badges: string[] | null
  distance_km?: number
}

export interface ProductSearchResult {
  id: number
  shop_id: number
  name: string
  description: string | null
  image_url: string | null
  location: string | null
  price: string
  stock: number | null
  created_at: string
  shop_name: string | null
  shop_logo_url: string | null
  average_rating: number
  reviews_count: number
  distance_km?: number
}

export interface UserSearchResult {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  city: string | null
  role: string
  is_private: number
  created_at: string
  distance_km?: number
}

export interface ShopsSearchResponse {
  success: boolean
  count: number
  query: string | null
  results: ShopSearchResult[]
}

export interface ProductsSearchResponse {
  success: boolean
  count: number
  query: string | null
  results: ProductSearchResult[]
}

export interface UsersSearchResponse {
  success: boolean
  count: number
  query: string | null
  results: UserSearchResult[]
}

export interface SearchAllResponse {
  success: boolean
  query: string
  counts: { users: number; shops: number; products: number }
  users: UserSearchResult[]
  shops: ShopSearchResult[]
  products: ProductSearchResult[]
}

export interface SuggestResponse {
  success: boolean
  query: string
  users: Array<{
    id: number
    username: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }>
  shops: Array<{
    id: number
    name: string
    logo_url: string | null
    city: string | null
  }>
  products: Array<{
    id: number
    name: string
    image_url: string | null
    price: string
    shop_id: number
  }>
}

export interface ShopSearchParams {
  q?: string
  city?: string
  category_id?: number
  min_rating?: number
  delivery?: 'pickup' | 'shipping' | 'meeting'
  has_stock?: boolean
  sort?: 'relevance' | 'rating' | 'products_count' | 'recent'
  limit?: number
  offset?: number
  lat?: number
  lng?: number
  radius?: number
}

export interface ProductSearchParams {
  q?: string
  category_id?: number
  shop_id?: number
  city?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  min_rating?: number
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'recent'
  limit?: number
  offset?: number
  lat?: number
  lng?: number
  radius?: number
}
