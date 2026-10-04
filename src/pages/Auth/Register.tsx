// ============================================================
// ANKU — Inscription (responsive mobile-first)
// ============================================================

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, Shield, AlertCircle, ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../context/AuthContext'
import { authApi } from '../../service/api/auth.api'

const registerSchema = z
  .object({
    first_name: z.string().min(2, 'Prénom trop court').max(100),
    last_name: z.string().min(2, 'Nom trop court').max(100),
    email: z.string().email('Email invalide'),
    birth_year: z.coerce
      .number()
      .int()
      .min(1900, 'Année invalide')
      .max(new Date().getFullYear() - 13, '13 ans min'),
    address: z.string().min(5, 'Adresse trop courte').max(255),
    city: z.string().min(2, 'Ville requise').max(100),
    postal_code: z.string().min(3, 'Code postal requis').max(20),
    country: z.string().min(2).default('France'),
    password: z
      .string()
      .min(8, 'Min 8 caractères')
      .regex(/[A-Z]/, 'Majuscule requise')
      .regex(/[a-z]/, 'Minuscule requise')
      .regex(/[0-9]/, 'Chiffre requis'),
    confirm_password: z.string(),
    role: z.enum(['particulier', 'professionnel']),
    accept_terms: z.boolean().refine((val) => val === true, {
      message: 'Accepte les CGU pour continuer',
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Ne correspondent pas',
    path: ['confirm_password'],
  })

type RegisterFormInput = z.input<typeof registerSchema>
type RegisterFormOutput = z.output<typeof registerSchema>

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score: 1, label: 'Faible', color: '#ef4444' }
  if (score <= 4) return { score: 2, label: 'Moyen', color: '#f59e0b' }
  if (score <= 5) return { score: 3, label: 'Bon', color: '#10b981' }
  return { score: 4, label: 'Excellent', color: '#059669' }
}

export default function Register() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [registeredRole, setRegisteredRole] = useState<
    'particulier' | 'professionnel'
  >('particulier')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, any, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: 'France', role: 'particulier', accept_terms: false },
  })

  const selectedRole = watch('role')
  const passwordValue = watch('password') || ''
  const strength = useMemo(
    () => getPasswordStrength(passwordValue),
    [passwordValue]
  )

  const handleRoleChange = (role: 'particulier' | 'professionnel') => {
    setValue('role', role, { shouldValidate: true })
  }

  const handleGoogleLogin = () => {
    window.location.href = authApi.googleOAuthUrl()
  }

  const onSubmit = async (data: RegisterFormOutput) => {
    setServerError('')
    const { confirm_password, accept_terms, ...payload } = data
    const ok = await registerUser(payload)
    if (ok) {
      setRegisteredRole(data.role)
      setSuccess(true)
    } else {
      setServerError(
        useAuthStore.getState().error || "Erreur lors de l'inscription"
      )
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Compte créé !"
        subtitle="Vérifie ta boîte mail pour activer ton compte ANKU."
        noLogo
      >
        <div className="space-y-4 text-center text-white/95 text-sm">
          <p>
            Nous t'avons envoyé un email de confirmation. Clique sur le lien
            qu'il contient pour activer ton compte.
          </p>

          {registeredRole === 'professionnel' && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs text-left">
              <strong className="block mb-1">🧾 Prochaine étape : KYC</strong>
              Une fois ton compte activé, tu devras soumettre ton SIRET et tes
              documents.
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Aller à la connexion
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Créer un compte ANKU" wide noLogo>
      {/* Bouton retour */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Retour à l'accueil
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4 md:gap-6">
        {/* ============================================
            COLONNE GAUCHE : Formulaire
            ============================================ */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-2.5 sm:space-y-3"
        >
          {serverError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/20 border border-red-400/40 rounded-lg text-red-100 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              {serverError}
            </div>
          )}

          {/* Sélecteur rôle compact */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleChange('particulier')}
              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border-2 transition-all ${
                selectedRole === 'particulier'
                  ? 'border-emerald-400/90 bg-emerald-500/25'
                  : 'border-white/20 bg-black/30 hover:border-white/40'
              }`}
            >
              <span className="text-base sm:text-xl">👤</span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[11px] sm:text-sm font-bold truncate"
                    style={{ color: '#ffffff' }}
                  >
                    Particulier
                  </span>
                  {selectedRole === 'particulier' && (
                    <CheckCircle
                      size={12}
                      className="text-emerald-400 shrink-0"
                    />
                  )}
                </div>
                <p
                  className="text-[9px] sm:text-[11px] truncate"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  J'achète
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('professionnel')}
              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border-2 transition-all ${
                selectedRole === 'professionnel'
                  ? 'border-emerald-400/90 bg-emerald-500/25'
                  : 'border-white/20 bg-black/30 hover:border-white/40'
              }`}
            >
              <span className="text-base sm:text-xl">🏢</span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[11px] sm:text-sm font-bold truncate"
                    style={{ color: '#ffffff' }}
                  >
                    Pro
                  </span>
                  {selectedRole === 'professionnel' && (
                    <CheckCircle
                      size={12}
                      className="text-emerald-400 shrink-0"
                    />
                  )}
                </div>
                <p
                  className="text-[9px] sm:text-[11px] truncate"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Je vends
                </p>
              </div>
            </button>
          </div>

          <input type="hidden" {...register('role')} />

          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <Input
              placeholder="Prénom"
              {...register('first_name')}
              error={errors.first_name?.message}
            />
            <Input
              placeholder="Nom"
              {...register('last_name')}
              error={errors.last_name?.message}
            />
          </div>

          {/* Email + Année */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              type="number"
              placeholder="Année naiss."
              {...register('birth_year')}
              error={errors.birth_year?.message}
            />
          </div>

          {/* Adresse */}
          <Input
            placeholder="Adresse"
            autoComplete="street-address"
            {...register('address')}
            error={errors.address?.message}
          />

          {/* Ville + CP */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <Input
              placeholder="Ville"
              autoComplete="address-level2"
              {...register('city')}
              error={errors.city?.message}
            />
            <Input
              placeholder="Code postal"
              autoComplete="postal-code"
              {...register('postal_code')}
              error={errors.postal_code?.message}
            />
          </div>

          {/* Password avec œil */}
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              autoComplete="new-password"
              {...register('password')}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 sm:right-4 top-[14px] sm:top-[18px] text-gray-500 hover:text-gray-800 transition"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>

          {/* Force MDP */}
          {passwordValue && (
            <div className="px-1 -mt-1">
              <div className="flex gap-1 mb-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 sm:h-1.5 flex-1 rounded-full transition-all"
                    style={{
                      background:
                        i <= strength.score
                          ? strength.color
                          : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
              <p
                className="text-[10px] sm:text-[11px] font-semibold"
                style={{ color: strength.color }}
              >
                Force : {strength.label}
              </p>
            </div>
          )}

          {/* Confirm password */}
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirmer mot de passe"
            autoComplete="new-password"
            {...register('confirm_password')}
            error={errors.confirm_password?.message}
          />

          {/* CGU */}
          <label className="flex items-start gap-2 p-1.5 sm:p-2 rounded-lg bg-black/30 border border-white/15 cursor-pointer hover:bg-black/40 transition">
            <input
              type="checkbox"
              {...register('accept_terms')}
              className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 accent-emerald-500 cursor-pointer shrink-0"
            />
            <span
              className="text-[10px] sm:text-[12px] leading-snug"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              J'accepte les{' '}
              <Link
                to="/legal/cgu"
                target="_blank"
                className="text-emerald-300 hover:underline font-semibold"
              >
                CGU
              </Link>{' '}
              et la{' '}
              <Link
                to="/legal/cookies"
                target="_blank"
                className="text-emerald-300 hover:underline font-semibold"
              >
                politique cookies
              </Link>
            </span>
          </label>
          {errors.accept_terms && (
            <p
              className="text-[10px] sm:text-[12px] ml-1 -mt-1"
              style={{ color: '#fca5a5' }}
            >
              {errors.accept_terms.message}
            </p>
          )}

          {/* Info pro */}
          {selectedRole === 'professionnel' && (
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-100 text-[10px] sm:text-[11px] flex items-start gap-1.5">
              <Shield size={11} className="shrink-0 mt-0.5" />
              <span>Prochaine étape : SIRET + documents.</span>
            </div>
          )}

          {/* Bouton */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading || isSubmitting}
          >
            S'inscrire
          </Button>
        </form>

        {/* ============================================
            COLONNE DROITE : Social
            ============================================ */}
        <div className="flex flex-col md:border-l md:border-white/15 md:pl-5">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-2 sm:mb-3 text-center md:text-left"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Ou en 1 clic avec
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4
                       bg-white text-gray-800 font-semibold text-sm sm:text-base rounded-full
                       hover:bg-gray-100 transition shadow-md mb-2 sm:mb-2.5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className="sm:w-5 sm:h-5"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          {/* Facebook */}
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4
                       bg-white/10 text-white/50 font-semibold text-sm sm:text-base rounded-full
                       border border-white/20 cursor-not-allowed"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="#ffffff80"
              className="sm:w-5 sm:h-5"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>

          <p
            className="text-[10px] sm:text-[11px] text-center mt-1.5"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            (bientôt disponible)
          </p>

          {/* Séparateur + info */}
          <div className="flex-1 flex items-end justify-center pb-2 sm:pb-3 mt-3 sm:mt-4">
            <div className="w-full text-center">
              <div className="w-full h-px bg-white/15 mb-2 sm:mb-3" />
              <p
                className="text-[10px] sm:text-xs leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                🔒 Tes données sont sécurisées
              </p>
            </div>
          </div>

          {/* Lien login */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-bold text-white hover:text-emerald-300 hover:underline transition"
            >
              Déjà un compte ?{' '}
              <span className="text-emerald-400">Se connecter →</span>
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

