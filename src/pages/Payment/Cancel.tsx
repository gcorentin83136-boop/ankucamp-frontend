import { Link } from 'react-router-dom'
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react'
import AppHeader from '../../components/layout/AppHeader'
import AnimatedCartBackground from '../../components/buyer/AnimatedCartBackground'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
}

export default function PaymentCancel() {
  return (
    <div className="relative min-h-screen">
      <AppHeader />
      <AnimatedCartBackground />

      <div className="relative max-w-2xl mx-auto py-10 px-3 sm:px-5">
        <div className="rounded-3xl p-8 text-center shadow-xl border border-white/50 bg-white/85 backdrop-blur-xl">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-50">
            <XCircle size={44} className="text-red-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            Paiement annulé
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Ton paiement n'a pas abouti. Ton panier est toujours là, tu peux
            réessayer quand tu veux.
          </p>

          <div className="space-y-3">
            <Link
              to="/cart"
              className="block rounded-full py-3 text-sm font-bold text-white transition flex items-center justify-center gap-2"
              style={{ background: ANKU.green }}
            >
              <ShoppingCart size={16} />
              Retourner au panier
            </Link>
            <Link
              to="/shops"
              className="block rounded-full py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}