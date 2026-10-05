import httpClient from '../httpClient'
import type {
  DataExportRequest,
  AccountDeletionRequest,
  LegalAcceptance,
} from '../../../types/settings'

export interface SimpleResponse {
  success: boolean
  message: string
}

export interface ExportResponse extends SimpleResponse {
  request: DataExportRequest
}

export interface ExportStatusResponse {
  success: boolean
  message?: string
  request: DataExportRequest | null
}

export interface DeletionResponse extends SimpleResponse {
  request: AccountDeletionRequest
}

export interface DeletionStatusResponse {
  success: boolean
  request: AccountDeletionRequest | null
}

export interface AcceptancesResponse {
  success: boolean
  count: number
  acceptances: LegalAcceptance[]
}

export interface AcceptanceResponse extends SimpleResponse {
  acceptance: LegalAcceptance
}

export const gdprApi = {
  // --- Export ---
  exportData: async (): Promise<ExportResponse> => {
    const { data } = await httpClient.post<ExportResponse>(
      '/settings/gdpr/export'
    )
    return data
  },

  exportStatus: async (): Promise<ExportStatusResponse> => {
    const { data } = await httpClient.get<ExportStatusResponse>(
      '/settings/gdpr/export/status'
    )
    return data
  },

  // --- Suppression ---
  requestDeletion: async (
    password: string,
    reason?: string
  ): Promise<DeletionResponse> => {
    const { data } = await httpClient.post<DeletionResponse>(
      '/settings/gdpr/delete',
      { password, reason: reason ?? null }
    )
    return data
  },

  cancelDeletion: async (): Promise<SimpleResponse> => {
    const { data } = await httpClient.delete<SimpleResponse>(
      '/settings/gdpr/delete'
    )
    return data
  },

  deletionStatus: async (): Promise<DeletionStatusResponse> => {
    const { data } = await httpClient.get<DeletionStatusResponse>(
      '/settings/gdpr/deletion/status'
    )
    return data
  },

  // --- Acceptances légales ---
  listAcceptances: async (): Promise<AcceptancesResponse> => {
    const { data } = await httpClient.get<AcceptancesResponse>(
      '/settings/gdpr/acceptances'
    )
    return data
  },

  acceptDocument: async (
    document_type: string,
    document_version: string
  ): Promise<AcceptanceResponse> => {
    const { data } = await httpClient.post<AcceptanceResponse>(
      '/settings/gdpr/acceptance',
      { document_type, document_version }
    )
    return data
  },
}

export default gdprApi
