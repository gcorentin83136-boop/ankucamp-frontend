import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
}

/**
 * Bannière affichée aux pros dont le compte Stripe n'est pas encore actif.
 * Objectif : les inciter à finir l'onboarding pour recevoir leurs paiements.
 */
export default function StripeRequiredBanner({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      className={'rounded-2xl p-4 flex items-start gap-3 ' + className}
      style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: '#fef3c7', color: '#a16207' }}
      >
        <AlertTriangle size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">
          Compte Stripe non connecté
        </p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Relie ton compte Stripe pour recevoir les paiements de tes clients.
          C&apos;est gratuit et ça prend 2 minutes.
        </p>
        <Link
          to="/settings/payment"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold hover:underline"
          style={{ color: ANKU.greenDark }}
        >
          Relier mon compte Stripe <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}