// ============================================================
// ANKU — API KYC (vérification professionnels)
// Routes : /kyc/request, /kyc/me
// ============================================================

import httpClient from './httpClient'
import type { CreateKycPayload, KycRequest } from '../../types/user'

// ------------------------------------------------------------
// Types de réponses
// ------------------------------------------------------------
export interface CreateKycResponse {
  success: boolean
  request: KycRequest
}

export interface GetMyKycResponse {
  success: boolean
  request: KycRequest | null
}

export interface CancelKycResponse {
  success: boolean
}

// ------------------------------------------------------------
// API KYC
// ------------------------------------------------------------
export const kycApi = {
  /**
   * POST /kyc/request
   * Crée une demande KYC (réservé aux professionnels).
   * Le backend vérifie automatiquement le SIRET via l'API Sirene.
   */
  createRequest: async (
    payload: CreateKycPayload
  ): Promise<CreateKycResponse> => {
    const { data } = await httpClient.post<CreateKycResponse>(
      '/kyc/request',
      payload
    )
    return data
  },

  /**
   * GET /kyc/me
   * Récupère la dernière demande KYC de l'utilisateur connecté.
   */
  getMyRequest: async (): Promise<GetMyKycResponse> => {
    const { data } = await httpClient.get<GetMyKycResponse>('/kyc/me')
    return data
  },

  /**
   * DELETE /kyc/me
   * Annule la demande KYC en cours.
   */
  cancelMyRequest: async (): Promise<CancelKycResponse> => {
    const { data } = await httpClient.delete<CancelKycResponse>('/kyc/me')
    return data
  },
}

export default kycApi
