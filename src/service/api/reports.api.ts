// ============================================================
// ANKU — API Reports (signalements)
// ============================================================

import httpClient from './httpClient'
import type { CreateReportPayload, ReportResponse } from '../../types/report'

export const reportsApi = {
  /**
   * POST /reports
   * Crée un signalement (tout utilisateur connecté).
   */
  create: async (payload: CreateReportPayload): Promise<ReportResponse> => {
    const { data } = await httpClient.post<ReportResponse>('/reports', payload)
    return data
  },
}

export default reportsApi