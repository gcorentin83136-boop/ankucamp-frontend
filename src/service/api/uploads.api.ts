// ============================================================
// ANKU — API Uploads
// ============================================================

import httpClient from './httpClient'

export interface UploadResponse {
  success: boolean
  message: string
  url: string
}

export const uploadsApi = {
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

  // ----------------------------------------------------------
  // SHOP LOGO
  // ----------------------------------------------------------
  uploadShopLogo: async (
    shopId: number,
    file: File
  ): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('shop_id', String(shopId))
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/shop-logo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // PRODUCT IMAGE
  // ----------------------------------------------------------
  uploadProductImage: async (
    productId: number,
    file: File
  ): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('product_id', String(productId))
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/product',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // POST MEDIA
  // ----------------------------------------------------------
  uploadPostMedia: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/post-media',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // POST VIDEO (réseau social)
  // ----------------------------------------------------------
  uploadPostVideo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadResponse>(
      '/uploads/post-video',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },
}

export default uploadsApi
