// ============================================================
// ANKU — Types Post (réseau social)
// ============================================================

export type PostVisibility = 'public' | 'friends' | 'private'

export interface PostAuthor {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  verification_status?: string
  badges?: string[]
}

export interface PostMediaItem {
  url: string
  type?: 'image' | 'video'
}

export interface Post {
  id: number
  author_id: number
  content: string | null
  media_urls: string | null
  visibility: PostVisibility
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at?: string

  // Champs calculés (back)
  author?: PostAuthor | null
  is_liked_by_me?: boolean
  is_mine?: boolean
  media?: PostMediaItem[]
}

export interface PostComment {
  id: number
  post_id: number
  author_id: number
  content: string
  parent_comment_id: number | null
  created_at: string

  author?: PostAuthor | null
}

export interface CreatePostPayload {
  content?: string | null
  media_urls?: string[]
  visibility?: PostVisibility
}

export interface UpdatePostPayload {
  content?: string | null
  visibility?: PostVisibility
}

export interface SharePostPayload {
  share_comment?: string | null
  visibility?: PostVisibility
}

export interface FeedResponse {
  success: boolean
  count: number
  posts: Post[]
  events_from_friends: any[]
}

export interface PostResponse {
  success: boolean
  post: Post
}

export interface PostsListResponse {
  success: boolean
  count: number
  posts: Post[]
}

export interface CommentResponse {
  success: boolean
  comment: PostComment
}

export interface CommentsListResponse {
  success: boolean
  count: number
  comments: PostComment[]
}

export interface LikeResponse {
  success: boolean
  message: string
  liked: boolean
}

export interface ListPostsParams {
  limit?: number
  offset?: number
}