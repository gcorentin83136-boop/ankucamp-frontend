// ============================================================
// ANKU — Types Commentaires
// ============================================================

export interface CommentAuthor {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  verification_status: string
  badges: string[]
}

export interface Comment {
  id: number
  article_id?: number
  post_id?: number
  author_id: number
  content: string
  media_url: string | null
  parent_comment_id: number | null
  created_at: string
  updated_at: string
  author?: CommentAuthor | null
  reactions?: Record<string, number[]>  // emoji → user_ids
  my_reactions?: string[]
  replies?: Comment[]
}

export interface CommentsListResponse {
  success: boolean
  count: number
  comments: Comment[]
}

export interface CommentResponse {
  success: boolean
  comment: Comment
}

export interface CreateCommentPayload {
  content: string
  media_url?: string | null
  parent_comment_id?: number | null
}

export interface ReactCommentPayload {
  emoji: string
}
