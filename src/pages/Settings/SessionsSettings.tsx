import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Monitor, Smartphone, Globe, Trash2, LogOut } from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsModal from '../../components/settings/SettingsModal'
import sessionsApi from '../../service/api/settings/sessions.api'
import type { ActiveSession } from '../../types/settings'

function deviceIcon(info: string | null) {
  const i = (info || '').toLowerCase()
  if (i.includes('mobile') || i.includes('android') || i.includes('iphone'))
    return Smartphone
  return Monitor
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function SessionsSettings() {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [revokeTarget, setRevokeTarget] = useState<ActiveSession | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const [allLoading, setAllLoading] = useState(false)

  const fetchSessions = async () => {
    try {
      const res = await sessionsApi.list()
      setSessions(res.sessions)
    } catch {
      toast.error('Impossible de charger les sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevokeLoading(true)
    try {
      await sessionsApi.revoke(revokeTarget.id)
      toast.success('Session révoquée')
      setSessions((prev) => prev.filter((s) => s.id !== revokeTarget.id))
      setRevokeTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setRevokeLoading(false)
    }
  }

  const handleRevokeAll = async () => {
    setAllLoading(true)
    try {
      await sessionsApi.revokeAll()
      toast.success('Toutes les autres sessions ont été déconnectées')
      setSessions((prev) => prev.filter((s) => s.is_current))
      setConfirmAllOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setAllLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Sessions actives"
        description="Appareils actuellement connectés à ton compte"
        icon={<Monitor size={18} />}
        footer={
          sessions.length > 1 ? (
            <button
              type="button"
              onClick={() => setConfirmAllOpen(true)}
              className="w-full sm:w-auto rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition inline-flex items-center gap-2 justify-center"
            >
              <LogOut size={16} />
              Déconnecter toutes les autres sessions
            </button>
          ) : null
        }
      >
        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune session active.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const Icon = deviceIcon(s.device_info)
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: s.is_current ? '#f0fdf4' : '#f9fafb',
                    border: `1px solid ${s.is_current ? '#bbf7d0' : '#e5e7eb'}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: s.is_current ? '#dcfce7' : '#ffffff',
                      color: s.is_current ? '#059669' : '#6b7280',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {s.device_info || 'Appareil inconnu'}
                      </p>
                      {s.is_current && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          Actuelle
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                      {s.ip_address && (
                        <p className="flex items-center gap-1">
                          <Globe size={11} /> {s.ip_address}
                        </p>
                      )}
                      <p>Actif : {formatDate(s.last_active_at)}</p>
                    </div>
                  </div>
                  {!s.is_current && (
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(s)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition shrink-0"
                      title="Révoquer cette session"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SettingsSection>

      {/* Modal : révoquer une session */}
      <SettingsModal
        open={!!revokeTarget}
        title="Révoquer cette session"
        description={
          revokeTarget
            ? `L’appareil "${revokeTarget.device_info || 'inconnu'}" sera déconnecté immédiatement.`
            : ''
        }
        onClose={() => setRevokeTarget(null)}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={revokeLoading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
            >
              {revokeLoading ? '...' : 'Révoquer'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Cette action ne peut pas être annulée.
        </p>
      </SettingsModal>

      {/* Modal : révoquer toutes */}
      <SettingsModal
        open={confirmAllOpen}
        title="Déconnecter toutes les autres sessions"
        description="Toutes les sessions sauf celle-ci seront révoquées."
        onClose={() => setConfirmAllOpen(false)}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAllOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={allLoading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
            >
              {allLoading ? '...' : 'Tout déconnecter'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Tu devras te reconnecter sur les autres appareils.
        </p>
      </SettingsModal>
    </div>
  )
}
