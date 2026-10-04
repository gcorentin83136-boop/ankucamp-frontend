import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import authApi from '../../service/api/auth.api'

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) {
      setServerError('Lien invalide. Demande un nouveau lien.')
    }
  }, [token])

  const onSubmit = async (data: FormData) => {
    if (!token) return

    setServerError('')
    setIsLoading(true)
    try {
      await authApi.resetPassword(token, data.new_password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      setServerError(
        err.response?.data?.message ||
          'Lien invalide ou expiré. Demande un nouveau lien.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Mot de passe réinitialisé !"
        subtitle="Tu peux maintenant te connecter avec ton nouveau mot de passe."
      >
        <div className="text-center space-y-5">
          <p
            className="text-base"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Redirection vers la connexion...
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-base font-bold text-white hover:text-emerald-300 transition"
          >
            Aller à la connexion →
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (!token) {
    return (
      <AuthLayout title="Lien invalide">
        <div className="text-center space-y-5">
          <p
            className="text-base"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Ce lien de réinitialisation est invalide ou expiré.
          </p>
          <Link
            to="/auth/forgot-password"
            className="inline-flex items-center gap-2 text-base font-bold text-white hover:text-emerald-300 transition"
          >
            Demander un nouveau lien →
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe sécurisé"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-sm text-center">
            {serverError}
          </div>
        )}

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nouveau mot de passe"
            autoComplete="new-password"
            autoFocus
            {...register('new_password')}
            error={errors.new_password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-[22px] text-gray-500 hover:text-gray-800 transition"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirmer le mot de passe"
            autoComplete="new-password"
            {...register('confirm_password')}
            error={errors.confirm_password?.message}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-5 top-[22px] text-gray-500 hover:text-gray-800 transition"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
          Réinitialiser
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
