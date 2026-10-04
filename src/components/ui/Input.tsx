import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import classNames from 'classnames'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/90 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={classNames(
            'w-full px-5 py-4 rounded-full border-0 bg-white text-gray-800 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-emerald-400 transition',
            'text-base font-normal shadow-sm',
            error && 'ring-2 ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-300 text-xs mt-2 ml-4 font-medium">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input