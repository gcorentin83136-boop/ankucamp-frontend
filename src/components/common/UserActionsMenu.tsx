import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ban, ShieldOff, CheckCircle2, Flag } from 'lucide-react'

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
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const r = buttonRef.current.getBoundingClientRect()
    setPos({
      top: r.bottom + 6,
      right: window.innerWidth - r.right,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onResize = () => updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, updatePosition])

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handle = (action: () => void) => {
    if (busy) return
    action()
    setOpen(false)
  }

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[220px]"
            style={{ top: pos.top, right: pos.right }}
          >
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
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          'inline-flex items-center justify-center w-9 h-9 rounded-full transition shadow-sm ' +
          (isBlocked
            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200')
        }
        title={isBlocked ? 'Débloquer' : 'Bloquer / Restreindre'}
        disabled={busy}
      >
        {isBlocked ? (
          <CheckCircle2 size={18} strokeWidth={2.5} />
        ) : (
          <Ban size={18} strokeWidth={2.5} />
        )}
      </button>
      {menu}
    </>
  )
}