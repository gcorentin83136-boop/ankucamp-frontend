// ============================================================
// ANKU — Types Payment
// ============================================================

export interface Payment {
  id: number
  order_id: number
  user_id: number
  seller_id: number | null
  stripe_payment_intent: string
  stripe_session_id: string | null
  amount_ht: string
  amount_tva: string
  amount_ttc: string
  tva_rate: string
  seller_amount: string | null
  application_fee_amount: string | null
  seller_stripe_account_id: string | null
  status: string
  invoice_url: string | null
  created_at: string | null
}

export interface PaymentsListResponse {
  success: boolean
  payments: Payment[]
}
