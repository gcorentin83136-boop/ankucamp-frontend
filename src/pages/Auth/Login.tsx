import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import SocialLogin from '../../components/auth/SocialLogin'
import { useAuthStore } from '../../context/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const twoFASchema = z.object({
  code: z.string().min(6, 'Code à 6 chiffres').max(6, 'Code à 6 chiffres'),
})

type LoginForm = z.infer<typeof loginSchema>
type TwoFAForm = z.infer<typeof twoFASchema>

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const validate2FA = useAuthStore((s) => s.validate2FA)
  const isLoading = useAuthStore((s) => s.isLoading)
  const requires2FA = useAuthStore((s) => s.requires2FA)
  const [serverError, setServerError] = useState('')
  const [oauthError, setOauthError] = useState('')

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'oauth_failed') {
      setOauthError('La connexion Google a échoué. Réessaie.')
    } else if (error === 'no_user') {
      setOauthError('Aucun compte trouvé avec ce compte Google.')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
  } = useForm<TwoFAForm>({
    resolver: zodResolver(twoFASchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    setOauthError('')
    const result = await login(data)

    if (result.success && result.requires2FA) {
      return
    }

    if (result.success) {
      navigate('/')
    } else {
      setServerError(useAuthStore.getState().error || 'Erreur de connexion')
    }
  }

  const onSubmit2FA = async (data: TwoFAForm) => {
    setServerError('')
    const ok = await validate2FA(data.code)
    if (ok) {
      navigate('/')
    } else {
      setServerError(useAuthStore.getState().error || 'Code 2FA invalide')
    }
  }

  // Vue 2FA
  if (requires2FA) {
    return (
      <AuthLayout
        title="Vérification 2FA"
        subtitle="Saisis le code à 6 chiffres"
      >
        <form onSubmit={handleSubmit2FA(onSubmit2FA)} className="space-y-3">
          {serverError && (
            <div className="p-2.5 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-xs text-center">
              {serverError}
            </div>
          )}

          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Code à 6 chiffres"
            autoFocus
            {...register2FA('code')}
            error={errors2FA.code?.message}
          />

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Valider
          </Button>

          <p className="text-xs text-center text-white/60">
            Tu peux aussi utiliser un code de secours.
          </p>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Bienvenue sur ANKU">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-3">
        {(serverError || oauthError) && (
          <div className="p-2.5 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-xs text-center">
            {serverError || oauthError}
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

        <Input
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />

        {/* Mot de passe oublié */}
        <div className="flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-[11px] sm:text-sm text-white/85 hover:text-white transition font-medium"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Bouton + lien "Pas encore inscrit ?" */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-2 sm:gap-3 pt-1">
          <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
            Se connecter
          </Button>
          <Link
            to="/register"
            className="text-xs sm:text-sm font-bold text-white hover:underline text-center whitespace-nowrap"
          >
            Pas encore inscrit ?
          </Link>
        </div>
      </form>

      <SocialLogin />
    </AuthLayout>
  )
}
