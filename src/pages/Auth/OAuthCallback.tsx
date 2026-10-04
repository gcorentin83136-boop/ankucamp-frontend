import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../context/AuthContext'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const loginWithToken = useAuthStore((s) => s.loginWithToken)

  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Token OAuth manquant.')
      return
    }

    const handleCallback = async () => {
      const ok = await loginWithToken(token)

      if (ok) {
        // Nettoyer l'URL (retirer ?token=xxx) puis rediriger
        window.history.replaceState({}, '', '/')
        navigate('/', { replace: true })
      } else {
        setStatus('error')
        setErrorMsg(
          useAuthStore.getState().error ||
            'Impossible de récupérer votre profil.'
        )
      }
    }

    handleCallback()
  }, [token, loginWithToken, navigate])

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (status === 'loading') {
    return (
      <AuthLayout title="Connexion en cours..." subtitle="Récupération de ton compte">
        <div className="flex justify-center py-6">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  // ------------------------------------------------------------
  // Erreur
  // ------------------------------------------------------------
  return (
    <AuthLayout title="Connexion échouée" subtitle={errorMsg}>
      <div className="space-y-4">
        <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
          Réessayer
        </Button>
        <div className="text-center">
          <Link
            to="/login"
            className="text-xs text-white/70 hover:text-white transition"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}