// ============================================================
// ANKU — Types TypeScript (miroir exact du backend Drizzle)
// ============================================================

// ------------------------------------------------------------
// User (table `users`)
// ------------------------------------------------------------
export type UserRole = 'particulier' | 'professionnel' | 'admin'
export type UserProvider = 'local' | 'google'
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'
export type StripeStatus = 'not_connected' | 'pending' | 'connected'

export interface User {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
  birth_year: number | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  website: string | null
  location: string | null
  is_private: number
  provider: UserProvider
  role: UserRole
  email_verified: number
  verification_status: VerificationStatus
  created_at: string
}

export interface UserMe extends User {
  latitude: string | null
  longitude: string | null
  provider_id: string | null
  stripe_account_id: string | null
  stripe_account_status: StripeStatus
}

// ------------------------------------------------------------
// KYC
// ------------------------------------------------------------
export const KYC_TYPES = ['agriculteur', 'artisan', 'createur', 'autre'] as const
export type KycType = (typeof KYC_TYPES)[number]

export const KYC_STATUSES = ['pending', 'approved', 'rejected'] as const
export type KycStatus = (typeof KYC_STATUSES)[number]

export const BADGES = [
  'verified',
  'agriculteur',
  'artisan',
  'createur',
  'bio',
  'producteur_local',
] as const
export type BadgeType = (typeof BADGES)[number]

export interface KycRequest {
  id: number
  user_id: number
  status: KycStatus
  type: KycType
  siret: string
  siret_verified: number
  siret_data: string | null
  documents: string | null
  rejection_reason: string | null
  admin_id: number | null
  reviewed_at: string | null
  created_at: string
}

export interface KycRequestWithUser extends KycRequest {
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

// ------------------------------------------------------------
// Badges
// ------------------------------------------------------------
export interface UserBadge {
  id: number
  user_id: number
  badge: BadgeType
  granted_by: number | null
  granted_at: string
  revoked_at: string | null
}

// ------------------------------------------------------------
// 2FA
// ------------------------------------------------------------
export interface UserTwoFactor {
  id: number
  user_id: number
  secret: string
  enabled: number
  backup_codes: string | null
  enabled_at: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// Sessions
// ------------------------------------------------------------
export interface UserSession {
  id: number
  user_id: number
  device_info: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  expires_at: string
  created_at: string
}

// ------------------------------------------------------------
// Payloads API
// ------------------------------------------------------------
export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  birth_year: number
  address: string
  city: string
  postal_code: string
  country?: string
  password: string
  role: 'particulier' | 'professionnel'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: User
  token?: string
  requires_2fa?: boolean
  temp_token?: string
}

export interface CreateKycPayload {
  type: KycType
  siret: string
  documents: string[]
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  birth_year?: number
  address?: string
  city?: string
  postal_code?: string
  country?: string
  bio?: string
  website?: string
  location?: string
  avatar_url?: string
  cover_url?: string
}
