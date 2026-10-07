// ============================================================
// ANKU — Types Orders
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type DeliveryMethod = 'pickup' | 'delivery' | 'shipping'

export interface OrderSeller {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  verification_status: string
}

export interface OrderShop {
  id: number
  name: string
  slug?: string
  logo_url: string | null
  owner_id: number
}

export interface OrderBuyer {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
}

export interface OrderItemProduct {
  id: number
  name: string
  image_url: string | null
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: string
  product?: OrderItemProduct | null
}

export interface Order {
  id: number
  buyer_id: number
  seller_id: number
  total_price: string
  status: OrderStatus
  delivery_method: DeliveryMethod
  delivery_address: string | null
  tracking_number: string | null
  delivered_at: string | null
  review_requested_at: string | null
  created_at: string
  items?: OrderItem[]
  buyer?: OrderBuyer | null
  seller?: OrderSeller | null
  shop?: OrderShop | null
}

export interface CreateOrderPayload {
  seller_id: number
  delivery_method: DeliveryMethod
  delivery_address?: string
  items: Array<{ product_id: number; quantity: number }>
}

export interface UpdateOrderStatusPayload {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number?: string | null
}

export interface OrdersListResponse {
  success: boolean
  orders: Order[]
}

export interface OrderResponse {
  success: boolean
  message?: string
  order: Order
}
