import { useState } from 'react'
import { Users, Globe, Lock, ChevronDown } from 'lucide-react'
import type { PostVisibility } from '../../types/post'

export default function VisibilityDropdown({
  value,
  onChange,
}: {
  value: PostVisibility
  onChange: (v: PostVisibility) => void
}) {
  const [open, setOpen] = useState(false)
  const options = [
    { value: 'public' as const, label: 'Public', icon: Globe, color: '#10b981' },
    { value: 'friends' as const, label: 'Amis', icon: Users, color: '#0ea5e9' },
    { value: 'private' as const, label: 'Privé', icon: Lock, color: '#6b7280' },
  ]
  const current = options.find((o) => o.value === value) ?? options[0]
  const Icon = current.icon

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition"
      >
        <Icon size={14} style={{ color: current.color }} />
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-1 min-w-[150px]">
            {options.map((opt) => {
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={
                    'w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition flex items-center gap-2 ' +
                    (value === opt.value
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50')
                  }
                >
                  <OptIcon size={12} style={{ color: opt.color }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}