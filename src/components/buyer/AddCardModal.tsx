import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'
import { CreditCard, X, Loader, CheckCircle2 } from 'lucide-react'
import paymentsApi from '../../service/api/payments.api'
import { useAuthStore } from '../../context/AuthContext'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
}

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
)

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': { color: '#9ca3af' },
      padding: '14px 16px',
    },
    invalid: {
      color: '#dc2626',
    },
  },
  hidePostalCode: true,
}

// ─────────────────────────────────────────────────────────
// Formulaire interne (dans le provider Elements)
// ─────────────────────────────────────────────────────────
function AddCardForm({
  clientSecret,
  onSuccess,
  onClose,
}: {
  clientSecret: string
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const auth = useAuthStore()
  const user = (auth as any)?.user
  const [submitting, setSubmitting] = useState(false)
  const [cardName, setCardName] = useState('')

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setSubmitting(true)
    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardName.trim() || undefined,
            },
          },
        }
      )

      if (error) {
        toast.error(error.message ?? 'Erreur lors de la vérification de la carte')
        return
      }

      if (setupIntent?.status === 'succeeded') {
        // 🆕 Marque la carte comme "allow_redisplay: always"
        // ET y attache les informations de facturation pour que
        // Stripe Checkout puisse la pré-remplir.
        if (setupIntent.payment_method) {
          try {
            await paymentsApi.updatePaymentMethod(
              setupIntent.payment_method as string,
              {
                name: cardName.trim() || undefined,
                email: user?.email || undefined,
                address: {
                  line1: '1 rue de Test', // Adresse de test
                  city: 'Paris',
                  postal_code: '75001',
                  country: 'FR',
                },
              }
            )
          } catch (err) {
            console.warn('Impossible de mettre à jour les infos de facturation', err)
            // pas bloquant
          }
        }
        toast.success('Carte enregistrée ✅')
        onSuccess()
        onClose()
      } else {
        toast.error('La carte n’a pas pu être validée')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Nom sur la carte
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Ex : Damien Dupont"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Numéro de carte <span className="text-red-500">*</span>
          </label>
          <div
            className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
            style={{ padding: '2px' }}
          >
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            🔒 Tes données bancaires ne transitent jamais par ANKU
          </p>
        </div>
      </div>

      <footer
        className="px-5 py-4 border-t flex justify-end gap-2"
        style={{ borderColor: '#f3f4f6' }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !stripe}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
          style={{ background: ANKU.green }}
        >
          {submitting ? (
            <>
              <Loader size={14} className="animate-spin" /> Enregistrement…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} /> Enregistrer la carte
            </>
          )}
        </button>
      </footer>
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Modal global
// ─────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddCardModal({ open, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charge le SetupIntent à chaque ouverture du modal
  useEffect(() => {
    if (!open) {
      // Reset complet à la fermeture
      setClientSecret(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setClientSecret(null)

    paymentsApi
      .createSetupIntent()
      .then((r) => {
        if (!cancelled) setClientSecret(r.client_secret)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'Impossible de préparer l’ajout de carte'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  const modal = (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header
          className="px-5 py-4 border-b flex items-start gap-3"
          style={{ borderColor: '#f3f4f6', background: '#f0f9e8' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#f0f9e8', color: ANKU.greenDark }}
          >
            <CreditCard size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900">
              Ajouter une carte
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pour payer plus vite la prochaine fois
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        {loading && (
          <div className="p-10 text-center">
            <Loader size={24} className="animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Préparation sécurisée…</p>
          </div>
        )}

        {error && (
          <div className="p-5">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          </div>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise}>
            <AddCardForm
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}