import type { ButtonHTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none'

  const variants = {
    primary:
      'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/40',
    secondary: 'bg-white text-gray-800 hover:bg-gray-100',
    ghost:
      'bg-transparent text-white hover:bg-white/10 border-2 border-white/40',
  }

  const sizes = {
    sm: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
    md: 'px-5 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base',
    lg: 'px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg',
  }

  return (
    <button
      className={classNames(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
