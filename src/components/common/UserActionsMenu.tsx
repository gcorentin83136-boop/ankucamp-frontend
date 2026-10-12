import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Ban, ShieldOff, CheckCircle2, Flag } from 'lucide-react'

export default function UserActionsMenu({
  isBlocked,
  isRestricted,
  busy,
  onBlock,
  onUnblock,
  onRestrict,
  onUnrestrict,
  onReport,
}: {
  isBlocked: boolean
  isRestricted: boolean
  busy?: boolean
  onBlock: () => void
  onUnblock: () => void
  onRestrict: () => void
  onUnrestrict: () => void
  onReport: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handle = (action: () => void) => {
    if (busy) return
    action()
    setOpen(false)
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
        title="Plus d'actions"
        disabled={busy}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[220px]">
          {isBlocked ? (
            <button
              type="button"
              onClick={() => handle(onUnblock)}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-2"
            >
              <CheckCircle2 size={12} />
              Débloquer cet utilisateur
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handle(onBlock)}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              <Ban size={12} />
              Bloquer
            </button>
          )}

          {isRestricted ? (
            <button
              type="button"
              onClick={() => handle(onUnrestrict)}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-2"
            >
              <CheckCircle2 size={12} />
              Retirer la restriction
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handle(onRestrict)}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition flex items-center gap-2"
            >
              <ShieldOff size={12} />
              Restreindre
            </button>
          )}

          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={() => handle(onReport)}
            className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <Flag size={12} />
            Signaler le profil
          </button>
        </div>
      )}
    </div>
  )
}