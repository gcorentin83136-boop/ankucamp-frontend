import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: string[]
  index: number
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}) {
  const isOpen = index >= 0 && index < images.length
  const current = isOpen ? images[index] : null

  // Navigation clavier
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < images.length - 1)
        onNavigate(index + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, index, images.length, onClose, onNavigate])

  if (!isOpen || !current) return null

  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  const modal = (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition"
        title="Fermer (Échap)"
      >
        <X size={22} />
      </button>

      {/* Compteur */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(index - 1)
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition"
          title="Précédent (←)"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      {/* Image */}
      <img
        src={current}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl select-none"
      />

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(index + 1)
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition"
          title="Suivant (→)"
        >
          <ChevronRight size={26} />
        </button>
      )}

      {/* Miniatures en bas */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] flex gap-2 overflow-x-auto p-2 bg-black/40 rounded-2xl">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(i)
              }}
              className={
                'shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ' +
                (i === index
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-100')
              }
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modal, document.body)
    : null
}