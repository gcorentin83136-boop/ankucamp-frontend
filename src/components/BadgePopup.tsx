// ============================================================
// ANKU — Popup Badge (vert ANKU logo)
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Sparkles, X, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'

const STORAGE_PREFIX = 'anku_badge_popup_seen_'

// Palette ANKU (couleurs du logo plante verte)
const ANKU = {
  green: '#6aa84f',        // vert principal du logo
  greenLight: '#8bc34a',   // vert clair des feuilles
  greenDark: '#4a7a35',    // vert foncé tige
  greenDeep: '#2f5a22',    // vert très foncé pour le fond
}

export default function BadgePopup() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const key = `${STORAGE_PREFIX}${user.id}`
    const seen = localStorage.getItem(key)

    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user])

  const handleClose = () => {
    if (user) {
      localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, '1')
    }
    setVisible(false)
  }

  const handleDiscoverPro = () => {
    handleClose()
    navigate('/become-pro')
  }

  if (!visible || !user) return null

  // Style commun pour la popup
  const popupStyle = {
    background: `linear-gradient(135deg, ${ANKU.greenDeep} 0%, ${ANKU.greenDark} 50%, ${ANKU.greenDeep} 100%)`,
    borderColor: `${ANKU.greenLight}cc`,
    boxShadow: `0 25px 80px rgba(0,0,0,0.7), 0 0 40px ${ANKU.green}66`,
  }

  const iconBgStyle = {
    background: `${ANKU.green}33`,
    borderColor: `${ANKU.greenLight}aa`,
  }

  const iconGlowStyle = {
    background: ANKU.greenLight,
    opacity: 0.5,
  }

  // Cas 1 : Pro
  if (user.role === 'professionnel') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div
          className="relative w-full max-w-md p-7 backdrop-blur-2xl border-2 rounded-[32px]"
          style={popupStyle}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition"
          >
            <X size={16} className="text-white/80" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={iconGlowStyle}
              />
              <div
                className="relative w-20 h-20 rounded-full border-2 flex items-center justify-center"
                style={iconBgStyle}
              >
                <Shield size={40} style={{ color: ANKU.greenLight }} />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-center mb-3 text-white">
            Bienvenue chez les Pros ! 🎉
          </h2>

          <p className="text-sm text-center leading-relaxed mb-5 text-white/95">
            Ton compte{' '}
            <strong style={{ color: ANKU.greenLight }}>Professionnel</strong> est
            activé. Soumets ton SIRET pour recevoir le{' '}
            <strong style={{ color: ANKU.greenLight }}>badge Vérifié ✓</strong> et
            débloquer toutes les fonctionnalités Pro (boutique, événements,
            articles…).
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDiscoverPro}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 font-bold text-base rounded-full transition shadow-lg hover:scale-105 transform"
              style={{ background: '#ffffff', color: ANKU.greenDark }}
            >
              <Sparkles size={18} />
              Vérifier mon compte Pro
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 text-sm font-semibold text-white/80 hover:text-white transition"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Cas 2 : Particulier
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md p-7 backdrop-blur-2xl border-2 rounded-[32px]"
        style={popupStyle}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition"
        >
          <X size={16} className="text-white/80" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={iconGlowStyle}
            />
            <div
              className="relative w-20 h-20 rounded-full border-2 flex items-center justify-center"
              style={iconBgStyle}
            >
              <Sparkles size={40} style={{ color: ANKU.greenLight }} />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-center mb-3 text-white">
          Bienvenue sur ANKU ! 🌱
        </h2>

        <p className="text-sm text-center leading-relaxed mb-5 text-white/95">
          Tu es maintenant membre de la communauté{' '}
          <strong style={{ color: ANKU.greenLight }}>ANKU</strong>. Découvre les
          producteurs et agriculteurs près de chez toi, et profite du circuit
          court.
        </p>

        <div className="p-3 rounded-2xl bg-black/30 border border-white/20 mb-5">
          <p className="text-xs mb-2 text-white/85">
            💡{' '}
            <strong className="text-white">
              Tu es producteur, artisan ou agriculteur ?
            </strong>
          </p>
          <p className="text-[11px] text-white/70">
            Deviens Pro pour vendre tes produits, créer ta boutique et recevoir
            le badge{' '}
            <strong style={{ color: ANKU.greenLight }}>Vérifié ✓</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleDiscoverPro}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 font-bold text-base rounded-full transition shadow-lg hover:scale-105 transform"
            style={{ background: '#ffffff', color: ANKU.greenDark }}
          >
            <Sparkles size={18} />
            Devenir Pro
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 text-sm font-semibold text-white/80 hover:text-white transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

