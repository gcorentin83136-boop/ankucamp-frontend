import httpClient from './httpClient'
import type { Comment } from './comments.api'

export const eventCommentsApi = {
  listByEvent: async (eventId: number): Promise<{ success: boolean; count: number; comments: Comment[] }> => {
    const { data } = await httpClient.get(`/events/${eventId}/comments`)
    return data
  },
  create: async (eventId: number, content: string, parentCommentId?: number, mediaUrl?: string): Promise<{ success: boolean; comment: Comment }> => {
    const { data } = await httpClient.post(`/events/${eventId}/comments`, { 
      content, parent_comment_id: parentCommentId, media_url: mediaUrl 
    })
    return data
  },
  react: async (commentId: number, emoji: string = '❤️'): Promise<{ success: boolean; action: string; emoji: string }> => {
    const { data } = await httpClient.post(`/events/comments/${commentId}/reactions`, { emoji })
    return data
  }
}