// ============================================================
// ANKU — Types Promo
// ============================================================

export type PromoType = 'percent' | 'fixed'

export interface PromoCode {
  id: number
  code: string
  description: string | null
  type: PromoType
  value: string
  min_amount: string | null
  max_uses: number | null
  max_uses_per_user: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: number
  seller_id: number | null
  created_by: number
  created_at: string
}

export interface ValidatePromoPayload {
  code: string
  subtotal: number
  product_ids?: number[]
}

export interface ValidatePromoResponse {
  success: boolean
  valid: boolean
  code: string
  type: PromoType
  value: number
  seller_id: number | null
  description: string | null
  discount_preview: number
  new_subtotal: number
}

export interface CreateSellerPromoPayload {
  code: string
  description?: string | null
  type: PromoType
  value: number
  min_amount?: number | null
  max_uses?: number | null
  max_uses_per_user?: number | null
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
  notify_users?: boolean
}

export type UpdateSellerPromoPayload = Partial<CreateSellerPromoPayload>

export interface SellerPromosListResponse {
  success: boolean
  count: number
  promos: PromoCode[]
}

export interface SellerPromoResponse {
  success: boolean
  promo: PromoCode
}
