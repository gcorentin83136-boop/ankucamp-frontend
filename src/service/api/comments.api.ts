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
  reactions?: Record<string, number[]> // ex: { "❤️": [1, 2] }
  my_reactions?: string[] // ex: ["❤️"]
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

  // 🆕 Ajouter/Retirer une réaction (URL corrigée avec /reactions)
  react: async (commentId: number, emoji: string = '❤️'): Promise<{ success: boolean; action: string; emoji: string }> => {
    const { data } = await httpClient.post(`/articles/comments/${commentId}/reactions`, { emoji })
    return data
  }
}