import { useState } from 'react'
import { MoreHorizontal, Flag, Link2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PostActionsMenu({
  isOwn,
  onReport,
  onDelete,
  onCopyLink,
}: {
  isOwn: boolean
  onReport: () => void
  onDelete?: () => void
  onCopyLink?: () => void
}) {
  const [open, setOpen] = useState(false)

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink()
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copie')
    }
    setOpen(false)
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
        title="Actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[180px]">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
            >
              <Link2 size={12} />
              Copier le lien
            </button>

            {!isOwn && (
              <button
                type="button"
                onClick={() => {
                  onReport()
                  setOpen(false)
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-2"
              >
                <Flag size={12} />
                Signaler
              </button>
            )}

            {isOwn && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete()
                  setOpen(false)
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-2"
              >
                <Trash2 size={12} />
                Supprimer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}