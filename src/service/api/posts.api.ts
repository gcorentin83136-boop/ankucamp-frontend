// ============================================================
// ANKU — API Posts
// ============================================================

import httpClient from './httpClient'
import type {
  FeedResponse,
  PostResponse,
  PostsListResponse,
  CommentResponse,
  CommentsListResponse,
  LikeResponse,
  CreatePostPayload,
  UpdatePostPayload,
  SharePostPayload,
  ListPostsParams,
} from '../../types/post'

export const postsApi = {
  // ----------------------------------------------------------
  // LECTURE
  // ----------------------------------------------------------

  feed: async (params?: ListPostsParams): Promise<FeedResponse> => {
    const { data } = await httpClient.get<FeedResponse>('/posts/feed', {
      params,
    })
    return data
  },

  mine: async (params?: ListPostsParams): Promise<PostsListResponse> => {
    const { data } = await httpClient.get<PostsListResponse>('/posts/me', {
      params,
    })
    return data
  },

  byUser: async (
    userId: number,
    params?: ListPostsParams
  ): Promise<PostsListResponse> => {
    const { data } = await httpClient.get<PostsListResponse>(
      `/posts/user/${userId}`,
      { params }
    )
    return data
  },

  getOne: async (id: number): Promise<PostResponse> => {
    const { data } = await httpClient.get<PostResponse>(`/posts/${id}`)
    return data
  },

  // ----------------------------------------------------------
  // CRÉATION / MODIF / SUPPRESSION
  // ----------------------------------------------------------

  create: async (payload: CreatePostPayload): Promise<PostResponse> => {
    const { data } = await httpClient.post<PostResponse>('/posts', payload)
    return data
  },

  update: async (
    id: number,
    payload: UpdatePostPayload
  ): Promise<PostResponse> => {
    const { data } = await httpClient.patch<PostResponse>(
      `/posts/${id}`,
      payload
    )
    return data
  },

  remove: async (id: number): Promise<void> => {
    await httpClient.delete(`/posts/${id}`)
  },

  // ----------------------------------------------------------
  // LIKES
  // ----------------------------------------------------------

  like: async (id: number): Promise<LikeResponse> => {
    const { data } = await httpClient.post<LikeResponse>(`/posts/${id}/like`)
    return data
  },

  likes: async (id: number): Promise<any> => {
    const { data } = await httpClient.get(`/posts/${id}/likes`)
    return data
  },

  // ----------------------------------------------------------
  // COMMENTAIRES
  // ----------------------------------------------------------

  comments: async (
    id: number,
    params?: ListPostsParams
  ): Promise<CommentsListResponse> => {
    const { data } = await httpClient.get<CommentsListResponse>(
      `/posts/${id}/comments`,
      { params }
    )
    return data
  },

  addComment: async (
    id: number,
    content: string,
    parent_comment_id?: number | null
  ): Promise<CommentResponse> => {
    const { data } = await httpClient.post<CommentResponse>(
      `/posts/${id}/comments`,
      { content, parent_comment_id: parent_comment_id ?? null }
    )
    return data
  },

  removeComment: async (id: number, commentId: number): Promise<void> => {
    await httpClient.delete(`/posts/${id}/comments/${commentId}`)
  },

  // ----------------------------------------------------------
  // PARTAGES
  // ----------------------------------------------------------

  share: async (
    id: number,
    payload: SharePostPayload
  ): Promise<PostResponse> => {
    const { data } = await httpClient.post<PostResponse>(
      `/posts/${id}/share`,
      payload
    )
    return data
  },
}

export default postsApi