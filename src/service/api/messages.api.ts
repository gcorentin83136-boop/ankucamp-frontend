// ============================================================
// ANKU — API Messages / Conversations
// ============================================================

import httpClient from './httpClient'
import type {
  ConversationsListResponse,
  ConversationResponse,
  MessagesListResponse,
  MessageResponse,
  CreateConversationPayload,
  SendMessagePayload,
  ListMessagesParams,
} from '../../types/message'

export const messagesApi = {
  // ----------------------------------------------------------
  // CONVERSATIONS
  // ----------------------------------------------------------
  listConversations: async (): Promise<ConversationsListResponse> => {
    const { data } = await httpClient.get<ConversationsListResponse>(
      '/conversations'
    )
    return data
  },

  getConversation: async (
    id: number
  ): Promise<ConversationResponse> => {
    const { data } = await httpClient.get<ConversationResponse>(
      `/conversations/${id}`
    )
    return data
  },

  createConversation: async (
    payload: CreateConversationPayload
  ): Promise<ConversationResponse> => {
    const { data } = await httpClient.post<ConversationResponse>(
      '/conversations',
      payload
    )
    return data
  },

  deleteConversation: async (id: number): Promise<void> => {
    await httpClient.delete(`/conversations/${id}`)
  },

  // ----------------------------------------------------------
  // MESSAGES
  // ----------------------------------------------------------
  listMessages: async (
    conversationId: number,
    params?: ListMessagesParams
  ): Promise<MessagesListResponse> => {
    const { data } = await httpClient.get<MessagesListResponse>(
      `/conversations/${conversationId}/messages`,
      { params }
    )
    return data
  },

  sendMessage: async (
    conversationId: number,
    payload: SendMessagePayload
  ): Promise<MessageResponse> => {
    const { data } = await httpClient.post<MessageResponse>(
      `/conversations/${conversationId}/messages`,
      payload
    )
    return data
  },

  markAsRead: async (
    conversationId: number,
    untilMessageId?: number
  ): Promise<{ success: boolean }> => {
    const { data } = await httpClient.post<{ success: boolean }>(
      `/conversations/${conversationId}/read`,
      { until_message_id: untilMessageId ?? null }
    )
    return data
  },
}

// ------------------------------------------------------------
// Helper : ouvrir (ou créer) une conversation directe avec un user
// et envoyer un premier message. Renvoie l'ID de la conversation.
// ------------------------------------------------------------
export async function startDirectConversation(
  otherUserId: number,
  firstMessage?: string
): Promise<number> {
  const created = await messagesApi.createConversation({
    type: 'direct',
    participant_ids: [otherUserId],
  })

  const conversationId = created.conversation.id

  if (firstMessage && firstMessage.trim()) {
    await messagesApi.sendMessage(conversationId, {
      content: firstMessage.trim(),
      type: 'text',
    })
  }

  return conversationId
}

export default messagesApi
