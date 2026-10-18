import httpClient from './httpClient'
import type {
  ConversationsListResponse, ConversationResponse, MessagesListResponse,
  MessageResponse, CreateConversationPayload, SendMessagePayload, ListMessagesParams
} from '../../types/message'

export const messagesApi = {
  listConversations: async (): Promise<ConversationsListResponse> => {
    const { data } = await httpClient.get('/conversations'); return data
  },
  getConversation: async (id: number): Promise<ConversationResponse> => {
    const { data } = await httpClient.get(`/conversations/${id}`); return data
  },
  createConversation: async (payload: CreateConversationPayload): Promise<ConversationResponse> => {
    const { data } = await httpClient.post('/conversations', payload); return data
  },
  listMessages: async (conversationId: number, params?: ListMessagesParams): Promise<MessagesListResponse> => {
    const { data } = await httpClient.get(`/conversations/${conversationId}/messages`, { params }); return data
  },
  sendMessage: async (conversationId: number, payload: SendMessagePayload): Promise<MessageResponse> => {
    const { data } = await httpClient.post(`/conversations/${conversationId}/messages`, payload); return data
  },
  markAsRead: async (conversationId: number, untilMessageId?: number): Promise<{ success: boolean }> => {
    const { data } = await httpClient.post(`/conversations/${conversationId}/read`, { until_message_id: untilMessageId ?? null }); return data
  },
  editMessage: async (messageId: number, content: string): Promise<MessageResponse> => {
    const { data } = await httpClient.put(`/messages/${messageId}`, { content }); return data
  },
  leaveConversation: async (id: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await httpClient.post(`/conversations/${id}/leave`)
    return data
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await httpClient.delete(`/messages/${messageId}`)
  },
  reactToMessage: async (messageId: number, emoji: string): Promise<{ success: boolean; action: string }> => {
    const { data } = await httpClient.post(`/messages/${messageId}/reactions`, { emoji }); return data
  },
  
  // 🆕 Upload de média pour le chat (images, audios, vidéos)
  uploadChatMedia: async (file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post('/uploads/chat-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 🆕 2 minutes pour laisser le temps aux vidéos de s'uploader
    })
    return data
  }
}

// 🚀 HELPER MAGIQUE pour brancher tous les boutons "Contacter"
export async function startDirectConversation(otherUserId: number, firstMessage?: string): Promise<number> {
  const created = await messagesApi.createConversation({
    type: 'direct',
    participant_ids: [otherUserId],
  })
  const conversationId = created.conversation.id

  if (firstMessage && firstMessage.trim()) {
    await messagesApi.sendMessage(conversationId, { content: firstMessage.trim(), type: 'text' })
  }
  return conversationId
}

export default messagesApi