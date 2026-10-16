import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader, Package, ArrowRight } from 'lucide-react'
import AppHeader from '../../components/layout/AppHeader'
import AnimatedCartBackground from '../../components/buyer/AnimatedCartBackground'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Attente pour laisser le webhook Stripe confirmer
    const t = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative min-h-screen">
      <AppHeader />
      <AnimatedCartBackground />

      <div className="relative max-w-2xl mx-auto py-10 px-3 sm:px-5">
        <div className="rounded-3xl p-8 text-center shadow-xl border border-white/50 bg-white/85 backdrop-blur-xl">
          {loading ? (
            <Loader
              size={40}
              className="animate-spin text-emerald-500 mx-auto mb-4"
            />
          ) : (
            <>
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: ANKU.greenPale }}
              >
                <CheckCircle2 size={44} style={{ color: ANKU.greenDark }} />
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                Paiement réussi 🎉
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Merci ! Ta commande a bien été enregistrée et le vendeur va
                être notifié.
              </p>

              {sessionId && (
                <p className="text-[10px] font-mono text-gray-400 mb-6 break-all">
                  Session : {sessionId}
                </p>
              )}

              <div className="space-y-3">
                <Link
                  to="/dashboard/user/orders"
                  className="block rounded-full py-3 text-sm font-bold text-white transition flex items-center justify-center gap-2"
                  style={{ background: ANKU.green }}
                >
                  <Package size={16} />
                  Voir mes commandes
                </Link>
                <Link
                  to="/shops"
                  className="block rounded-full py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  Continuer mes achats <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}