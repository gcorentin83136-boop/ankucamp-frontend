// ============================================================
// ANKU — Devenir Pro
// Convertit un particulier en professionnel
// (particulièrement utile après OAuth Google)
// ============================================================

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import FileUploader, { type UploadedFile } from '../../components/ui/FileUploader'
import usersApi from '../../service/api/users.api'
import uploadsApi from '../../service/api/uploads.api'
import { useAuthStore } from '../../context/AuthContext'
import { KYC_TYPES } from '../../types/user'

const schema = z.object({
  type: z.enum(KYC_TYPES, {
    message: "Type d'activité requis",
  }),
  siret: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine((v) => /^\d{14}$/.test(v), 'Le SIRET doit contenir 14 chiffres'),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

export default function BecomePro() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const [documents, setDocuments] = useState<UploadedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Rediriger si déjà pro
  useEffect(() => {
    if (user?.role === 'professionnel') {
      navigate('/kyc', { replace: true })
    }
  }, [user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'agriculteur' },
  })

  const handleUpload = async (file: File): Promise<string> => {
    const res = await uploadsApi.uploadKycDocument(file)
    return res.url
  }

  const onSubmit = async (data: FormOutput) => {
    setServerError('')

    if (documents.length === 0) {
      setServerError('Ajoute au moins 1 document (KBIS, CNI, etc.)')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await usersApi.becomePro({
        type: data.type,
        siret: data.siret,
        documents: documents.map((d) => d.url),
      })

      // ✅ 1. Sauvegarder le NOUVEAU token (role: professionnel)
      if (res.token) {
        localStorage.setItem('anku_token', res.token)
        useAuthStore.setState({ token: res.token })
      }

      // ✅ 2. Rafraîchir le profil avec le nouveau token
      await fetchMe()

      // ✅ 3. Rediriger vers la page KYC
      navigate('/kyc', { replace: true })
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Erreur lors de la conversion'
      setServerError(msg)
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Devenir Professionnel"
      subtitle="Convertistoi en compte Pro et rejoins les producteurs locaux sur ANKU"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {serverError && (
          <div className="p-2.5 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-xs text-center">
            {serverError}
          </div>
        )}

        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-100 text-xs">
          <strong className="block mb-1">✨ Avantages Pro</strong>
          Crée ta boutique, vends tes produits, organise des événements,
          publie des articles, et bien plus.
        </div>

        <Select
          label="Type d'activité"
          options={[
            { value: 'agriculteur', label: '🌾 Agriculteur' },
            { value: 'artisan', label: '🔨 Artisan' },
            { value: 'createur', label: '🎨 Créateur' },
            { value: 'autre', label: '📦 Autre' },
          ]}
          {...register('type')}
          error={errors.type?.message}
        />

        <Input
          placeholder="SIRET (14 chiffres)"
          inputMode="numeric"
          maxLength={17}
          {...register('siret')}
          error={errors.siret?.message}
        />

        <FileUploader
          label="Documents justificatifs"
          hint="KBIS, extrait Sirene, CNI du gérant… (PDF ou image)"
          onUpload={handleUpload}
          files={documents}
          onChange={setDocuments}
          maxFiles={5}
          maxSizeMB={10}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
        >
          Devenir Pro
        </Button>

        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => navigate('/')}
        >
          Annuler
        </Button>

        <p
          className="text-[11px] text-center leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          Ton SIRET est vérifié automatiquement via l'API Sirene du gouvernement.
          Une fois validé, tu auras accès à toutes les fonctionnalités Pro.
        </p>
      </form>
    </AuthLayout>
  )
}
