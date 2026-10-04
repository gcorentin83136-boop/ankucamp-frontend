import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import SettingsModal from './SettingsModal'
import twoFactorApi from '../../service/api/settings/twoFactor.api'
import type { TwoFactorSetupResponse } from '../../types/settings'

interface TwoFactorSetupProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'loading' | 'scan' | 'verify' | 'backup' | 'error'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
}

export default function TwoFactorSetup({
  open,
  onClose,
  onSuccess,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>('loading')
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setStep('loading')
    setError('')
    setCode('')
    setBackupCodes([])

    twoFactorApi
      .setup()
      .then((res) => {
        setSetupData(res)
        setStep('scan')
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || 'Erreur lors de l’initialisation 2FA'
        setError(msg)
        setStep('error')
      })
  }, [open])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await twoFactorApi.verify(code.trim())
      setBackupCodes(res.backup_codes)
      setStep('backup')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Code invalide'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    onSuccess()
    onClose()
  }

  if (!open) return null

  return (
    <SettingsModal
      open={open}
      title="Activer la 2FA"
      description={
        step === 'scan'
          ? 'Scanne le QR code avec ton app d’authentification'
          : step === 'verify'
          ? 'Saisis le code à 6 chiffres'
          : step === 'backup'
          ? 'Conserve ces codes de secours'
          : undefined
      }
      onClose={onClose}
      size="lg"
    >
      {step === 'loading' && (
        <div className="py-8 flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin"
            style={{
              borderColor: `${ANKU.green}33`,
              borderTopColor: ANKU.green,
            }}
          />
          <p className="text-sm text-gray-500">Initialisation…</p>
        </div>
      )}

      {step === 'error' && (
        <div className="py-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      )}

      {step === 'scan' && setupData && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <img
                src={setupData.qr_code}
                alt="QR code 2FA"
                className="w-44 h-44"
              />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
              Clé manuelle
            </p>
            <code className="text-xs text-gray-800 break-all">
              {setupData.secret}
            </code>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: ANKU.green }}
          >
            J’ai scanné le code
          </button>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-emerald-400 focus:bg-white transition"
          />

          {error && (
            <p className="text-sm text-red-500 text-center font-medium">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('scan')}
              className="flex-1 rounded-full py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 rounded-full py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: ANKU.green }}
            >
              {loading ? 'Vérification…' : 'Vérifier'}
            </button>
          </div>
        </form>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              Ces codes ne seront <strong>plus affichés</strong>. Conserve-les
              en lieu sûr.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((c) => (
              <code
                key={c}
                className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-center text-sm font-mono text-gray-800"
              >
                {c}
              </code>
            ))}
          </div>

          <button
            onClick={handleDone}
            className="w-full rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: ANKU.green }}
          >
            J’ai noté mes codes
          </button>
        </div>
      )}
    </SettingsModal>
  )
}
