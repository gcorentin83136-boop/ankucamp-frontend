export interface MessageAuthor {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'call'
  content: string
  media_url: string | null
  reply_to_message_id: number | null
  reply_to_message?: {
    id: number
    content: string
    type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'call'
    media_url: string | null
    deleted_at: string | null
    author?: MessageAuthor | null
  } | null
  edited_at: string | null
  deleted_at: string | null
  created_at: string
  author?: MessageAuthor | null
  reactions?: Record<string, number[]>
}

export interface Conversation {
  id: number
  type: 'direct' | 'group'
  name: string | null
  avatar_url: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  participants: Array<{
    user_id: number
    role: string
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  }>
}

export interface ConversationsListResponse {
  success: boolean
  count: number
  conversations: Conversation[]
}

export interface ConversationResponse {
  success: boolean
  conversation: Conversation
}

export interface MessagesListResponse {
  success: boolean
  count: number
  messages: Message[]
}

export interface MessageResponse {
  success: boolean
  message: Message
}

export interface CreateConversationPayload {
  type: 'direct' | 'group'
  participant_ids: number[]
  name?: string
}

export interface SendMessagePayload {
  content?: string
  type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'call'
  media_url?: string
  reply_to_message_id?: number
}

export interface ListMessagesParams {
  limit?: number
  before_message_id?: number
}