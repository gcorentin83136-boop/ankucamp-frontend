// ============================================================
// ANKU — Types Cart
// ============================================================

export interface CartItemProduct {
  id: number
  name: string
  price: string
  image_url: string | null
  stock: number | null
  shop_id: number
}

export interface CartItemShop {
  id: number
  name: string
  owner_id: number
}

export interface CartItem {
  id: number
  product_id: number
  quantity: number
  product: CartItemProduct
  shop: CartItemShop
  unit_price: number
  subtotal: number
  added_at: string
}

export interface CartBySeller {
  shop_id: number
  shop_name: string
  items: CartItem[]
  subtotal: number
}

export interface Cart {
  success?: boolean
  items: CartItem[]
  items_count: number
  subtotal: number
  by_seller: CartBySeller[]
}

export interface AddToCartPayload {
  product_id: number
  quantity: number
}

export interface UpdateCartPayload {
  quantity: number
}

export interface CartCheckoutPayload {
  delivery_method: 'pickup' | 'delivery' | 'shipping'
  delivery_address?: string | null
  promo_code?: string | null
}

export interface CartCheckoutResponse {
  success: boolean
  orders_count: number
  orders: Array<{ id: number; seller_id: number; total: number }>
  message: string
}
