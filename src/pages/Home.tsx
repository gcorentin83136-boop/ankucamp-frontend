import { Link } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import UserMenu from '../components/layout/UserMenu'
import NotificationBell from '../components/layout/NotificationBell'
import { LogOut } from 'lucide-react'
import BadgePopup from '../components/BadgePopup'

export default function Home() {
  const { isAuthenticated, user, logout } = useAuthStore()

  const showKycBanner =
    isAuthenticated &&
    user?.role === 'professionnel' &&
    user.verification_status !== 'verified'

  const kycBannerConfig =
    user?.verification_status === 'pending'
      ? {
          icon: '⏳',
          title: 'Vérification en cours',
          sub: 'Ton dossier KYC est en cours de traitement',
          shortTitle: 'Vérification en cours',
        }
      : user?.verification_status === 'rejected'
      ? {
          icon: '❌',
          title: 'Vérification refusée',
          sub: 'Clique pour soumettre à nouveau',
          shortTitle: 'Vérification refusée',
        }
      : {
          icon: '🧾',
          title: 'Vérifie ton compte pro',
          sub: 'Soumets ton SIRET pour débloquer toutes les fonctionnalités Pro',
          shortTitle: 'Vérifie ton compte pro',
        }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div className="relative min-h-screen md:h-screen w-full overflow-y-auto md:overflow-hidden bg-black">

      {/* 🎥 VIDÉO DE FOND */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      <div className="fixed inset-0 bg-black/5 z-[1]" />

      <div
        className="fixed inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 88%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* CONTENU */}
      <div className="relative z-10 min-h-screen md:h-screen flex flex-col">

        {/* ============ NAVBAR ============ */}
        <nav className="w-full px-3 sm:px-6 py-2 sm:py-3 backdrop-blur-xl bg-black/20 border-b border-emerald-500/20 shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <img
                src="/images/anku-logo.png"
                alt="ANKU"
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-transform group-hover:scale-110"
                style={{ filter: 'drop-shadow(0 0 12px rgba(110,231,183,0.6))' }}
              />
              <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white">
                ANKU
              </span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              {isAuthenticated && user ? (
                <>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Se déconnecter"
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 hover:border-red-400/70 rounded-full transition text-red-200 hover:text-white text-xs sm:text-sm font-semibold"
                  >
                    <LogOut size={13} className="sm:hidden" />
                    <LogOut size={14} className="hidden sm:block" />
                    <span className="hidden md:inline">Déconnexion</span>
                  </button>
                  <UserMenu />
                  <NotificationBell count={0} />
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:text-emerald-300 transition"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition shadow-lg shadow-emerald-500/40"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ============ BANDEAU KYC ============ */}
        {showKycBanner && (
          <Link
            to="/kyc"
            className="relative w-full shrink-0 overflow-hidden group"
          >
            <div
              className="absolute inset-0 z-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.25) 50%, rgba(16,185,129,0.35) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            />
            <div
              className="absolute inset-0 z-0 opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(16,185,129,0.4) 0%, transparent 70%)',
              }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-emerald-400/60 z-[1]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-emerald-400/60 z-[1]" />

            <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-base">
                <span className="text-base sm:text-2xl shrink-0">
                  {kycBannerConfig.icon}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0">
                  <span className="font-extrabold text-white text-xs sm:text-base md:text-lg truncate">
                    <span className="sm:hidden">{kycBannerConfig.shortTitle}</span>
                    <span className="hidden sm:inline">{kycBannerConfig.title}</span>
                  </span>
                  <span className="text-white/85 text-[10px] sm:text-sm hidden sm:inline">
                    {kycBannerConfig.sub}
                  </span>
                </div>
                <span className="text-white font-bold text-base sm:text-xl group-hover:translate-x-1 transition-transform shrink-0 hidden sm:inline">
                  →
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* ============ HERO ============ */}
        <section className="flex-1 flex items-center justify-center px-3 sm:px-4 py-3 sm:py-4 min-h-0">
          <div
            className="w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-5 md:px-10 md:py-7
                       bg-black/15 backdrop-blur-2xl
                       rounded-2xl sm:rounded-[32px]
                       shadow-[0_25px_80px_rgba(0,0,0,0.35)]
                       flex flex-col items-center text-center"
          >
            <span
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full
                         bg-emerald-500/60 border border-emerald-300/90
                         text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] mb-2 sm:mb-3 text-white"
              style={{
                boxShadow:
                  '0 0 12px rgba(16,185,129,0.5), inset 0 0 8px rgba(16,185,129,0.3)',
              }}
            >
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-pulse" />
              Réseau social engagé
            </span>

            <div className="relative mb-2 sm:mb-3 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full bg-black/40 blur-2xl"
                style={{ transform: 'scale(1.6)', zIndex: 0 }}
              />
              <img
                src="/images/anku-logo.png"
                alt="ANKU"
                className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain"
                style={{
                  zIndex: 1,
                  filter:
                    'drop-shadow(0 0 24px rgba(110,231,183,0.8)) drop-shadow(0 0 50px rgba(16,185,129,0.5))',
                }}
              />
            </div>

            {isAuthenticated && user ? (
              <>
                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight mb-1.5 sm:mb-3 max-w-2xl text-white">
                  Bonjour{' '}
                  <span className="text-emerald-400">{user.first_name}</span> 👋
                </h1>
                <p className="text-[11px] sm:text-sm md:text-base max-w-xl leading-relaxed mb-0 sm:mb-4 text-white/95">
                  Ravi de te revoir sur ANKU. Explore, partage, échange — ta
                  communauté t'attend.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight mb-1.5 sm:mb-3 max-w-2xl text-white">
                  Le réseau qui donne du{' '}
                  <span className="text-emerald-400">sens</span>
                  <br />à vos échanges
                </h1>
                <p className="text-[11px] sm:text-sm md:text-base max-w-xl leading-relaxed mb-0 sm:mb-4 text-white/95">
                  ANKU connecte les{' '}
                  <strong className="text-emerald-300">agriculteurs</strong>, les{' '}
                  <strong className="text-emerald-300">producteurs locaux</strong>{' '}
                  et les <strong className="text-emerald-300">particuliers</strong>{' '}
                  autour de valeurs simples : circuit court, transparence et
                  communauté.
                </p>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition shadow-lg shadow-emerald-500/50 hover:scale-105 transform text-center"
                >
                  Rejoindre ANKU
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-2 border-white/60 hover:border-white hover:bg-white/15 text-white rounded-full transition backdrop-blur-sm text-center"
                >
                  J'ai déjà un compte
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ============ 3 CARTES VALEURS ============ */}
        <section className="w-full px-3 sm:px-4 pb-3 sm:pb-5 shrink-0">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
            {[
              {
                icon: '🌱',
                title: 'Circuit court',
                desc: 'Achetez directement auprès des producteurs près de chez vous.',
              },
              {
                icon: '🤝',
                title: 'Vraie communauté',
                desc: 'Échangez et créez du lien avec des personnes qui partagent vos valeurs.',
              },
              {
                icon: '🔍',
                title: 'Transparence totale',
                desc: 'Origine des produits, avis vérifiés : consommez en confiance.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/15 backdrop-blur-xl border-2 border-emerald-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:bg-black/25 hover:border-emerald-400/70 transition-all duration-300 group"
              >
                <div className="flex items-center md:items-start gap-2.5 sm:gap-4">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-2xl bg-emerald-500/30 border border-emerald-400/60 flex items-center justify-center text-lg sm:text-xl md:text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm md:text-base font-bold mb-0.5 sm:mb-1.5 text-white">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm leading-snug sm:leading-relaxed text-white/95">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="w-full px-3 sm:px-6 py-2 sm:py-2.5 backdrop-blur-xl bg-black/20 border-t border-emerald-500/20 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-white/90">
              <Link to="/legal/cgu" className="hover:text-emerald-300 transition">
                CGU
              </Link>
              <span className="text-white/30">•</span>
              <Link to="/legal/cookies" className="hover:text-emerald-300 transition">
                Cookies
              </Link>
              <span className="text-white/30">•</span>
              <Link to="/contact" className="hover:text-emerald-300 transition">
                Contacter ANKU
              </Link>
            </div>
            <p className="text-[9px] sm:text-[11px] text-white/70">
              © {new Date().getFullYear()} ANKU — Réseau social engagé
            </p>
          </div>
        </footer>
      </div>

      <BadgePopup />
    </div>
  )
}

