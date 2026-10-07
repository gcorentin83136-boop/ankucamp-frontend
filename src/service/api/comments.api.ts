// ============================================================
// ANKU — API Commentaires (articles + posts)
// ============================================================

import httpClient from './httpClient'
import type {
  CommentsListResponse,
  CommentResponse,
  CreateCommentPayload,
} from '../../types/comment'

export const commentsApi = {
  // --------------------------------------------------------
  // ARTICLES
  // --------------------------------------------------------
  listForArticle: async (
    articleId: number
  ): Promise<CommentsListResponse> => {
    const { data } = await httpClient.get<CommentsListResponse>(
      `/articles/${articleId}/comments`
    )
    return data
  },

  createForArticle: async (
    articleId: number,
    payload: CreateCommentPayload
  ): Promise<CommentResponse> => {
    const { data } = await httpClient.post<CommentResponse>(
      `/articles/${articleId}/comments`,
      payload
    )
    return data
  },

  update: async (
    commentId: number,
    content: string
  ): Promise<CommentResponse> => {
    const { data } = await httpClient.put<CommentResponse>(
      `/articles/comments/${commentId}`,
      { content }
    )
    return data
  },

  delete: async (commentId: number): Promise<{ success: boolean }> => {
    const { data } = await httpClient.delete(
      `/articles/comments/${commentId}`
    )
    return data
  },

  react: async (
    commentId: number,
    emoji: string
  ): Promise<{ success: boolean; action: 'added' | 'removed' }> => {
    const { data } = await httpClient.post(
      `/articles/comments/${commentId}/reactions`,
      { emoji }
    )
    return data
  },

  // --------------------------------------------------------
  // PARTAGER UN ARTICLE EN POST
  // --------------------------------------------------------
  shareArticle: async (
    articleId: number,
    payload: { share_comment?: string | null; visibility?: string }
  ): Promise<{ success: boolean; post: any }> => {
    const { data } = await httpClient.post(
      `/posts/share-article/${articleId}`,
      payload
    )
    return data
  },

  // --------------------------------------------------------
  // UPLOAD MÉDIA
  // --------------------------------------------------------
  uploadMedia: async (
    file: File
  ): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{
      success: boolean
      url: string
    }>('/uploads/comment-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

export default commentsApi
