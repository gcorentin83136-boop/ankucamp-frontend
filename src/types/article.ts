// ============================================================
// ANKU — Types Articles
// ============================================================

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface ArticleAuthor {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  verification_status: string
  badges: string[]
}

export interface Article {
  id: number
  author_id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_url: string | null
  tags: string | null
  category: string
  status: ArticleStatus
  published_at: string | null
  views_count: number
  likes_count: number
  created_at: string
  updated_at: string
  author?: ArticleAuthor | null
  liked_by_me?: boolean
}

export interface CreateArticlePayload {
  title: string
  content: string
  excerpt?: string | null
  cover_url?: string | null
  tags?: string | null
  category: string
  status?: ArticleStatus
}

export type UpdateArticlePayload = Partial<CreateArticlePayload>

export interface ListArticlesParams {
  category?: string
  tag?: string
  status?: ArticleStatus | 'all'
  limit?: number
  offset?: number
}

export interface ArticlesListResponse {
  success: boolean
  count: number
  articles: Article[]
}

export interface ArticleResponse {
  success: boolean
  article: Article
}

export interface LikeArticleResponse {
  success: boolean
  liked: boolean
  message: string
}
