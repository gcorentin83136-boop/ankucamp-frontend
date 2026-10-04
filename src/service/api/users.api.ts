// ============================================================
// ANKU — API Users (profil, stats, amis)
// Routes : /users/me, /users/:id, /users/u/:username
// ============================================================

import httpClient from './httpClient'
import type { UpdateProfilePayload, User, UserMe } from '../../types/user'

// ------------------------------------------------------------
// Types de réponses
// ------------------------------------------------------------
export interface GetMeResponse {
  success: boolean
  user: UserMe
}

export interface UpdateMeResponse {
  success: boolean
  message: string
  user: UserMe
}

export interface UpdatePrivacyResponse {
  success: boolean
  message: string
  user: User
}

export interface GetUserResponse {
  success: boolean
  user: User
}

export interface ListUsersResponse {
  success: boolean
  count: number
  users: User[]
}

export interface GetStatsResponse {
  success: boolean
  stats: {
    posts_count: number
    friends_count: number
    reviews_count: number
    average_rating: number
  }
}

// ------------------------------------------------------------
// Types : Become Pro
// ------------------------------------------------------------
export interface BecomeProPayload {
  type: 'agriculteur' | 'artisan' | 'createur' | 'autre'
  siret: string
  documents: string[]
}

export interface BecomeProResponse {
  success: boolean
  message: string
  kyc: {
    id: number
    user_id: number
    status: string
    type: string
    siret: string
  }
  token: string
  newRole: 'professionnel'
}

// ------------------------------------------------------------
// API Users
// ------------------------------------------------------------
export const usersApi = {
  /**
   * GET /users/me
   * Récupère mon profil complet.
   */
  getMe: async (): Promise<GetMeResponse> => {
    const { data } = await httpClient.get<GetMeResponse>('/users/me')
    return data
  },

  /**
   * PUT /users/me
   * Met à jour mon profil.
   */
  updateMe: async (payload: UpdateProfilePayload): Promise<UpdateMeResponse> => {
    const { data } = await httpClient.put<UpdateMeResponse>(
      '/users/me',
      payload
    )
    return data
  },

  /**
   * PUT /users/me/privacy
   * Bascule le profil public/privé.
   */
  updatePrivacy: async (is_private: boolean): Promise<UpdatePrivacyResponse> => {
    const { data } = await httpClient.put<UpdatePrivacyResponse>(
      '/users/me/privacy',
      { is_private }
    )
    return data
  },

  /**
   * GET /users/:id
   * Récupère un utilisateur par ID.
   */
  getById: async (id: number): Promise<GetUserResponse> => {
    const { data } = await httpClient.get<GetUserResponse>(`/users/${id}`)
    return data
  },

  /**
   * GET /users/u/:username
   * Récupère un utilisateur par username.
   */
  getByUsername: async (username: string): Promise<GetUserResponse> => {
    const { data } = await httpClient.get<GetUserResponse>(
      `/users/u/${username}`
    )
    return data
  },

  /**
   * GET /users
   * Liste paginée + recherche.
   */
  list: async (params?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<ListUsersResponse> => {
    const { data } = await httpClient.get<ListUsersResponse>('/users', {
      params,
    })
    return data
  },

  /**
   * GET /users/:id/stats
   * Stats publiques d'un utilisateur (posts, amis, avis).
   */
  getStats: async (id: number): Promise<GetStatsResponse> => {
    const { data } = await httpClient.get<GetStatsResponse>(
      `/users/${id}/stats`
    )
    return data
  },

  /**
   * POST /users/me/become-pro
   * Convertit un particulier en pro + crée une demande KYC.
   * Retourne un nouveau JWT avec role: "professionnel".
   */
  becomePro: async (payload: BecomeProPayload): Promise<BecomeProResponse> => {
    const { data } = await httpClient.post<BecomeProResponse>(
      '/users/me/become-pro',
      payload
    )
    return data
  },
}

export default usersApi