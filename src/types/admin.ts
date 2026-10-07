// ============================================================
// ANKU — Types Admin (Dashboard + modules)
// ============================================================

// ------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------
export interface AdminSummary {
  success: boolean
  to_treat: {
    kyc_pending: number
    reports_pending: number
    refunds_pending: number
    reviews_flagged: number
    rgpd_exports_pending: number
    deletions_pending: number
    total: number
  }
  users: { total: number; verified: number; pros: number }
  shops: number
  products: number
  categories: number
  badges_active: number
  articles: { total: number; published: number }
  revenue: {
    all_time: { gmv: string; fees: string; count: number }
    this_month: { gmv: string; fees: string; count: number }
  }
  promo: { active_codes: number }
  events: { upcoming: number; this_week: number }
  recent: {
    reports: Array<{
      id: number
      target_type: string
      target_id: number
      reason: string
      created_at: string
      reporter_username: string | null
    }>
    kyc: Array<{
      id: number
      user_id: number
      type: string
      created_at: string
      username: string
      first_name: string
      last_name: string
    }>
  }
  backup: {
    count: number
    total_size_mb: number
    last_backup: string | null
    retention_days: number
  }
}

// ------------------------------------------------------------
// KYC
// ------------------------------------------------------------
export interface KycRequest {
  id: number
  user_id: number
  status: 'pending' | 'approved' | 'rejected'
  type: string
  siret: string
  siret_verified: number
  siret_data: string | null
  documents: string | null
  rejection_reason: string | null
  admin_id: number | null
  reviewed_at: string | null
  created_at: string
  username?: string
  first_name?: string
  last_name?: string
  avatar_url?: string | null
}

export interface KycStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

// ------------------------------------------------------------
// MODERATION
// ------------------------------------------------------------
export interface ContentReport {
  id: number
  reporter_id: number
  target_type: string
  target_id: number
  reason: string
  description: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  admin_id: number | null
  admin_note: string | null
  reviewed_at: string | null
  created_at: string
  reporter_username?: string | null
}

export interface ReportsStats {
  success: boolean
  pending: number
  resolved: number
  dismissed: number
  total: number
}

// ------------------------------------------------------------
// REFUNDS
// ------------------------------------------------------------
export interface RefundRequest {
  id: number
  order_id: number
  payment_id: number
  requested_by: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'failed'
  refund_amount: string | null
  stripe_refund_id: string | null
  admin_id: number | null
  admin_comment: string | null
  requested_at: string
  processed_at: string | null
}

// ------------------------------------------------------------
// USERS
// ------------------------------------------------------------
export interface AdminUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  avatar_url: string | null
  email_verified: number
  verification_status: string
  suspended_until: string | null
  suspension_reason: string | null
  created_at: string
}

export interface UserBadge {
  id: number
  user_id: number
  badge: string
  granted_by: number | null
  granted_at: string
  revoked_at: string | null
}

export const ALL_BADGES = [
  'verified',
  'agriculteur',
  'artisan',
  'createur',
  'bio',
  'producteur_local',
] as const

export type BadgeType = (typeof ALL_BADGES)[number]

// ------------------------------------------------------------
// CATEGORIES
// ------------------------------------------------------------
export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  image_url: string | null
  created_at: string
}

// ------------------------------------------------------------
// PROMO
// ------------------------------------------------------------
export type PromoType = 'percent' | 'fixed'

export interface AdminPromoSeller {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
  avatar_url: string | null
}

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
  created_at: string
  seller?: AdminPromoSeller | null
}

// ------------------------------------------------------------
// AUDIT
// ------------------------------------------------------------
export interface AuditLog {
  id: number
  admin_id: number
  action: string
  target_type: string | null
  target_id: number | null
  description: string
  metadata: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin_username?: string
}

export interface AuditStats {
  success: boolean
  total: number
  by_action: Array<{ action: string; count: number }>
  by_admin: Array<{ admin_id: number; username: string; count: number }>
  last_7_days: Array<{ date: string; count: number }>
}

// ------------------------------------------------------------
// BACKUP
// ------------------------------------------------------------
export interface BackupFile {
  filename: string
  size_bytes: number
  created_at: string
}

export interface BackupStats {
  success: boolean
  count: number
  total_size_mb: number
  last_backup: {
    filename: string
    size_bytes: number
    size_mb: number
    created_at: string
  } | null
  retention_days: number
}
