import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, ShieldCheck, ShieldOff, KeyRound, AlertTriangle, Smartphone } from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsModal from '../../components/settings/SettingsModal'
import TwoFactorSetup from '../../components/settings/TwoFactorSetup'
import twoFactorApi from '../../service/api/settings/twoFactor.api'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await twoFactorApi.getStatus()
      setEnabled(res.enabled)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisableLoading(true)
    try {
      await twoFactorApi.disable(disablePassword, disableCode)
      toast.success('2FA désactivée')
      setEnabled(false)
      setDisableOpen(false)
      setDisablePassword('')
      setDisableCode('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDisableLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Authentification à deux facteurs"
        description="Ajoute une couche de sécurité supplémentaire à ton compte"
        icon={<Shield size={18} />}
      >
        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : (
          <>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: enabled ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${enabled ? '#bbf7d0' : '#e5e7eb'}`,
              }}
            >
              {enabled ? (
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              ) : (
                <ShieldOff size={20} className="text-gray-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-bold"
                  style={{ color: enabled ? '#065f46' : '#374151' }}
                >
                  {enabled ? '2FA activée' : '2FA désactivée'}
                </p>
                <p className="text-xs text-gray-500">
                  {enabled
                    ? 'Ton compte est protégé par une application d’authentification.'
                    : 'Nous te recommandons fortement d’activer la 2FA.'}
                </p>
              </div>
            </div>

            {enabled ? (
              <button
                type="button"
                onClick={() => setDisableOpen(true)}
                className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
              >
                Désactiver la 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition"
                style={{ background: '#6aa84f' }}
              >
                Activer la 2FA
              </button>
            )}
          </>
        )}
      </SettingsSection>

      {/* Encart "Avant d'activer" */}
      <SettingsSection
        title="Bon à savoir avant d'activer"
        description="Prépare ce dont tu auras besoin"
        icon={<AlertTriangle size={18} />}
      >
        <div
          className="p-3 rounded-xl flex gap-2"
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          <Smartphone size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-semibold">
              Une application d’authentification est nécessaire
            </p>
            <p className="text-xs">
              Installe Google Authenticator, Authy ou 1Password sur ton
              téléphone. Tu en auras besoin à chaque connexion.
            </p>
          </div>
        </div>

        <div
          className="p-3 rounded-xl flex gap-2"
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <KeyRound size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-semibold">
              Tu devras saisir ton mot de passe et un code à 6 chiffres
            </p>
            <p className="text-xs">
              À chaque connexion, tu seras invité à saisir le code à 6 chiffres
              généré par ton application. <strong>Tu auras aussi 10 codes de secours à
              conserver précieusement</strong> — ils te permettront de te connecter
              si tu perds l’accès à ton téléphone.
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
          <li>Conserve tes 10 codes de secours dans un endroit sûr (gestionnaire de mots de passe, papier…)</li>
          <li>Ne partage jamais tes codes avec personne, même quelqu’un qui prétend être ANKU</li>
          <li>Si tu perds ton téléphone, utilise un code de secours pour te connecter</li>
        </ul>
      </SettingsSection>

      {/* Setup modal */}
      <TwoFactorSetup
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSuccess={() => setEnabled(true)}
      />

      {/* Disable modal */}
      <SettingsModal
        open={disableOpen}
        title="Désactiver la 2FA"
        description="Saisis ton mot de passe et un code 2FA valide (ou un code de secours)."
        onClose={() => setDisableOpen(false)}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDisableOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="disable-2fa-form"
              disabled={disableLoading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
            >
              {disableLoading ? '...' : 'Désactiver'}
            </button>
          </div>
        }
      >
        <form id="disable-2fa-form" onSubmit={handleDisable} className="space-y-3">
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Mot de passe"
            className={inputCls}
          />
          <input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\s/g, '').toUpperCase())}
            placeholder="Code 2FA (6 chiffres) ou code de secours"
            maxLength={10}
            className={inputCls + ' tracking-widest'}
          />
        </form>
      </SettingsModal>
    </div>
  )
}
