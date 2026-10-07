import { useState } from 'react'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '🔥',
  '🎉', '👏', '🙏', '💚', '🌱', '✨',
]

export default function EmojiPicker({
  onPick,
  compact = false,
}: {
  onPick: (emoji: string) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`rounded-full flex items-center justify-center transition ${
          compact
            ? 'w-7 h-7 text-gray-400 hover:bg-gray-100'
            : 'w-9 h-9 text-gray-500 hover:bg-gray-100'
        }`}
        title="Ajouter un emoji"
      >
        <Smile size={compact ? 14 : 16} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 grid grid-cols-6 gap-1 w-[220px]">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onPick(e)
                  setOpen(false)
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 transition"
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
