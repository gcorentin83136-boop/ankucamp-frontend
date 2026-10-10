import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'

// ============================================================
// ANKU — Emoji Picker léger (pas de dépendance externe)
// ============================================================

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Souvent utilisés': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '😉', '😊', '😍', '🥰', '😘', '😜', '🤪',
    '🤗', '🤔', '🤨', '😐', '😑', '🙄', '😏', '😴',
    '😢', '😭', '😤', '😡', '🤯', '😱', '🥳', '🤩',
    '👍', '👎', '👏', '🙌', '🙏', '💪', '👋', '🤝',
  ],
  'Nature': [
    '🌱', '🌿', '🍀', '🌳', '🌲', '🌴', '🌵', '🌸',
    '🌺', '🌻', '🌷', '🌹', '🌾', '🍁', '🍂', '🍃',
    '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌈',
    '❄️', '🔥', '💧', '🌊', '⭐', '🌟', '✨', '☄️',
  ],
  'Nourriture': [
    '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
    '🍓', '🫐', '🍒', '🍑', '🥝', '🍅', '🥑', '🍆',
    '🥕', '🌽', '🌶️', '🥒', '🥬', '🧄', '🧅', '🍞',
    '🥐', '🥖', '🧀', '🥚', '🍳', '🥗', '🍲', '🍝',
    '🍰', '🎂', '🍪', '🍫', '🍯', '☕', '🍵', '🍷',
  ],
  'Activités': [
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
    '🏓', '🏸', '🥊', '🎯', '🎮', '🎲', '🎨', '🎭',
    '🎬', '🎤', '🎧', '🎸', '🎹', '🥁', '🎺', '🎻',
    '📚', '📝', '✏️', '🖊️', '📖', '📰', '📷', '🎥',
  ],
  'Voyage & Lieux': [
    '🏠', '🏡', '🏘️', '🏢', '🏬', '🏭', '🏰', '🏯',
    '🗼', '🗽', '⛪', '🕌', '🛕', '🌉', '🌁', '🚗',
    '🚕', '🚙', '🚌', '🚎', '🚓', '🚑', '🚒', '🚚',
    '✈️', '🚀', '🛸', '🚁', '⛵', '🚤', '🛥️', '🚢',
  ],
  'Symboles': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
    '✅', '❌', '⚠️', '❓', '❗', '💯', '🎉', '🎊',
    '🔥', '💥', '💫', '⭐', '🏆', '🥇', '🥈', '🥉',
  ],
}

export default function EmojiPicker({
  onSelect,
  align = 'right',
}: {
  onSelect: (emoji: string) => void
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('Souvent utilisés')
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          'w-8 h-8 rounded-full flex items-center justify-center transition ' +
          (open
            ? 'bg-amber-50 text-amber-600'
            : 'text-gray-500 hover:bg-amber-50 hover:text-amber-600')
        }
        title="Ajouter un emoji"
      >
        <Smile size={16} />
      </button>

      {open && (
        <div
          className={
            'absolute bottom-full mb-2 z-[300] bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 ' +
            (align === 'right' ? 'right-0' : 'left-0')
          }
        >
          {/* Tabs catégories */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-100 overflow-x-auto">
            {Object.keys(EMOJI_CATEGORIES).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={
                  'shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-full transition ' +
                  (category === cat
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100')
                }
                style={
                  category === cat
                    ? { background: '#6aa84f' }
                    : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grille emojis */}
          <div className="max-h-48 overflow-y-auto p-2">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_CATEGORIES[category].map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => {
                    onSelect(emoji)
                    setOpen(false)
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-amber-50 transition"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}