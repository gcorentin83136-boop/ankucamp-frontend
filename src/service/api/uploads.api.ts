// ============================================================
// ANKU — API Uploads
// Upload de fichiers vers Cloudinary (via backend)
// ============================================================

import httpClient from './httpClient'

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export interface UploadResponse {
  success: boolean
  message: string
  url: string
}

// ------------------------------------------------------------
// API Uploads
// ------------------------------------------------------------
export const uploadsApi = {
  /**
   * POST /uploads/avatar
   * Upload l'avatar de l'utilisateur connecté (image, 5 MB max).
   */
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  /**
   * POST /uploads/cover
   */
  uploadCover: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/cover',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  /**
   * POST /uploads/kyc-document
   * Upload un document KYC (PDF ou image, 10 MB max).
   * Retourne l'URL Cloudinary.
   */
  uploadKycDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/kyc-document',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },
}

export default uploadsApi
