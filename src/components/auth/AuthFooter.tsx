import { Link } from 'react-router-dom'

interface AuthFooterProps {
  bottomText: string
  bottomLinkText: string
  bottomLinkTo: string
}

export default function AuthFooter({ bottomText, bottomLinkText, bottomLinkTo }: AuthFooterProps) {
  return (
    <>
      {/* Liens secondaires (CGU, Contact, Cookies) */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-white/60">
        <button type="button" className="hover:text-white transition">
          CGU
        </button>
        <span className="text-white/30">•</span>
        <button type="button" className="hover:text-white transition">
          Cookies
        </button>
        <span className="text-white/30">•</span>
        <button type="button" className="hover:text-white transition">
          Contacter ANKU
        </button>
      </div>

      {/* Lien bas de page */}
      <p className="text-center text-sm text-white/90 mt-4">
        {bottomText}{' '}
        <Link to={bottomLinkTo} className="font-bold hover:underline">
          {bottomLinkText}
        </Link>
      </p>
    </>
  )
}