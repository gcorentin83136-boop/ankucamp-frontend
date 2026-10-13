import { useRef, useState } from 'react'
import { X, Camera, Image as ImageIcon, Loader, Sparkles, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../context/AuthContext'
import usersApi from '../../service/api/users.api'
import uploadsApi from '../../service/api/uploads.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

export default function CompleteProfileModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { user, setUser, token } = useAuthStore()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url ?? null)
  const [coverUrl, setCoverUrl] = useState<string | null>(user?.cover_url ?? null)
  const [bio, setBio] = useState(user?.bio ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  if (!open || !user) return null

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop lourd (max 5 Mo)')
      return
    }
    setUploadingAvatar(true)
    try {
      const res = await uploadsApi.uploadAvatar(file)
      setAvatarUrl(res.url)
      toast.success('Photo de profil uploadée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop lourd (max 10 Mo)')
      return
    }
    setUploadingCover(true)
    try {
      const res = await uploadsApi.uploadCover(file)
      setCoverUrl(res.url)
      toast.success('Photo de couverture uploadée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = {
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        bio: bio.trim() || null,
      }
      const res = await usersApi.updateMe(payload)
      if (token) {
        localStorage.setItem('anku_user', JSON.stringify(res.user))
        setUser(res.user, token)
      }
      toast.success('Profil complété 🎉')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSkipping(true)
    try {
      await usersApi.skipProfileCompletion()
      // Mise à jour locale du user pour ne plus rafficher la modale
      if (user && token) {
        const updated = { ...user, profile_completed: 1 }
        localStorage.setItem('anku_user', JSON.stringify(updated))
        setUser(updated as any, token)
      }
      toast.success('On continue sans compléter pour l’instant !')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-3"
          style={{ background: ANKU.greenPale }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: ANKU.greenDark }} />
            <h2 className="text-base font-bold text-gray-900">
              Complète ton profil
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/60 transition"
            title="Plus tard"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bannière couverture */}
        <div className="relative">
          <div className="h-32 sm:h-40 bg-gradient-to-br from-emerald-100 to-emerald-50">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={40} className="text-emerald-300" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-bold hover:bg-black/80 transition disabled:opacity-50"
          >
            {uploadingCover ? (
              <Loader size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
            {coverUrl ? 'Changer' : 'Ajouter'} une couverture
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Avatar */}
        <div className="px-5 relative -mt-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white bg-gray-100 shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: ANKU.greenDark }}
                >
                  {(user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center shadow-md hover:scale-105 transition disabled:opacity-50"
              style={{ borderColor: ANKU.green, color: ANKU.greenDark }}
            >
              {uploadingAvatar ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="p-5 space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-gray-700">
              Bio <span className="font-normal text-gray-400">(optionnel)</span>
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Parle un peu de toi…"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition resize-none"
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block text-right">
              {bio.length}/500
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping || saving}
            className="rounded-full px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
          >
            {skipping ? 'Passage…' : 'Passer pour le moment'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || skipping}
            className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            style={{ background: ANKU.green }}
          >
            {saving ? <Loader size={14} className="animate-spin" /> : null}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}