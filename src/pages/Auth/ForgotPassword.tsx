import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import authApi from '../../service/api/auth.api'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setIsLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSuccess(true)
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || 'Erreur lors de la demande'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Email envoyé !"
        subtitle="Si cette adresse existe, tu recevras un lien de réinitialisation."
      >
        <div className="space-y-5 text-center">
          <p
            className="text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Vérifie ta boîte mail (et tes spams). Le lien est valable{' '}
            <strong style={{ color: '#6ee7b7' }}>1 heure</strong>.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-base font-bold text-white hover:text-emerald-300 transition"
          >
            <ArrowLeft size={18} />
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      subtitle="Saisis ton email pour recevoir un lien de réinitialisation"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-sm text-center">
            {serverError}
          </div>
        )}

        <Input
          type="email"
          placeholder="Adresse e-mail"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={errors.email?.message}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
          Envoyer le lien
        </Button>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-base font-semibold text-white/85 hover:text-white transition"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
