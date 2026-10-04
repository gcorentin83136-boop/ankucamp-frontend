import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface LegalLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function LegalLayout({ title, subtitle, children }: LegalLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
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

      <div className="fixed inset-0 bg-black/15 z-[1]" />

      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-5 px-4 py-2
                       bg-black/40 backdrop-blur-xl border border-white/20
                       rounded-full text-white/90 hover:text-white
                       hover:bg-black/60 transition text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>

          <div
            className="w-full p-6 sm:p-10
                       bg-black/30 backdrop-blur-2xl
                       border-2 border-emerald-500/40
                       rounded-[32px]
                       shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
          >
            <h1
              className="text-3xl sm:text-4xl font-extrabold mb-2"
              style={{
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className="text-sm mb-6"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {subtitle}
              </p>
            )}

            <div
              className="prose prose-invert prose-sm max-w-none
                         text-white/90 leading-relaxed
                         [&_h2]:text-white [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg
                         [&_h3]:text-white [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-base
                         [&_p]:mb-3 [&_p]:text-white/85
                         [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul]:text-white/85
                         [&_li]:mb-1.5
                         [&_a]:text-emerald-300 [&_a]:hover:underline [&_a]:font-semibold"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


