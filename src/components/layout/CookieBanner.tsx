// ============================================================
// ANKU — Bannière Cookies (version XXL visible)
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, ChevronDown } from 'lucide-react'

const STORAGE_KEY = 'anku_cookies_consent'

type Consent = {
  necessary: true
  analytics: boolean
  marketing: boolean
  accepted_at: string
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  const save = (consent: Consent) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setVisible(false)
  }

  const handleAcceptAll = () => {
    save({
      necessary: true,
      analytics: true,
      marketing: true,
      accepted_at: new Date().toISOString(),
    })
  }

  const handleRejectAll = () => {
    save({
      necessary: true,
      analytics: false,
      marketing: false,
      accepted_at: new Date().toISOString(),
    })
  }

  const handleSaveCustom = () => {
    save({
      necessary: true,
      analytics,
      marketing,
      accepted_at: new Date().toISOString(),
    })
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div
        className="max-w-5xl mx-auto
                   bg-black/90 backdrop-blur-2xl
                   border-2 border-emerald-500/50
                   rounded-[32px]
                   shadow-[0_25px_100px_rgba(0,0,0,0.85),0_0_60px_rgba(16,185,129,0.2)]
                   p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/30 border-2 border-emerald-400/60 flex items-center justify-center shrink-0">
            <Cookie size={26} className="text-emerald-300" />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg sm:text-xl font-extrabold mb-2"
              style={{
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              🍪 ANKU respecte ta vie privée
            </h3>
            <p
              className="text-sm sm:text-base leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              On utilise des cookies pour faire fonctionner le site, analyser
              le trafic et améliorer ton expérience. Tu peux tout accepter,
              tout refuser ou personnaliser. Voir notre{' '}
              <Link
                to="/legal/cookies"
                className="text-emerald-300 hover:underline font-semibold"
              >
                politique cookies
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Détails personnalisation */}
        {showDetails && (
          <div className="mb-5 p-4 rounded-2xl bg-white/5 border border-white/20 space-y-3">
            {/* Nécessaires */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1 w-5 h-5 accent-emerald-500"
              />
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{ color: '#ffffff' }}
                >
                  🔒 Cookies essentiels
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  Indispensables au fonctionnement (session, sécurité).
                </p>
              </div>
            </div>

            {/* Analytiques */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 w-5 h-5 accent-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{ color: '#ffffff' }}
                >
                  📊 Cookies analytiques
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  Nous aident à comprendre comment tu utilises ANKU.
                </p>
              </div>
            </div>

            {/* Marketing */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 w-5 h-5 accent-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{ color: '#ffffff' }}
                >
                  🎯 Cookies marketing
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  Pour te proposer des contenus et offres pertinents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!showDetails ? (
            <>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-initial px-8 py-3.5 text-base font-bold
                           bg-emerald-500 hover:bg-emerald-400
                           rounded-full transition shadow-lg shadow-emerald-500/50
                           hover:scale-105 transform"
                style={{ color: '#ffffff' }}
              >
                ✓ Tout accepter
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-initial px-8 py-3.5 text-base font-bold
                           border-2 border-white/50 hover:border-white
                           hover:bg-white/10 rounded-full transition"
                style={{ color: '#ffffff' }}
              >
                ✕ Tout refuser
              </button>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold
                           text-white/80 hover:text-white transition"
              >
                ⚙️ Personnaliser
                <ChevronDown size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 px-8 py-3.5 text-base font-bold
                           bg-emerald-500 hover:bg-emerald-400
                           rounded-full transition shadow-lg shadow-emerald-500/50"
                style={{ color: '#ffffff' }}
              >
                Enregistrer mes choix
              </button>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="px-6 py-3.5 text-sm font-bold text-white/80 hover:text-white transition"
              >
                ← Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
