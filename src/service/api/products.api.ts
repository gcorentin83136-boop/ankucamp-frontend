// ============================================================
// ANKU — API Products
// ============================================================

import httpClient from './httpClient'
import type {
  ProductResponse,
  ProductsListResponse,
  UploadProductResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from '../../types/product'

export const productsApi = {
  list: async (): Promise<ProductsListResponse> => {
    const { data } = await httpClient.get<ProductsListResponse>('/products')
    return data
  },

  listByShop: async (shopId: number): Promise<ProductsListResponse> => {
    const { data } = await httpClient.get<ProductsListResponse>(
      `/products/shop/${shopId}`
    )
    return data
  },

  getById: async (id: number): Promise<ProductResponse> => {
    const { data } = await httpClient.get<ProductResponse>(`/products/${id}`)
    return data
  },

  create: async (payload: CreateProductPayload): Promise<ProductResponse> => {
    const { data } = await httpClient.post<ProductResponse>(
      '/products',
      payload
    )
    return data
  },

  update: async (
    id: number,
    payload: UpdateProductPayload
  ): Promise<ProductResponse> => {
    const { data } = await httpClient.put<ProductResponse>(
      `/products/${id}`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/products/${id}`)
  },

  // ----------------------------------------------------------
  // UPLOAD IMAGE DRAFT (avant création produit)
  // ----------------------------------------------------------
  uploadImageDraft: async (file: File): Promise<UploadProductResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadProductResponse>(
      '/uploads/product-image-draft',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // UPLOAD IMAGE (produit existant)
  // ----------------------------------------------------------
  uploadImage: async (
    productId: number,
    file: File
  ): Promise<UploadProductResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('product_id', String(productId))
    const { data } = await httpClient.post<UploadProductResponse>(
      '/uploads/product',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // UPLOAD VIDÉO DRAFT (avant création produit)
  // ----------------------------------------------------------
  uploadVideoDraft: async (
    file: File
  ): Promise<UploadProductResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<UploadProductResponse>(
      '/uploads/product-video-draft',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // UPLOAD VIDÉO (max 3 par produit)
  // ----------------------------------------------------------
  uploadVideo: async (
    productId: number,
    file: File
  ): Promise<UploadProductResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('product_id', String(productId))
    const { data } = await httpClient.post<UploadProductResponse>(
      '/uploads/product-video',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ----------------------------------------------------------
  // SUPPRIMER UNE VIDÉO
  // ----------------------------------------------------------
  deleteVideo: async (
    productId: number,
    url: string
  ): Promise<UploadProductResponse> => {
    const { data } = await httpClient.delete<UploadProductResponse>(
      '/uploads/product-video',
      { data: { product_id: productId, url } }
    )
    return data
  },
}

export default productsApi
