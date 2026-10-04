import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  XCircle,
} from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import SettingsModal from '../../components/settings/SettingsModal'
import ConfirmPasswordModal from '../../components/settings/ConfirmPasswordModal'
import gdprApi from '../../service/api/settings/gdpr.api'
import type {
  DataExportRequest,
  AccountDeletionRequest,
  LegalAcceptance,
} from '../../types/settings'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR')
  } catch {
    return iso
  }
}

export default function DangerZone() {
  const [exportReq, setExportReq] = useState<DataExportRequest | null>(null)
  const [deletionReq, setDeletionReq] = useState<AccountDeletionRequest | null>(
    null
  )
  const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [confirmCancelDeleteOpen, setConfirmCancelDeleteOpen] = useState(false)

  const fetchAll = async () => {
    try {
      const [expRes, delRes, accRes] = await Promise.all([
        gdprApi.exportStatus().catch(() => ({ request: null })),
        gdprApi.deletionStatus().catch(() => ({ request: null })),
        gdprApi.listAcceptances().catch(() => ({ acceptances: [] })),
      ])
      setExportReq(expRes.request)
      setDeletionReq(delRes.request)
      setAcceptances(accRes.acceptances || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await gdprApi.exportData()
      setExportReq(res.request)
      toast.success('Export en cours de préparation')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteConfirm = async (_password: string) => {
    setDeleteLoading(true)
    try {
      const res = await gdprApi.requestDeletion(deleteReason || undefined)
      setDeletionReq(res.request)
      toast.success('Suppression programmée')
      setDeleteConfirmOpen(false)
      setDeleteOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCancelDelete = async () => {
    try {
      await gdprApi.cancelDeletion()
      setDeletionReq(null)
      toast.success('Suppression annulée')
      setConfirmCancelDeleteOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  if (loading) return <p className="text-sm text-gray-500 p-4">Chargement…</p>

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Exporter mes données (RGPD)"
        description="Télécharge une archive de toutes tes données ANKU"
        icon={<Download size={18} />}
      >
        {exportReq ? (
          <div
            className="p-3 rounded-xl"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <p className="text-sm font-bold text-emerald-800">
              Demande d’export : {exportReq.status}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Demandée le {formatDate(exportReq.requested_at)}
            </p>
            {exportReq.file_url && exportReq.status === 'ready' && (
              <a
                href={exportReq.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 rounded-full px-4 py-2 text-sm font-bold text-white"
                style={{ background: '#6aa84f' }}
              >
                Télécharger l’archive
              </a>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Un fichier ZIP contenant ton profil, tes posts, tes commandes et
              tes messages sera généré et disponible au téléchargement.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: '#6aa84f' }}
            >
              {exportLoading ? '...' : 'Demander l’export'}
            </button>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title="Acceptations légales"
        description="Historique de tes acceptations (CGU, cookies…)"
        icon={<FileText size={18} />}
      >
        {acceptances.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune acceptation enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {acceptances.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-200"
              >
                <p className="text-sm font-bold text-gray-800">
                  {a.document_type} · v{a.document_version}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(a.accepted_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Supprimer mon compte"
        description="Action irréversible après un délai de 30 jours"
        icon={<Trash2 size={18} />}
        danger
      >
        {deletionReq ? (
          <>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">
                    Suppression programmée
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Ton compte sera supprimé le{' '}
                    {formatDate(deletionReq.scheduled_deletion_at)}.
                  </p>
                  {deletionReq.reason && (
                    <p className="text-xs text-red-700 mt-1">
                      Raison : {deletionReq.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmCancelDeleteOpen(true)}
              className="rounded-full px-5 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition inline-flex items-center gap-2"
            >
              <XCircle size={16} />
              Annuler la suppression
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Toutes tes données seront définitivement supprimées après un délai
              de 30 jours. Tu peux annuler pendant ce délai.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
            >
              Supprimer mon compte
            </button>
          </>
        )}
      </SettingsSection>

      {/* Modal 1 : raison */}
      <SettingsModal
        open={deleteOpen}
        title="Supprimer définitivement mon compte"
        description="Cette action est irréversible après 30 jours."
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false)
                setDeleteConfirmOpen(true)
              }}
              className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
            >
              Continuer
            </button>
          </div>
        }
      >
        <textarea
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="Raison (optionnel)"
          rows={3}
          className={inputCls + ' resize-none'}
        />
      </SettingsModal>

      {/* Modal 2 : confirmation mot de passe */}
      <ConfirmPasswordModal
        open={deleteConfirmOpen}
        title="Confirmer la suppression"
        description="Saisis ton mot de passe pour confirmer."
        confirmLabel="Supprimer"
        loading={deleteLoading}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Modal 3 : annuler suppression */}
      <SettingsModal
        open={confirmCancelDeleteOpen}
        title="Annuler la suppression"
        description="Ton compte sera conservé."
        onClose={() => setConfirmCancelDeleteOpen(false)}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmCancelDeleteOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Non
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition"
              style={{ background: '#6aa84f' }}
            >
              Oui, annuler
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Ton compte ne sera pas supprimé. Tu pourras en refaire la demande plus
          tard.
        </p>
      </SettingsModal>
    </div>
  )
}
