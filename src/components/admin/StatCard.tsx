import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  hint?: string
  highlight?: boolean
  danger?: boolean
  onClick?: () => void
}

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

export default function StatCard({
  label,
  value,
  icon,
  hint,
  highlight = false,
  danger = false,
  onClick,
}: StatCardProps) {
  const isClickable = !!onClick

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 bg-white border transition-all ${
        isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
      }`}
      style={{
        borderColor: danger ? '#fecaca' : highlight ? `${ANKU.green}55` : '#e5e7eb',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: danger ? '#dc2626' : '#6b7280' }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-extrabold mt-1"
            style={{ color: danger ? '#991b1b' : '#0f1a0f' }}
          >
            {value}
          </p>
          {hint && (
            <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: danger ? '#fee2e2' : ANKU.greenPale,
              color: danger ? '#dc2626' : ANKU.greenDark,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
