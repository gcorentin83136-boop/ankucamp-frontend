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
  // Méthodes standards
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

  // 🆕 Alias pour compatibilité avec tes anciens composants (Feed)
  listForArticle: async (articleId: number) => {
    const { data } = await httpClient.get(`/articles/${articleId}/comments`)
    return data
  },
  
  createForArticle: async (articleId: number, content: string, parentId?: number, mediaUrl?: string) => {
    const { data } = await httpClient.post(`/articles/${articleId}/comments`, { 
      content, parent_comment_id: parentId, media_url: mediaUrl 
    })
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