import { useState, useEffect } from 'react'
import SettingsModal from './SettingsModal'
import Input from '../ui/Input'

interface ConfirmPasswordModalProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  onClose: () => void
  onConfirm: (password: string) => void | Promise<void>
}

export default function ConfirmPasswordModal({
  open,
  title = 'Confirmation',
  description = 'Saisis ton mot de passe pour continuer.',
  confirmLabel = 'Confirmer',
  loading = false,
  onClose,
  onConfirm,
}: ConfirmPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPassword('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Mot de passe requis')
      return
    }
    setError('')
    await onConfirm(password)
  }

  return (
    <SettingsModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="confirm-password-form"
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: '#6aa84f' }}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      }
    >
      <form id="confirm-password-form" onSubmit={handleSubmit}>
        <Input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="!rounded-xl !bg-gray-50 !text-gray-900 !placeholder-gray-400 focus:!ring-emerald-500"
        />
        {error && (
          <p className="text-xs text-red-500 mt-2 ml-1 font-medium">{error}</p>
        )}
      </form>
    </SettingsModal>
  )
}
