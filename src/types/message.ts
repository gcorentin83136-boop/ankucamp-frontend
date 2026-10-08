// ============================================================
// ANKU — Types Message & Conversation
// ============================================================

export type ConversationType = 'direct' | 'group'
export type MessageType = 'text' | 'image' | 'file'

export interface ConversationParticipant {
  id: number
  conversation_id: number
  user_id: number
  joined_at: string
  last_read_at?: string | null
  user?: {
    id: number
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  } | null
}

export interface Conversation {
  id: number
  type: ConversationType
  name: string | null
  avatar_url: string | null
  created_by: number
  created_at: string
  updated_at: string
  participants?: ConversationParticipant[]
  last_message?: Message | null
  unread_count?: number
}

export interface MessageReaction {
  id: number
  message_id: number
  user_id: number
  emoji: string
  created_at: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string | null
  type: MessageType
  media_url: string | null
  reply_to_message_id: number | null
  edited_at?: string | null
  deleted_at?: string | null
  created_at: string
  sender?: {
    id: number
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  } | null
  reactions?: MessageReaction[]
}

// ------------------------------------------------------------
// Payloads
// ------------------------------------------------------------
export interface CreateConversationPayload {
  type: ConversationType
  participant_ids: number[]
  name?: string | null
  avatar_url?: string | null
}

export interface SendMessagePayload {
  content?: string | null
  type?: MessageType
  media_url?: string | null
  reply_to_message_id?: number | null
}

export interface ListMessagesParams {
  limit?: number
  before_message_id?: number
}

// ------------------------------------------------------------
// Réponses
// ------------------------------------------------------------
export interface ConversationsListResponse {
  success: boolean
  count: number
  conversations: Conversation[]
}

export interface ConversationResponse {
  success: boolean
  message?: string
  conversation: Conversation
}

export interface MessagesListResponse {
  success: boolean
  count: number
  messages: Message[]
}

export interface MessageResponse {
  success: boolean
  message?: string
  data?: Message
}
