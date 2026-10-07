// ============================================================
// ANKU — API Articles
// ============================================================

import httpClient from './httpClient'
import type {
  ArticleResponse,
  ArticlesListResponse,
  LikeArticleResponse,
  CreateArticlePayload,
  UpdateArticlePayload,
  ListArticlesParams,
} from '../../types/article'

export const articlesApi = {
  list: async (
    params?: ListArticlesParams
  ): Promise<ArticlesListResponse> => {
    const { data } = await httpClient.get<ArticlesListResponse>('/articles', {
      params,
    })
    return data
  },

  getBySlug: async (slug: string): Promise<ArticleResponse> => {
    const { data } = await httpClient.get<ArticleResponse>(
      `/articles/${slug}`
    )
    return data
  },

  listMine: async (): Promise<ArticlesListResponse> => {
    const { data } = await httpClient.get<ArticlesListResponse>('/articles/me')
    return data
  },

  create: async (
    payload: CreateArticlePayload
  ): Promise<ArticleResponse> => {
    const { data } = await httpClient.post<ArticleResponse>(
      '/articles',
      payload
    )
    return data
  },

  update: async (
    id: number,
    payload: UpdateArticlePayload
  ): Promise<ArticleResponse> => {
    const { data } = await httpClient.put<ArticleResponse>(
      `/articles/${id}`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/articles/${id}`)
  },

  like: async (id: number): Promise<LikeArticleResponse> => {
    const { data } = await httpClient.post<LikeArticleResponse>(
      `/articles/${id}/like`
    )
    return data
  },

  listByAuthor: async (authorId: number): Promise<ArticlesListResponse> => {
    const { data } = await httpClient.get<ArticlesListResponse>('/articles', {
      params: { author_id: authorId },
    })
    return data
  },

  uploadCover: async (
    file: File
  ): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{
      success: boolean
      url: string
    }>('/uploads/event-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

export default articlesApi
