// ============================================================
// ANKU — Types Shops
// ============================================================

export interface ShopOwner {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  verification_status: string
  badges: string[]
  rating: { average: number; count: number }
}

export interface Shop {
  id: number
  owner_id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  owner?: ShopOwner | null
  distance_km?: number
  products_count?: number
  followers_count?: number
  is_followed_by_me?: boolean
}

export interface ShopSettings {
  id: number
  shop_id: number
  vacation_mode: number
  vacation_message: string | null
  vacation_until: string | null
  is_hidden: number
  accepts_returns: number
  return_days: number
  shipping_zones: string | null
  contact_phone: string | null
  contact_email: string | null
  created_at: string
  updated_at: string
}

export interface CreateShopPayload {
  name: string
  description?: string
  logo_url?: string
  banner_url?: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  latitude?: number | null
  longitude?: number | null
}

export type UpdateShopPayload = Partial<CreateShopPayload>

export interface UpdateShopSettingsPayload {
  vacation_mode?: boolean
  vacation_message?: string | null
  vacation_until?: string | null
  is_hidden?: boolean
  accepts_returns?: boolean
  return_days?: number
  contact_phone?: string | null
  contact_email?: string | null
  shipping_zones?: string[] | null
}

export interface ShopsListResponse {
  success: boolean
  shops: Shop[]
}

export interface ShopsNearbyResponse {
  success: boolean
  count: number
  radius_km: number
  center: { lat: number; lng: number }
  shops: Shop[]
}

export interface ShopResponse {
  success: boolean
  shop: Shop
}

export interface ShopSettingsResponse {
  success: boolean
  message?: string
  settings: ShopSettings
}
