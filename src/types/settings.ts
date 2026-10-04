// ============================================================
// ANKU — Types des paramètres utilisateur
// ============================================================

import type { UserMe } from './user'

// ------------------------------------------------------------
// 2FA
// ------------------------------------------------------------
export interface TwoFactorStatus {
  enabled: boolean
  setup_in_progress: boolean
}

export interface TwoFactorSetupResponse {
  success: boolean
  message: string
  secret: string
  qr_code: string
  otpauth: string
}

export interface TwoFactorVerifyResponse {
  success: boolean
  message: string
  enabled: boolean
  backup_codes: string[]
}

// ------------------------------------------------------------
// Account
// ------------------------------------------------------------
export interface ChangeEmailPayload {
  new_email: string
  password: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ChangeUsernamePayload {
  new_username: string
  password: string
}

export interface UpdateInfoPayload {
  first_name?: string
  last_name?: string
  birth_year?: number
}

export interface DeactivateAccountPayload {
  password: string
  reason?: string | null
}

// ------------------------------------------------------------
// Sessions
// ------------------------------------------------------------
export interface ActiveSession {
  id: number
  device_info: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  last_active_at: string
  expires_at: string
  is_current: boolean
}

// ------------------------------------------------------------
// Privacy
// ------------------------------------------------------------
export type ProfileVisibility = 'public' | 'friends' | 'private'
export type AllowMessagesFrom = 'everyone' | 'friends' | 'nobody'

export interface PrivacySettings {
  profile_visibility: ProfileVisibility
  allow_messages_from: AllowMessagesFrom
  show_email: boolean
  show_phone: boolean
  search_indexable: boolean
}

export interface UpdatePrivacyPayload {
  profile_visibility?: ProfileVisibility
  allow_messages_from?: AllowMessagesFrom
  show_email?: boolean
  show_phone?: boolean
  search_indexable?: boolean
}

// ------------------------------------------------------------
// Notifications (préférences — pas les notifs in-app)
// ------------------------------------------------------------
export interface NotificationEmailPrefs {
  order_updates: boolean
  new_messages: boolean
  social_activity: boolean
  marketing: boolean
}

export interface NotificationPushPrefs {
  order_updates: boolean
  new_messages: boolean
  social_activity: boolean
}

export interface NotificationSettings {
  email: NotificationEmailPrefs
  push: NotificationPushPrefs
}

export interface UpdateNotificationsPayload {
  email_order_updates?: boolean
  email_new_messages?: boolean
  email_social_activity?: boolean
  email_marketing?: boolean
  push_order_updates?: boolean
  push_new_messages?: boolean
  push_social_activity?: boolean
}

// ------------------------------------------------------------
// GDPR
// ------------------------------------------------------------
export type DataExportStatus = 'pending' | 'processing' | 'ready' | 'failed'
export type AccountDeletionStatus = 'pending' | 'cancelled' | 'completed'

export interface DataExportRequest {
  id: number
  status: DataExportStatus
  file_url: string | null
  requested_at: string
  completed_at: string | null
  expires_at: string | null
}

export interface AccountDeletionRequest {
  id: number
  status: AccountDeletionStatus
  reason: string | null
  scheduled_deletion_at: string
  created_at: string
}

export interface LegalAcceptance {
  id: number
  document_type: string
  document_version: string
  accepted_at: string
  ip_address: string | null
}

// Re-export pour commodité depuis les pages settings
export type { UserMe }
