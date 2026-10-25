/* eslint-disable */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CreditCard,
  Building2,
  Percent,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Loader,
  Plus,
  ArrowRight,
  Unlink,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import paymentsApi from '../../service/api/payments.api'
import type { PaymentMethodInfo } from '../../service/api/payments.api'
import AddCardModal from '../../components/buyer/AddCardModal'
import type { ConnectStatusResponse } from '../../service/api/payments.api'
import { useAuthStore } from '../../context/AuthContext'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

// ============================================================
// HELPERS
// ============================================================
function statusConfig(s: ConnectStatusResponse | null) {
  if (!s) {
    return {
      tone: 'gray' as const,
      label: 'Chargementâ€¦',
      desc: '',
    }
  }
  if (s.status === 'active' && s.charges_enabled) {
    return {
      tone: 'green' as const,
      label: 'Compte actif',
      desc: 'Tu peux recevoir des paiements',
    }
  }
  if (s.has_account || s.status === 'pending' || s.status === 'pending_verification') {
    return {
      tone: 'orange' as const,
      label: 'Onboarding en cours',
      desc: 'Termine ton inscription Stripe pour recevoir des paiements',
    }
  }
  return {
    tone: 'red' as const,
    label: 'Non connectÃ©',
    desc: 'Relie ton compte Stripe pour vendre sur ANKU',
  }
}

const TONE_STYLES: Record<
  'green' | 'orange' | 'red' | 'gray',
  { bg: string; fg: string; border: string; Icon: typeof CheckCircle2 }
> = {
  green: {
    bg: '#ecfdf5',
    fg: '#059669',
    border: '#a7f3d0',
    Icon: CheckCircle2,
  },
  orange: {
    bg: '#fffbeb',
    fg: '#d97706',
    border: '#fde68a',
    Icon: AlertCircle,
  },
  red: {
    bg: '#fef2f2',
    fg: '#dc2626',
    border: '#fecaca',
    Icon: XCircle,
  },
  gray: {
    bg: '#f9fafb',
    fg: '#6b7280',
    border: '#e5e7eb',
    Icon: AlertCircle,
  },
}

// ============================================================
// PAGE
// ============================================================
export default function PaymentSettings() {
  const auth = useAuthStore()
  const user = (auth as any)?.user
  const isPro = user?.role === 'professionnel'

  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [cards, setCards] = useState<PaymentMethodInfo[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectStatusResponse | null>(null)

  const loadStatus = async () => {
    try {
      const res = await paymentsApi.connectStatus()
      setStatus(res)
    } catch {
      // 404 si jamais le user n'a pas de compte â†’ on met un faux status "not_connected"
      setStatus({
        success: false,
        status: 'not_connected',
        has_account: false,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isPro) {
      setLoading(false)
      loadCards()
      return
    }
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  // DÃ©tection du retour Stripe : ?stripe=return | ?stripe=refresh
  useEffect(() => {
    const flag = searchParams.get('stripe')
    if (!flag) return

    if (flag === 'return') {
      toast.success(
        <div className="flex items-start gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Inscription Stripe terminÃ©e âœ…</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Ton compte est en cours de validation. Ã‡a peut prendre quelques minutes.
            </p>
          </div>
        </div>,
        { duration: 6000 }
      )
      loadStatus()
    } else if (flag === 'refresh') {
      toast.error(
        "Ton inscription Stripe n'a pas Ã©tÃ© terminÃ©e. Clique sur Â« Continuer l'inscription Â» pour reprendre."
      )
    }

    // Nettoie l'URL
    searchParams.delete('stripe')
    setSearchParams(searchParams, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await paymentsApi.connectOnboard()
      toast.success('Redirection vers Stripeâ€¦')
      window.location.href = res.onboarding_url
    } catch {
      toast.error(
        err?.response?.data?.message ||
          'Impossible de crÃ©er le lien Stripe Connect'
      )
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await paymentsApi.disconnectStripe()
      toast.success('Compte Stripe dÃ©connectÃ© âœ…')
      setShowDisconnectConfirm(false)
      await loadStatus()
    } catch {
      toast.error(
        err?.response?.data?.message || 'Erreur lors de la dÃ©connexion'
      )
    } finally {
      setDisconnecting(false)
    }
  }

  const loadCards = async () => {
    setCardsLoading(true)
    try {
      const res = await paymentsApi.listPaymentMethods()
      setCards(res.payment_methods)
    } catch {
      toast.error(
        err?.response?.data?.message || 'Impossible de charger les cartes'
      )
    } finally {
      setCardsLoading(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Supprimer cette carte ?')) return
    setDeletingCardId(id)
    try {
      await paymentsApi.deletePaymentMethod(id)
      toast.success('Carte supprimÃ©e âœ…')
      setCards((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeletingCardId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  const cfg = statusConfig(status)
  const tone = TONE_STYLES[cfg.tone]
  const ToneIcon = tone.Icon
  const hasAccount = !!(status && status.status !== 'not_connected')
  const isActive = cfg.tone === 'green'
  const isPending = cfg.tone === 'orange'

  return (
    <div className="space-y-4">
      {/* ---------- Section Stripe Connect (pro uniquement) ---------- */}
      {isPro && (
        <SettingsSection
          title="Compte Stripe Connect"
          description="NÃ©cessaire pour recevoir les paiements de tes clients"
          icon={<Building2 size={18} />}
        >
          {/* Bloc statut */}
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: tone.fg }}
            >
              <ToneIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: tone.fg }}>
                {cfg.label}
              </p>
              {cfg.desc && (
                <p className="text-xs text-gray-600 mt-0.5">{cfg.desc}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {isActive && (
            <a
              href="https://dashboard.stripe.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-sm hover:shadow-md"
              style={{ background: ANKU.green }}
            >
              Ouvrir mon dashboard Stripe <ExternalLink size={14} />
            </a>
          )}

          {isActive && (
            <button
              type="button"
              onClick={() => setShowDisconnectConfirm(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition ml-2"
            >
              <Unlink size={12} /> DÃ©connecter Stripe
            </button>
          )}

          {isPending && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-sm hover:shadow-md disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {connecting ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Redirectionâ€¦
                </>
              ) : (
                <>
                  Continuer l&apos;inscription <ArrowRight size={14} />
                </>
              )}
            </button>
          )}

          {!isActive && !isPending && !hasAccount && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-sm hover:shadow-md disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {connecting ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Redirectionâ€¦
                </>
              ) : (
                <>
                  Relier mon compte Stripe <ArrowRight size={14} />
                </>
              )}
            </button>
          )}

          <p className="text-[11px] text-gray-500 mt-1">
            Stripe est notre partenaire de paiement sÃ©curisÃ©. Tes donnÃ©es bancaires
            ne transitent jamais par ANKU.
          </p>
        </SettingsSection>
      )}

      {/* ---------- Section Cartes bancaires (buyer) ---------- */}
      {(
        <SettingsSection
          title="Mes cartes bancaires"
          description="GÃ¨re tes moyens de paiement enregistrÃ©s"
          icon={<CreditCard size={18} />}
        >
            {/* Loader cartes */}
            {cardsLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader size={20} className="animate-spin text-gray-400" />
              </div>
            )}

            {/* Aucune carte */}
            {!cardsLoading && cards.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
                >
                  <CreditCard size={24} />
                </div>
                <p className="text-sm font-bold text-gray-800">
                  Aucune carte enregistrÃ©e
                </p>
                <p className="text-xs text-gray-500 max-w-sm">
                  Enregistre une carte pour payer plus vite lors de tes prochains achats.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-sm hover:shadow-md"
                  style={{ background: ANKU.green }}
                >
                  <Plus size={14} /> Ajouter une carte
                </button>
              </div>
            )}

            {/* Liste des cartes */}
            {!cardsLoading && cards.length > 0 && (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                  >
                    <div
                      className="w-12 h-8 rounded-md flex items-center justify-center text-white font-bold text-[10px] uppercase tracking-wide shrink-0"
                      style={{
                        background:
                          card.brand === 'visa'
                            ? '#1a1f71'
                            : card.brand === 'mastercard'
                            ? '#eb001b'
                            : card.brand === 'amex'
                            ? '#2e77bc'
                            : '#6b7280',
                      }}
                    >
                      {card.brand === 'mastercard' ? 'MC' : card.brand}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ {card.last4}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Expire {String(card.exp_month).padStart(2, '0')}/
                        {String(card.exp_year).slice(-2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={deletingCardId === card.id}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      title="Supprimer cette carte"
                    >
                      {deletingCardId === card.id ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setShowAddCardModal(true)}
                  className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/30 transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Ajouter une autre carte
                </button>
              </div>
            )}
        </SettingsSection>
      )}

      {/* ---------- Section Commissions ---------- */}
      <SettingsSection
        title="Commissions ANKU"
        description="Frais de service prÃ©levÃ©s sur les transactions"
        icon={<Percent size={18} />}
      >
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: ANKU.greenPale, border: `1px solid ${ANKU.green}33` }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: ANKU.green }}
          >
            <Percent size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">
              2,5 % par transaction
            </p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {isPro
                ? 'ANKU prÃ©lÃ¨ve 2,5 % du montant TTC sur chaque vente. Le reste est automatiquement versÃ© sur ton compte Stripe.'
                : "Aucune commission n'est prÃ©levÃ©e sur les achats. Tu paies uniquement le prix affichÃ© + les frais de livraison Ã©ventuels."}
            </p>
          </div>
        </div>

        {isPro && (
          <Link
            to="/dashboard/shop/invoices"
            className="text-xs font-bold inline-flex items-center gap-1 hover:underline"
            style={{ color: ANKU.greenDark }}
          >
            Voir mes factures ANKU <ArrowRight size={12} />
          </Link>
        )}
      </SettingsSection>
      {/* Modal confirmation dÃ©connexion Stripe */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <header
              className="px-5 py-4 border-b flex items-start gap-3"
              style={{ borderColor: '#fee2e2', background: '#fef2f2' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900">
                  DÃ©connecter ton compte Stripe ?
                </h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Cette action peut Ãªtre annulÃ©e Ã  tout moment.
                </p>
              </div>
            </header>

            <div className="p-5 space-y-3 text-sm text-gray-700">
              <p>
                Tu ne pourras plus recevoir de paiements tant que tu n'auras
                pas reliÃ© un nouveau compte Stripe.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                âš ï¸  Les commandes en cours et les remboursements Ã©ventuels
                continueront d'Ãªtre traitÃ©s par Stripe normalement.
                Tu pourras te reconnecter Ã  tout moment.
              </p>
            </div>

            <footer
              className="px-5 py-4 border-t flex justify-end gap-2"
              style={{ borderColor: '#f3f4f6' }}
            >
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(false)}
                disabled={disconnecting}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: '#dc2626' }}
              >
                {disconnecting ? (
                  <>
                    <Loader size={14} className="animate-spin" /> DÃ©connexionâ€¦
                  </>
                ) : (
                  <>
                    <Unlink size={14} /> DÃ©connecter
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal ajout carte */}
      <AddCardModal
        open={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSuccess={loadCards}
      />
    </div>
  )
}


