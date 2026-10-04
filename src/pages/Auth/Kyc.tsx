// ============================================================
// ANKU — Page KYC (avec redirection auto après submit)
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
import kycApi from '../../service/api/kyc.api'
import uploadsApi from '../../service/api/uploads.api'
import { useAuthStore } from '../../context/AuthContext'
import { KYC_TYPES, type KycRequest } from '../../types/user'

// ------------------------------------------------------------
// Schéma
// ------------------------------------------------------------
const kycSchema = z.object({
  type: z.enum(KYC_TYPES, {
    errorMap: () => ({ message: "Type d'activité requis" }),
  }),
  siret: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine((v) => /^\d{14}$/.test(v), 'Le SIRET doit contenir 14 chiffres'),
})

type KycFormInput = z.input<typeof kycSchema>
type KycFormOutput = z.output<typeof kycSchema>

// ------------------------------------------------------------
// Composant
// ------------------------------------------------------------
export default function Kyc() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const isLoadingAuth = !user

  const [currentRequest, setCurrentRequest] = useState<KycRequest | null>(null)
  const [documents, setDocuments] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KycFormInput, any, KycFormOutput>({
    resolver: zodResolver(kycSchema),
    defaultValues: { type: 'agriculteur' },
  })

  // ----------------------------------------------------------
  // Charger la demande existante
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return
    if (user.role !== 'professionnel') {
      navigate('/')
      return
    }

    const loadMyKyc = async () => {
      try {
        const res = await kycApi.getMyRequest()
        setCurrentRequest(res.request)
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }

    loadMyKyc()
  }, [user, navigate])

  // ----------------------------------------------------------
  // Upload un document
  // ----------------------------------------------------------
  const handleUploadDocument = async (file: File): Promise<string> => {
    const res = await uploadsApi.uploadKycDocument(file)
    return res.url
  }

  // ----------------------------------------------------------
  // Submit → REDIRECTION vers Home après succès
  // ----------------------------------------------------------
  const onSubmit = async (data: KycFormOutput) => {
    setServerError('')

    if (documents.length === 0) {
      setServerError('Ajoute au moins 1 document (KBIS, CNI, etc.)')
      return
    }

    setIsSubmitting(true)
    try {
      await kycApi.createRequest({
        type: data.type,
        siret: data.siret,
        documents: documents.map((d) => d.url),
      })

      // Rafraîchir le profil pour avoir le nouveau verification_status
      await fetchMe()

      // 🎯 Redirection immédiate vers la Home
      navigate('/', { replace: true })
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Erreur lors de la soumission'
      setServerError(msg)
      setIsSubmitting(false)
    }
  }

  // ----------------------------------------------------------
  // Annulation
  // ----------------------------------------------------------
  const handleCancel = async () => {
    if (!currentRequest) return
    if (!window.confirm('Annuler ta demande KYC en cours ?')) return
    try {
      await kycApi.cancelMyRequest()
      setCurrentRequest(null)
      await fetchMe()
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Erreur annulation')
    }
  }

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------
  if (isLoadingAuth || isLoading) {
    return (
      <AuthLayout title="Chargement...">
        <div className="flex justify-center py-6">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  // ----------------------------------------------------------
  // Vue : demande existante (pending / approved / rejected)
  // ----------------------------------------------------------
  if (currentRequest) {
    const statusConfig = {
      pending: {
        color: 'text-yellow-200',
        bg: 'bg-yellow-500/20 border-yellow-400/40',
        icon: '⏳',
        title: 'Demande en cours de vérification',
        desc: 'Notre équipe examine ton dossier. Ça prend en général 24-48h.',
      },
      approved: {
        color: 'text-emerald-200',
        bg: 'bg-emerald-500/20 border-emerald-400/40',
        icon: '✅',
        title: 'Compte vérifié !',
        desc: 'Ton statut professionnel est validé. Tu as accès à toutes les fonctionnalités pro.',
      },
      rejected: {
        color: 'text-red-200',
        bg: 'bg-red-500/20 border-red-400/40',
        icon: '❌',
        title: 'Demande refusée',
        desc: currentRequest.rejection_reason || 'Aucune raison fournie.',
      },
    }[currentRequest.status]

    return (
      <AuthLayout title="Vérification Pro" subtitle="Statut de ta demande KYC">
        <div className={`p-4 rounded-2xl border ${statusConfig.bg} text-center`}>
          <div className="text-3xl mb-2">{statusConfig.icon}</div>
          <h3
            className={`font-bold text-sm mb-1 ${statusConfig.color}`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {statusConfig.title}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {statusConfig.desc}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/20 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Type</span>
            <span
              className="font-semibold capitalize"
              style={{ color: '#ffffff' }}
            >
              {currentRequest.type}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>SIRET</span>
            <span
              className="font-mono text-[11px]"
              style={{ color: '#ffffff' }}
            >
              {currentRequest.siret}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>
              SIRET vérifié
            </span>
            <span
              className={
                currentRequest.siret_verified ? 'text-emerald-300' : 'text-red-300'
              }
            >
              {currentRequest.siret_verified ? 'Oui ✓' : 'Non'}
            </span>
          </div>
        </div>

        {currentRequest.status === 'pending' && (
          <Button variant="ghost" fullWidth onClick={handleCancel}>
            Annuler ma demande
          </Button>
        )}

        {currentRequest.status === 'rejected' && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => setCurrentRequest(null)}
          >
            Soumettre une nouvelle demande
          </Button>
        )}

        <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </AuthLayout>
    )
  }

  // ----------------------------------------------------------
  // Formulaire KYC
  // ----------------------------------------------------------
  return (
    <AuthLayout
      title="Vérification Pro"
      subtitle="Soumets ton SIRET et tes documents pour valider ton statut professionnel"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {serverError && (
          <div className="p-2.5 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-xs text-center">
            {serverError}
          </div>
        )}

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
          onUpload={handleUploadDocument}
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
          Soumettre ma demande
        </Button>

        <p
          className="text-[11px] text-center leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          Ton SIRET est vérifié automatiquement via l'API Sirene du gouvernement.
        </p>
      </form>
    </AuthLayout>
  )
}
