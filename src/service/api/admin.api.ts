// ============================================================
// ANKU — API Admin
// ============================================================

import httpClient from './httpClient'
import type {
  AdminSummary,
  KycRequest,
  KycStats,
  ContentReport,
  ReportsStats,
  FlaggedReview,
  RefundRequest,
  AdminUser,
  BadgeType,
  Category,
  PromoCode,
  AuditLog,
  AuditStats,
  BackupFile,
  BackupStats,
} from '../../types/admin'

// ------------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------------
export const dashboardAdminApi = {
  summary: async (): Promise<AdminSummary> => {
    const { data } = await httpClient.get<AdminSummary>('/dashboard/admin/summary')
    return data
  },
  revenueChart: async (months = 12): Promise<{ chart: any[] }> => {
    const { data } = await httpClient.get<{ chart: any[] }>(
      '/dashboard/admin/revenue-chart',
      { params: { months } }
    )
    return data
  },
}

// ------------------------------------------------------------
// KYC
// ------------------------------------------------------------
export const kycAdminApi = {
  list: async (params?: {
    status?: string
    type?: string
    limit?: number
    offset?: number
  }): Promise<{ requests: KycRequest[] }> => {
    const { data } = await httpClient.get<{ requests: KycRequest[] }>(
      '/admin/kyc/requests',
      { params }
    )
    return data
  },
  approve: async (id: number) => {
    const { data } = await httpClient.put(`/admin/kyc/requests/${id}/approve`)
    return data
  },
  reject: async (id: number, reason: string) => {
    const { data } = await httpClient.put(`/admin/kyc/requests/${id}/reject`, { reason })
    return data
  },
  stats: async (): Promise<{ stats: KycStats }> => {
    const { data } = await httpClient.get<{ stats: KycStats }>('/admin/kyc/stats')
    return data
  },
}

// ------------------------------------------------------------
// MODERATION
// ------------------------------------------------------------
export const moderationAdminApi = {
  list: async (params?: {
    status?: string
    target_type?: string
    limit?: number
    offset?: number
  }): Promise<{ count: number; reports: ContentReport[] }> => {
    const { data } = await httpClient.get<{
      count: number
      reports: ContentReport[]
    }>('/admin/moderation/reports', { params })
    return data
  },
  resolve: async (id: number, admin_note?: string, delete_content = false) => {
    const { data } = await httpClient.put(
      `/admin/moderation/reports/${id}/resolve`,
      { admin_note, delete_content }
    )
    return data
  },
  dismiss: async (id: number, admin_note: string) => {
    const { data } = await httpClient.put(
      `/admin/moderation/reports/${id}/dismiss`,
      { admin_note }
    )
    return data
  },
  stats: async (): Promise<ReportsStats> => {
    const { data } = await httpClient.get<ReportsStats>(
      '/admin/moderation/reports/stats'
    )
    return data
  },
}

// ------------------------------------------------------------
// AVIS SIGNALÉS (modération)
// ------------------------------------------------------------
export const reviewsAdminApi = {
  listFlagged: async (
    status: 'pending' | 'resolved' | 'dismissed' | 'all' = 'pending'
  ): Promise<{
    count: number
    reviews: FlaggedReview[]
  }> => {
    const { data } = await httpClient.get<{
      count: number
      reviews: FlaggedReview[]
    }>('/admin/moderation/reviews', { params: { status } })
    return data
  },

  resolve: async (id: number, delete_content = false) => {
    const { data } = await httpClient.put(
      `/admin/moderation/reviews/${id}/resolve`,
      { delete_content }
    )
    return data
  },

  dismiss: async (id: number) => {
    const { data } = await httpClient.put(
      `/admin/moderation/reviews/${id}/dismiss`,
      {}
    )
    return data
  },
}

// ------------------------------------------------------------
// REFUNDS
// ------------------------------------------------------------
export const refundsAdminApi = {
  list: async (): Promise<{ count: number; refunds: RefundRequest[] }> => {
    const { data } = await httpClient.get<{
      count: number
      refunds: RefundRequest[]
    }>('/refunds')
    return data
  },
  approve: async (id: number, admin_comment?: string) => {
    const { data } = await httpClient.put(`/refunds/${id}/approve`, {
      admin_comment: admin_comment ?? null,
    })
    return data
  },
  reject: async (id: number, admin_comment: string) => {
    const { data } = await httpClient.put(`/refunds/${id}/reject`, {
      admin_comment,
    })
    return data
  },
}

// ------------------------------------------------------------
// USERS
// ------------------------------------------------------------
export const usersAdminApi = {
  list: async (params?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<{ count: number; users: AdminUser[] }> => {
    const { data } = await httpClient.get<{
      count: number
      users: AdminUser[]
    }>('/users', { params })
    return data
  },

  get: async (id: number): Promise<{ user: AdminUser }> => {
    const { data } = await httpClient.get<{ user: AdminUser }>(`/users/${id}`)
    return data
  },

  // Badges — le backend renvoie un string[] de noms de badges
  listBadges: async (userId: number): Promise<{ badges: string[] }> => {
    const { data } = await httpClient.get<{ badges: string[] }>(
      `/users/${userId}/badges`
    )
    return data
  },

  grantBadge: async (userId: number, badge: BadgeType) => {
    const { data } = await httpClient.post(`/users/${userId}/badges`, { badge })
    return data
  },

  revokeBadge: async (userId: number, badge: BadgeType) => {
    const { data } = await httpClient.delete(`/users/${userId}/badges/${badge}`)
    return data
  },

  // ----------------------------------------------------------
  // SUSPENSION / SUPPRESSION
  // ----------------------------------------------------------
  suspend: async (userId: number, days = 15, reason = '') => {
    const { data } = await httpClient.post(`/users/${userId}/suspend`, {
      days,
      reason,
    })
    return data
  },

  unsuspend: async (userId: number) => {
    const { data } = await httpClient.post(`/users/${userId}/unsuspend`)
    return data
  },

  deleteUser: async (userId: number) => {
    const { data } = await httpClient.delete(`/users/${userId}`)
    return data
  },
}

// ------------------------------------------------------------
// CATEGORIES
// ------------------------------------------------------------
export const categoriesAdminApi = {
  list: async (): Promise<{ count: number; categories: Category[] }> => {
    const { data } = await httpClient.get<{
      count: number
      categories: Category[]
    }>('/categories')
    return data
  },

  create: async (payload: {
    name: string
    slug: string
    icon?: string | null
    image_url?: string | null
  }): Promise<{ category: Category }> => {
    const { data } = await httpClient.post<{ category: Category }>(
      '/admin/categories',
      payload
    )
    return data
  },

  update: async (
    id: number,
    payload: Partial<{
      name: string
      slug: string
      icon: string | null
      image_url: string | null
    }>
  ): Promise<{ category: Category }> => {
    const { data } = await httpClient.put<{ category: Category }>(
      `/admin/categories/${id}`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/admin/categories/${id}`)
  },
}

// ------------------------------------------------------------
// PROMO
// ------------------------------------------------------------
export const promoAdminApi = {
  list: async (params?: {
    active_only?: boolean
    limit?: number
    offset?: number
  }): Promise<{ count: number; promos: PromoCode[] }> => {
    const { data } = await httpClient.get<{
      count: number
      promos: PromoCode[]
    }>('/admin/promo', { params })
    return data
  },

  create: async (payload: {
    code: string
    description?: string | null
    type: 'percent' | 'fixed'
    value: number
    min_amount?: number | null
    max_uses?: number | null
    max_uses_per_user?: number | null
    valid_from?: string | null
    valid_until?: string | null
    is_active?: boolean
    notify_users?: boolean
  }): Promise<{ promo: PromoCode }> => {
    const { data } = await httpClient.post<{ promo: PromoCode }>(
      '/admin/promo',
      payload
    )
    return data
  },

  update: async (
    id: number,
    payload: Partial<{
      description: string | null
      type: 'percent' | 'fixed'
      value: number
      min_amount: number | null
      max_uses: number | null
      max_uses_per_user: number | null
      valid_from: string | null
      valid_until: string | null
      is_active: boolean
    }>
  ): Promise<{ promo: PromoCode }> => {
    const { data } = await httpClient.put<{ promo: PromoCode }>(
      `/admin/promo/${id}`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/admin/promo/${id}`)
  },
}

// ------------------------------------------------------------
// AUDIT
// ------------------------------------------------------------
export const auditAdminApi = {
  list: async (params?: {
    limit?: number
    offset?: number
    action?: string
    admin_id?: number
  }): Promise<{ count: number; logs: AuditLog[] }> => {
    const { data } = await httpClient.get<{ count: number; logs: AuditLog[] }>(
      '/admin/audit/logs',
      { params }
    )
    return data
  },
  stats: async (): Promise<AuditStats> => {
    const { data } = await httpClient.get<AuditStats>('/admin/audit/stats')
    return data
  },
}

// ------------------------------------------------------------
// BACKUP
// ------------------------------------------------------------
export const backupAdminApi = {
  run: async () => {
    const { data } = await httpClient.post('/admin/backup/run')
    return data
  },
  list: async (): Promise<{ count: number; backups: BackupFile[] }> => {
    const { data } = await httpClient.get<{
      count: number
      backups: BackupFile[]
    }>('/admin/backup/list')
    return data
  },
  stats: async (): Promise<BackupStats> => {
    const { data } = await httpClient.get<BackupStats>('/admin/backup/stats')
    return data
  },
}
