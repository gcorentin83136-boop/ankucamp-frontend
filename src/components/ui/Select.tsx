import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import classNames from 'classnames'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-xs font-medium mb-1.5"
            style={{
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={classNames(
            'w-full px-5 py-3.5 rounded-full border-0',
            'bg-white/95 text-gray-800',
            'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition',
            'text-sm font-medium shadow-sm appearance-none cursor-pointer',
            error && 'ring-2 ring-red-400',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1.25rem center',
            backgroundSize: '12px',
            paddingRight: '3rem',
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            className="text-[11px] mt-1 ml-5 font-medium"
            style={{ color: '#fca5a5', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select

