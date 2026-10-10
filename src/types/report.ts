// ============================================================
// ANKU — Types Report (signalement)
// ============================================================

export type ReportTargetType =
  | 'post'
  | 'comment'
  | 'review'
  | 'product'
  | 'shop'
  | 'user'
  | 'message'

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'copyright'
  | 'fake'
  | 'other'

export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface CreateReportPayload {
  target_type: ReportTargetType
  target_id: number
  reason: ReportReason
  description?: string | null
}

export interface Report {
  id: number
  reporter_id: number
  target_type: ReportTargetType
  target_id: number
  reason: ReportReason
  description: string | null
  status: ReportStatus
  admin_id: number | null
  admin_note: string | null
  content_deleted: number
  resolved_at: string | null
  created_at: string
}

export interface ReportResponse {
  success: boolean
  report: Report
}

// ------------------------------------------------------------
// Libellés pour l'UI
// ------------------------------------------------------------
export const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam ou publicité',
  harassment: 'Harcèlement',
  hate_speech: 'Discours haineux',
  violence: 'Violence',
  copyright: 'Droits d\'auteur',
  fake: 'Fausse information',
  other: 'Autre',
}

export const REASON_DESCRIPTIONS: Record<ReportReason, string> = {
  spam: 'Contenu répétitif, publicité non sollicitée',
  harassment: 'Propos ou comportement visant à blesser',
  hate_speech: 'Attaques envers un groupe ou une personne',
  violence: 'Menaces ou incitation à la violence',
  copyright: 'Utilisation non autorisée d\'une œuvre',
  fake: 'Information fausse ou trompeuse',
  other: 'Autre raison (précise en description)',
}