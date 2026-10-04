import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function SettingsModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
}: SettingsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full ${SIZES[size]} rounded-3xl bg-white shadow-2xl overflow-hidden`}
      >
        <header className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </header>

        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <footer className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
