import { useState } from 'react'
import toast from 'react-hot-toast'
import { X, Send, Check, Share2, MessageCircle } from 'lucide-react'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

// ============================================================
// SVG inline des logos (pour éviter une lib externe)
// ============================================================
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconTwitter() {
  return (
    <svg viewBox="0 0 24 24" fill="#000" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function IconTelegram() {
  return (
    <svg viewBox="0 0 24 24" fill="#0088cc" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.26-1.91.178-.184 3.256-2.98 3.316-3.233.006-.03.012-.14-.052-.19-.063-.052-.156-.035-.223-.02-.096.02-1.618 1.028-4.564 3.02-.432.297-.822.443-1.168.435-.384-.01-1.123-.217-1.673-.395-.673-.22-1.207-.336-1.16-.71.024-.195.293-.395.805-.6 3.156-1.373 5.26-2.28 6.313-2.72 3.006-1.247 3.63-1.463 4.037-1.47z" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="#0A66C2" className="w-5 h-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function IconMessenger() {
  return (
    <svg viewBox="0 0 24 24" fill="#0084FF" className="w-5 h-5">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.245.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8l3.13 3.259L19.752 8l-6.559 6.963z" />
    </svg>
  )
}

// ============================================================
// MENU DE PARTAGE
// ============================================================
export default function ShareMenu({
  postId,
  shareText = '',
  onClose,
  onShared,
}: {
  postId: number
  shareText?: string
  onClose: () => void
  onShared?: () => void
}) {
  const [copied, setCopied] = useState(false)

  // URL publique du post
  const url = `${window.location.origin}/feed#post-${postId}`
  const text = shareText
    ? `${shareText}\n\n${url}`
    : `Découvre ce post sur ANKU : ${url}`

  const openInNewTab = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Lien copié ✅')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  // Partage natif (mobile)
  const handleNativeShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'ANKU',
        text: shareText || 'Découvre ce post sur ANKU',
        url,
      })
      onShared?.()
    } catch {
      // user a annulé
    }
  }

  const shares = [
    {
      label: 'Facebook',
      icon: <IconFacebook />,
      onClick: () =>
        openInNewTab(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        ),
    },
    {
      label: 'X',
      icon: <IconTwitter />,
      onClick: () =>
        openInNewTab(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText || 'Découvre ce post sur ANKU')}`
        ),
    },
    {
      label: 'WhatsApp',
      icon: <IconWhatsApp />,
      onClick: () =>
        openInNewTab(`https://wa.me/?text=${encodeURIComponent(text)}`),
    },
    {
      label: 'Messenger',
      icon: <IconMessenger />,
      onClick: () =>
        openInNewTab(
          `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(url)}`
        ),
    },
    {
      label: 'Telegram',
      icon: <IconTelegram />,
      onClick: () =>
        openInNewTab(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText || 'Découvre ce post sur ANKU')}`
        ),
    },
    {
      label: 'LinkedIn',
      icon: <IconLinkedIn />,
      onClick: () =>
        openInNewTab(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        ),
    },
    {
      label: 'Email',
      icon: (
        <svg viewBox="0 0 24 24" fill="#EA4335" className="w-5 h-5">
          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
        </svg>
      ),
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent('Partage ANKU')}&body=${encodeURIComponent(text)}`
      },
    },
    {
      label: 'SMS',
      icon: (
        <svg viewBox="0 0 24 24" fill={ANKU.green} className="w-5 h-5">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ),
      onClick: () => {
        window.location.href = `sms:?&body=${encodeURIComponent(text)}`
      },
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 size={18} style={{ color: ANKU.greenDark }} />
            <p className="text-sm font-bold text-gray-900">Partager ce post</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Partage natif (mobile uniquement) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: ANKU.green }}
            >
              <Send size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">
                Partage natif
              </p>
              <p className="text-[11px] text-gray-500">
                Choisis l'app de ton choix
              </p>
            </div>
          </button>
        )}

        {/* Grille de boutons réseaux */}
        <div className="p-4">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            Partager sur
          </p>
          <div className="grid grid-cols-4 gap-3">
            {shares.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={s.onClick}
                className="flex flex-col items-center gap-1.5 group"
                title={s.label}
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition border border-gray-100 group-hover:scale-105">
                  {s.icon}
                </div>
                <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copier le lien */}
        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition"
            style={{
              borderColor: copied ? ANKU.green : '#e5e7eb',
              background: copied ? '#f0fdf4' : '#ffffff',
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: copied ? ANKU.green : '#6b7280' }}
            >
              {copied ? <Check size={16} /> : <MessageCircle size={16} />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-bold text-gray-900">
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{url}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}