import type { ReactNode } from 'react'
import { useState } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  wide?: boolean
  noLogo?: boolean
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  wide = false,
  noLogo = false,
}: AuthLayoutProps) {
  const [videoError, setVideoError] = useState(false)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a2f1a]">
      {!videoError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => setVideoError(true)}
          className="fixed inset-0 w-full h-full object-cover z-0"
        >
          <source
            src="/videos/login-bg.mp4"
            type="video/mp4"
            onError={() => setVideoError(true)}
          />
        </video>
      )}

      {videoError && (
        <div
          className="fixed inset-0 z-0"
          style={{
            background:
              'linear-gradient(135deg, #1a2f1a 0%, #2d4a2d 50%, #1a2f1a 100%)',
          }}
        />
      )}

      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/25 z-[1]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6">
        <div
          className={`w-full ${wide ? 'max-w-[880px]' : 'max-w-[380px] sm:max-w-[440px] md:max-w-[520px]'}
                     p-5 sm:p-7 md:p-9
                     bg-black/25 backdrop-blur-2xl
                     border border-white/15 rounded-2xl sm:rounded-[32px] md:rounded-[38px]
                     shadow-[0_25px_80px_rgba(0,0,0,0.5)]
                     flex flex-col items-center`}
        >
          {/* Logo responsive */}
          {!noLogo && (
            <img
              src="/images/anku-logo.png"
              alt="ANKU"
              className={`${
                wide
                  ? 'w-12 h-12 sm:w-14 sm:h-14 mb-2'
                  : 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-3 sm:mb-4'
              } object-contain`}
              style={{
                filter:
                  'drop-shadow(0 0 12px rgba(110,231,183,0.55)) drop-shadow(0 0 24px rgba(16,185,129,0.35))',
              }}
            />
          )}

          {/* Titre responsive */}
          {title && (
            <h1
              className={`${
                wide
                  ? 'text-base sm:text-lg md:text-xl mb-1.5'
                  : 'text-xl sm:text-2xl md:text-3xl mb-1.5 sm:mb-2'
              } font-extrabold text-center leading-tight tracking-tight`}
              style={{
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {title}
            </h1>
          )}

          {/* Sous-titre responsive */}
          {subtitle && (
            <p
              className={`${
                wide
                  ? 'text-[11px] sm:text-xs md:text-sm mb-3'
                  : 'text-xs sm:text-sm md:text-base mb-4 sm:mb-6'
              } text-center`}
              style={{
                color: 'rgba(255,255,255,0.92)',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {subtitle}
            </p>
          )}

          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  )
}
