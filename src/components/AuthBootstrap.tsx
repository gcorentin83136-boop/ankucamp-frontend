import { useEffect, useState } from 'react'
import { useAuthStore } from '../context/AuthContext'
import usersApi from '../service/api/users.api'

interface AuthBootstrapProps {
  children: React.ReactNode
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { isAuthenticated, token, logout, setUser } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const verify = async () => {
      if (!isAuthenticated || !token) {
        setIsReady(true)
        return
      }

      try {
        const res = await usersApi.getMe()
        if (res.user) {
          localStorage.setItem('anku_user', JSON.stringify(res.user))
          setUser(res.user, token)
        }
        setIsReady(true)
      } catch (err: any) {
        const status = err.response?.status

        // 401 = token invalide/expiré
        // 404 = user supprimé de la base
        if (status === 401 || status === 404) {
          console.warn(`🔒 Session invalide (${status}), déconnexion auto`)
          await logout()
        }
        setIsReady(true)
      }
    }

    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isReady) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-white/60 text-xs">Vérification de ta session…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
