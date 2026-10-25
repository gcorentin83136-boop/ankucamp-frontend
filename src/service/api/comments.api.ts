import httpClient from './httpClient'

export interface CommentAuthor {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
}

export interface Comment {
  id: number
  article_id: number
  content: string
  media_url?: string | null
  created_at: string
  author: CommentAuthor
  reactions?: Record<string, number[]>
  my_reactions?: string[]
  replies?: Comment[]
  parent_comment_id?: number | null
}

export const commentsApi = {
  listByArticle: async (articleId: number): Promise<{ success: boolean; count: number; comments: Comment[] }> => {
    const { data } = await httpClient.get(`/articles/${articleId}/comments`)
    return data
  },

  create: async (
    articleId: number, 
    content: string, 
    parentCommentId?: number,
    mediaUrl?: string
  ): Promise<{ success: boolean; comment: Comment }> => {
    const { data } = await httpClient.post(`/articles/${articleId}/comments`, { 
      content,
      parent_comment_id: parentCommentId,
      media_url: mediaUrl
    })
    return data
  },

  react: async (commentId: number, emoji: string = '❤️'): Promise<{ success: boolean; action: string; emoji: string }> => {
    const { data } = await httpClient.post(`/articles/comments/${commentId}/reactions`, { emoji })
    return data
  },

  // 🆕 Méthodes pour corriger CommentSection (ancien Feed)
  listForArticle: async (articleId: number) => {
    const { data } = await httpClient.get(`/articles/${articleId}/comments`)
    return data
  },

  createForArticle: async (articleId: number, payload: any) => {
    // On accepte l'ancien format (objet) ou le nouveau (paramètres séparés)
    const isObj = typeof payload === 'object' && payload !== null;
    const body = isObj ? {
      content: payload.content,
      media_url: payload.media_url,
      parent_comment_id: payload.parent_comment_id
    } : {
      content: arguments[1],
      parent_comment_id: arguments[2],
      media_url: arguments[3]
    };
    const { data } = await httpClient.post(`/articles/${articleId}/comments`, body)
    return data
  },

  update: async (commentId: number, content: string) => {
    const { data } = await httpClient.put(`/articles/comments/${commentId}`, { content })
    return data
  },

  delete: async (commentId: number) => {
    const { data } = await httpClient.delete(`/articles/comments/${commentId}`)
    return data
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post('/uploads/event-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }
}