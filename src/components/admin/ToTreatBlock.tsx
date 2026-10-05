import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface ToTreatItem {
  label: string
  value: number
  to: string
}

interface ToTreatBlockProps {
  items: ToTreatItem[]
  total: number
}

const ANKU = {
  green: '#6aa84f',
  greenPale: '#f0f9e8',
}

export default function ToTreatBlock({ items, total }: ToTreatBlockProps) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${total > 0 ? '#fde68a' : '#e5e7eb'}`,
        background: total > 0 ? '#fffbeb' : '#ffffff',
      }}
    >
      <header
        className="px-5 py-3 border-b flex items-center justify-between"
        style={{
          borderColor: total > 0 ? '#fde68a' : '#f3f4f6',
          background: total > 0 ? '#fef3c7' : ANKU.greenPale,
        }}
      >
        <div>
          <h2 className="text-base font-bold text-gray-900">
            ⚡ À traiter
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {total > 0
              ? `${total} action${total > 1 ? 's' : ''} en attente`
              : 'Rien à traiter pour l’instant — bien joué !'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
        {items.map((item) => {
          const hasWork = item.value > 0
          return (
            <Link
              key={item.label}
              to={item.to}
              className="group flex items-center justify-between gap-2 p-3 rounded-xl transition-all hover:shadow-sm"
              style={{
                background: hasWork ? '#ffffff' : '#f9fafb',
                border: hasWork ? '1px solid #fecaca' : '1px solid #e5e7eb',
              }}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">
                  {item.label}
                </p>
                <p
                  className="text-xl font-extrabold"
                  style={{ color: hasWork ? '#dc2626' : '#9ca3af' }}
                >
                  {item.value}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
