import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authApi from '../service/api/auth.api'
import usersApi from '../service/api/users.api'
import type {
  LoginPayload,
  RegisterPayload,
  User,
  UserMe,
} from '../types/user'

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
interface AuthState {
  user: User | UserMe | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  requires2FA: boolean
  tempToken: string | null

  // Actions
  login: (payload: LoginPayload) => Promise<{ success: boolean; requires2FA?: boolean }>
  register: (payload: RegisterPayload) => Promise<boolean>
  validate2FA: (code: string) => Promise<boolean>
  logout: () => Promise<void>
  fetchMe: () => Promise<boolean>
  loginWithToken: (token: string) => Promise<boolean>
  setUser: (user: Partial<User | UserMe>, token: string) => void
  mergeUser: (partial: Partial<User | UserMe>) => void
  clearError: () => void
}

// ------------------------------------------------------------
// Store
// ------------------------------------------------------------
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requires2FA: false,
      tempToken: null,

      // ------------------------------------------------------
      // LOGIN
      // ------------------------------------------------------
      login: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.login(payload)

          if (res.requires_2fa && res.temp_token) {
            set({
              requires2FA: true,
              tempToken: res.temp_token,
              isLoading: false,
            })
            return { success: true, requires2FA: true }
          }

          if (res.token && res.user) {
            localStorage.setItem('anku_token', res.token)
            localStorage.setItem('anku_user', JSON.stringify(res.user))
            set({
              user: res.user,
              token: res.token,
              isAuthenticated: true,
              isLoading: false,
              requires2FA: false,
              tempToken: null,
              error: null,
            })
            return { success: true }
          }

          set({ isLoading: false, error: 'Réponse serveur invalide' })
          return { success: false }
        } catch (err: any) {
          const message =
            err.response?.data?.message || 'Erreur de connexion au serveur'
          set({ error: message, isLoading: false })
          return { success: false }
        }
      },

      // ------------------------------------------------------
      // LOGIN WITH TOKEN (OAuth Google callback)
      // ------------------------------------------------------
      loginWithToken: async (token) => {
        set({ isLoading: true, error: null })
        try {
          localStorage.setItem('anku_token', token)
          set({ token })

          const res = await usersApi.getMe()
          if (res.user) {
            localStorage.setItem('anku_user', JSON.stringify(res.user))
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            return true
          }
          set({ isLoading: false, error: 'Profil introuvable' })
          return false
        } catch (err: any) {
          localStorage.removeItem('anku_token')
          localStorage.removeItem('anku_user')
          const message =
            err.response?.data?.message ||
            'Impossible de récupérer votre profil'
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          })
          return false
        }
      },

      // ------------------------------------------------------
      // REGISTER
      // ------------------------------------------------------
      register: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          await authApi.register(payload)
          set({ isLoading: false })
          return true
        } catch (err: any) {
          const message =
            err.response?.data?.message ||
            err.response?.data?.errors?.[0] ||
            "Erreur lors de l'inscription"
          set({ error: message, isLoading: false })
          return false
        }
      },

      // ------------------------------------------------------
      // 2FA VALIDATION
      // ------------------------------------------------------
      validate2FA: async (code) => {
        const { tempToken } = get()
        if (!tempToken) {
          set({ error: 'Session 2FA invalide' })
          return false
        }
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.validate2FA(tempToken, code)
          if (res.token && res.user) {
            localStorage.setItem('anku_token', res.token)
            localStorage.setItem('anku_user', JSON.stringify(res.user))
            set({
              user: res.user,
              token: res.token,
              isAuthenticated: true,
              isLoading: false,
              requires2FA: false,
              tempToken: null,
              error: null,
            })
            return true
          }
          set({ isLoading: false, error: 'Code 2FA invalide' })
          return false
        } catch (err: any) {
          const message = err.response?.data?.message || 'Code 2FA invalide'
          set({ error: message, isLoading: false })
          return false
        }
      },

      // ------------------------------------------------------
      // LOGOUT
      // ------------------------------------------------------
      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // ignore
        }
        localStorage.removeItem('anku_token')
        localStorage.removeItem('anku_user')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          requires2FA: false,
          tempToken: null,
          error: null,
        })
      },

      // ------------------------------------------------------
      // FETCH ME
      // ------------------------------------------------------
      fetchMe: async () => {
        const token = get().token || localStorage.getItem('anku_token')
        if (!token) return false

        try {
          const res = await usersApi.getMe()
          if (res.user) {
            localStorage.setItem('anku_user', JSON.stringify(res.user))
            set({ user: res.user, token, isAuthenticated: true })
            return true
          }
          return false
        } catch {
          return false
        }
      },

      // ------------------------------------------------------
      // HELPERS — Blindés
      // ------------------------------------------------------

      /**
       * setUser : remplace le user complet.
       * ⚠️ Refuse d'écraser avec un objet vide/undefined.
       */
      setUser: (user, token) => {
        if (!user || Object.keys(user).length === 0) {
          console.warn('⚠️ setUser ignoré : user vide ou undefined')
          return
        }
        localStorage.setItem('anku_token', token)
        localStorage.setItem('anku_user', JSON.stringify(user))
        set({ user: user as User | UserMe, token, isAuthenticated: true })
      },

      /**
       * mergeUser : fusionne un patch partiel avec le user existant.
       * ✅ Idéal pour les réponses backend qui ne renvoient qu'un sous-ensemble
       *    de champs (ex: updateInfo renvoie seulement { id, first_name, ... }).
       */
      mergeUser: (partial) => {
        if (!partial || Object.keys(partial).length === 0) {
          console.warn('⚠️ mergeUser ignoré : partial vide')
          return
        }
        const current = get().user
        if (!current) {
          console.warn('⚠️ mergeUser ignoré : aucun user en mémoire')
          return
        }
        const merged = { ...current, ...partial }
        localStorage.setItem('anku_user', JSON.stringify(merged))
        set({ user: merged as User | UserMe })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'anku-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)