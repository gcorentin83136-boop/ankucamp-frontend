// ============================================================
// ANKU — API Authentification
// Toutes les routes de /auth (login, register, OAuth, 2FA...)
// ============================================================

import httpClient from './httpClient'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from '../../types/user'

// ------------------------------------------------------------
// Types de réponses
// ------------------------------------------------------------
export interface RegisterResponse {
  success: boolean
  message: string
  user: User
}

export interface SimpleResponse {
  success: boolean
  message: string
}

export interface Validate2FAResponse extends LoginResponse {}

// ------------------------------------------------------------
// API Auth
// ------------------------------------------------------------
export const authApi = {
  /**
   * POST /auth/register
   * Inscription (particulier ou professionnel).
   */
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const { data } = await httpClient.post<RegisterResponse>(
      '/auth/register',
      payload
    )
    return data
  },

  /**
   * POST /auth/login
   * Connexion email + password.
   * Retourne {user, token} OU {requires_2fa, temp_token}.
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await httpClient.post<LoginResponse>('/auth/login', payload)
    return data
  },

  /**
   * POST /auth/2fa/validate
   * Étape 2 du login si 2FA activée.
   */
  validate2FA: async (
    temp_token: string,
    code: string
  ): Promise<Validate2FAResponse> => {
    const { data } = await httpClient.post<Validate2FAResponse>(
      '/auth/2fa/validate',
      { temp_token, code }
    )
    return data
  },

  /**
   * POST /auth/logout
   * Nécessite le Bearer token (ajouté automatiquement par httpClient).
   */
  logout: async (): Promise<SimpleResponse> => {
    const { data } = await httpClient.post<SimpleResponse>('/auth/logout')
    return data
  },

  /**
   * POST /auth/activate
   * Active le compte via le token reçu par email.
   */
  activate: async (token: string): Promise<SimpleResponse> => {
    const { data } = await httpClient.post<SimpleResponse>('/auth/activate', {
      token,
    })
    return data
  },

  /**
   * POST /auth/forgot-password
   * Envoie un email de réinitialisation.
   */
  forgotPassword: async (email: string): Promise<SimpleResponse> => {
    const { data } = await httpClient.post<SimpleResponse>(
      '/auth/forgot-password',
      { email }
    )
    return data
  },

  /**
   * POST /auth/reset-password
   * Réinitialise le mot de passe via token.
   */
  resetPassword: async (
    token: string,
    new_password: string
  ): Promise<SimpleResponse> => {
    const { data } = await httpClient.post<SimpleResponse>(
      '/auth/reset-password',
      { token, new_password }
    )
    return data
  },

  /**
   * GET /auth/google
   * Renvoie l'URL à ouvrir pour lancer l'OAuth Google.
   */
  googleOAuthUrl: (): string => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${apiUrl}/auth/google`
  },
}

export default authApi
