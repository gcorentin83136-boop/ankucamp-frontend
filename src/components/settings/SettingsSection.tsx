import type { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  danger?: boolean
  footer?: ReactNode
}

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

export default function SettingsSection({
  title,
  description,
  icon,
  children,
  danger = false,
  footer,
}: SettingsSectionProps) {
  return (
    <section
      className="rounded-2xl bg-white shadow-sm overflow-hidden"
      style={{
        border: `1px solid ${danger ? '#fecaca' : '#e5e7eb'}`,
      }}
    >
      <header
        className="px-5 py-4 border-b"
        style={{
          borderColor: danger ? '#fee2e2' : '#f3f4f6',
          background: danger ? '#fef2f2' : ANKU.greenPale,
        }}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: danger ? '#fee2e2' : '#ffffff',
                color: danger ? '#dc2626' : ANKU.greenDark,
                border: `1px solid ${danger ? '#fecaca' : ANKU.green + '33'}`,
              }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2
              className="text-base font-bold"
              style={{ color: danger ? '#991b1b' : '#0f1a0f' }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </header>

      <div className="p-5 space-y-4">{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          {footer}
        </div>
      )}
    </section>
  )
}
