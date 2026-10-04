import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import authApi from '../../service/api/auth.api'

type Status = 'loading' | 'success' | 'error'

export default function ActivateAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage("Lien d'activation invalide (token manquant).")
      return
    }

    const activate = async () => {
      try {
        const res = await authApi.activate(token)
        setStatus('success')
        setMessage(res.message || 'Ton compte est activé !')
        setTimeout(() => navigate('/login'), 3000)
      } catch (err: any) {
        setStatus('error')
        setMessage(
          err.response?.data?.message ||
            "Lien invalide ou expiré. Réessaie de t'inscrire."
        )
      }
    }

    activate()
  }, [token, navigate])

  if (status === 'loading') {
    return (
      <AuthLayout title="Activation en cours..." subtitle="Vérification de ton lien">
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Compte activé ! 🎉" subtitle={message}>
        <div className="space-y-5 text-center">
          <p
            className="text-base"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Tu peux maintenant te connecter.
          </p>
          <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
            Aller à la connexion
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Activation impossible" subtitle={message}>
      <div className="space-y-5 text-center">
        <p
          className="text-base"
          style={{ color: 'rgba(255,255,255,0.95)' }}
        >
          Tu peux réessayer de t'inscrire ou demander un nouveau lien.
        </p>
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate('/register')}
        >
          Retour à l'inscription
        </Button>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-base font-semibold text-white/85 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  )
}
