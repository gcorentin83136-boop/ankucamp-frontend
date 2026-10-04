interface SettingsToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
}

export default function SettingsToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <label
      className={`flex items-start justify-between gap-4 py-1 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <span className="flex-1 min-w-0">
        {label && (
          <span className="block text-sm font-semibold text-gray-800">
            {label}
          </span>
        )}
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500">
            {description}
          </span>
        )}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: checked ? ANKU.green : '#d1d5db',
        }}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}
