// ============================================================
// ANKU — Types Refund (demande de remboursement)
// ============================================================

export type RefundStatus = 'pending' | 'approved' | 'rejected'

export interface RefundRequest {
  id: number
  order_id: number
  payment_id: number
  requested_by: number
  reason: string | null
  status: RefundStatus
  stripe_refund_id: string | null
  refund_amount: string | null
  admin_id: number | null
  admin_comment: string | null
  requested_at: string
  processed_at: string | null
}

export interface RefundsListResponse {
  success: boolean
  refunds: RefundRequest[]
}

export interface RefundResponse {
  success: boolean
  refund: RefundRequest
}

export interface CreateRefundPayload {
  order_id: number
  reason: string
}
