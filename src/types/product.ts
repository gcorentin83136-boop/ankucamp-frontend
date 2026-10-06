// ============================================================
// ANKU — Types Products
// ============================================================

export interface ProductShop {
  id: number
  name: string
  slug?: string
  logo_url: string | null
  city: string | null
  owner_id: number
  owner: {
    id: number
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
    verification_status: string
    badges: string[]
    rating: { average: number; count: number }
  } | null
}

export interface Product {
  id: number
  shop_id: number
  name: string
  description: string | null
  image_url: string | null
  video_urls: string[] | null
  location: string | null
  stock: number | null
  has_unlimited_stock: number
  price: string
  delivery_pickup: number
  delivery_shipping: number
  delivery_meeting: number
  meeting_point_address: string | null
  meeting_point_instructions: string | null
  created_at: string
  shop?: ProductShop | null
}

// ------------------------------------------------------------
// Payloads
// ------------------------------------------------------------
export interface CreateProductPayload {
  shop_id: number
  name: string
  description?: string
  image_url?: string
  video_urls?: string[]
  location?: string
  stock?: number
  has_unlimited_stock?: boolean
  price: number
  delivery_pickup?: boolean
  delivery_shipping?: boolean
  delivery_meeting?: boolean
  meeting_point_address?: string | null
  meeting_point_instructions?: string | null
}

export interface UpdateProductPayload {
  name?: string
  description?: string
  image_url?: string
  video_urls?: string[]
  location?: string
  stock?: number
  has_unlimited_stock?: boolean
  price?: number
  delivery_pickup?: boolean
  delivery_shipping?: boolean
  delivery_meeting?: boolean
  meeting_point_address?: string | null
  meeting_point_instructions?: string | null
}

// ------------------------------------------------------------
// Réponses
// ------------------------------------------------------------
export interface ProductsListResponse {
  success: boolean
  products: Product[]
}

export interface ProductResponse {
  success: boolean
  message?: string
  product: Product
}

export interface UploadProductResponse {
  success: boolean
  message: string
  url: string
  video_urls?: string[]
}
