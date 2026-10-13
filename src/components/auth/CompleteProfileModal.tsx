import { useRef, useState } from 'react'
import {
  X,
  Camera,
  Image as ImageIcon,
  Loader,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../context/AuthContext'
import usersApi from '../../service/api/users.api'
import uploadsApi from '../../service/api/uploads.api'
import EmojiPicker from '../common/EmojiPicker'

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
      console.error('Cover upload error:', err?.response?.data)
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Erreur d'upload de la couverture"
      )
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

  const bioRemaining = 500 - bio.length
  const bioIsLong = bio.length > 0 && bioRemaining < 100

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden max-h-[92vh] overflow-y-auto ring-1 ring-black/5">
        {/* Header */}
        <div
          className="relative px-5 py-4 flex items-center justify-between gap-3"
          style={{
            background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                Complète ton profil
              </h2>
              <p className="text-[11px] text-gray-500">
                Un profil complet inspire confiance 🌿
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/80 transition"
            title="Plus tard"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bannière couverture (clic = upload) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="relative block w-full h-36 sm:h-44 group cursor-pointer overflow-hidden"
            title="Cliquer pour uploader une couverture"
          >
            {coverUrl ? (
              <>
                <img
                  src={coverUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1.5 rounded-full bg-white/95 text-gray-800 px-3 py-1.5 text-xs font-bold shadow-lg">
                    {uploadingCover ? (
                      <Loader size={12} className="animate-spin" />
                    ) : (
                      <Camera size={12} />
                    )}
                    Changer
                  </div>
                </div>
              </>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-1.5 transition"
                style={{
                  background: `linear-gradient(135deg, #e6f5d8 0%, #c8e6a8 50%, #a9d581 100%)`,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur flex items-center justify-center shadow-sm">
                  {uploadingCover ? (
                    <Loader size={20} className="animate-spin text-emerald-700" />
                  ) : (
                    <ImageIcon size={20} className="text-emerald-700" />
                  )}
                </div>
                <p className="text-xs font-bold text-emerald-800">
                  {uploadingCover ? 'Upload…' : 'Ajouter une photo de couverture'}
                </p>
                <p className="text-[10px] text-emerald-700/70">
                  JPG, PNG · max 10 Mo
                </p>
              </div>
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Avatar flottant */}
        <div className="px-6 relative -mt-14 mb-2">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-[5px] ring-white bg-gray-100 shadow-xl">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
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
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white border-[3px] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition disabled:opacity-50"
              style={{ borderColor: ANKU.green, color: ANKU.greenDark }}
              title="Changer la photo de profil"
            >
              {uploadingAvatar ? (
                <Loader size={15} className="animate-spin" />
              ) : (
                <Camera size={15} />
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
        <div className="px-6 pt-2 pb-2">
          <label className="block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-gray-800">
                Bio{' '}
                <span className="text-[11px] font-medium text-gray-400">
                  (optionnel)
                </span>
              </span>
              {bioIsLong && (
                <span
                  className={
                    'text-[10px] font-bold ' +
                    (bioRemaining < 0 ? 'text-red-500' : 'text-amber-600')
                  }
                >
                  {bioRemaining} caractères restants
                </span>
              )}
            </div>

            <div className="relative rounded-2xl border-2 border-gray-100 bg-gray-50/70 focus-within:border-emerald-300 focus-within:bg-white transition overflow-hidden">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Parle un peu de toi, ce que tu aimes, ton activité…"
                className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <EmojiPicker
                  align="left"
                  onSelect={(emoji) => setBio((b) => b + emoji)}
                />
              </div>
              <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 font-semibold">
                {bio.length}/500
              </span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="px-6 pt-2 pb-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end items-stretch sm:items-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping || saving}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition disabled:opacity-50"
          >
            {skipping ? 'Passage…' : 'Passer pour le moment'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || skipping}
            className="rounded-full px-7 py-2.5 text-sm font-extrabold text-white transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 duration-200"
            style={{
              background: `linear-gradient(135deg, ${ANKU.green} 0%, ${ANKU.greenDark} 100%)`,
            }}
          >
            {saving ? <Loader size={14} className="animate-spin" /> : null}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}