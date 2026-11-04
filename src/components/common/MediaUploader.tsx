import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Image as ImageIcon, Video, X, Loader, Plus } from 'lucide-react'
import uploadsApi from '../../service/api/uploads.api'

const MAX_IMAGES = 20
const MAX_VIDEOS = 1
const MAX_IMAGE_SIZE_MB = 5
const MAX_VIDEO_SIZE_MB = 100

export interface MediaItem {
  url: string
  type: 'image' | 'video'
}

type Variant = 'full' | 'preview' | 'buttons'

export default function MediaUploader({
  media,
  onChange,
  variant = 'full',
}: {
  media: MediaItem[]
  onChange: (next: MediaItem[]) => void
  variant?: Variant
}) {
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const imageCount = media.filter((m) => m.type === 'image').length
  const videoCount = media.filter((m) => m.type === 'video').length

  const canAddImage = imageCount < MAX_IMAGES
  const canAddVideo = videoCount < MAX_VIDEOS

  // 🆕 Accepte images ET vidéos
  const handleImagesSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const validImages: File[] = []
      const validVideos: File[] = []
      
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            toast.error(`${file.name} dépasse ${MAX_IMAGE_SIZE_MB} MB`)
            continue
          }
          validImages.push(file)
        } else if (file.type.startsWith('video/')) {
          if (videoCount + validVideos.length >= MAX_VIDEOS) {
            toast.error(`Maximum ${MAX_VIDEOS} vidéo par post`)
            continue
          }
          if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            toast.error(`${file.name} dépasse ${MAX_VIDEO_SIZE_MB} MB`)
            continue
          }
          validVideos.push(file)
        }
      }

      const newItems: MediaItem[] = []
      let failed = 0

      if (validImages.length > 0) {
        const results = await Promise.allSettled(
          validImages.map((file) => uploadsApi.uploadPostMedia(file))
        )
        for (const r of results) {
          if (r.status === 'fulfilled') newItems.push({ url: r.value.url, type: 'image' })
          else failed++
        }
      }

      if (validVideos.length > 0) {
        const results = await Promise.allSettled(
          validVideos.map((file) => uploadsApi.uploadPostVideo(file))
        )
        for (const r of results) {
          if (r.status === 'fulfilled') newItems.push({ url: r.value.url, type: 'video' })
          else failed++
        }
      }

      if (newItems.length > 0) {
        onChange([...media, ...newItems])
        if (failed > 0) toast.error(`${failed} fichier(s) n'ont pas pu être uploadés`)
        else toast.success(`${newItems.length} média(s) ajouté(s)`)
      } else if (failed > 0) {
        toast.error('Aucun média n\'a pu être uploadé')
      }
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Upload vidéo via le bouton dédié
  const handleVideoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!canAddVideo) {
      toast.error(`Maximum ${MAX_VIDEOS} vidéo par post`)
      return
    }
    if (!file.type.startsWith('video/')) {
      toast.error("Ce fichier n'est pas une vidéo")
      return
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`La vidéo dépasse ${MAX_VIDEO_SIZE_MB} MB`)
      return
    }

    setUploading(true)
    try {
      const res = await uploadsApi.uploadPostVideo(file)
      onChange([...media, { url: res.url, type: 'video' }])
      toast.success('Vidéo ajoutée ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur upload vidéo')
    } finally {
      setUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const removeMedia = (url: string) => {
    onChange(media.filter((m) => m.url !== url))
  }

  const showPreview = variant === 'full' || variant === 'preview'
  const showButtons = variant === 'full' || variant === 'buttons'

  const singleImageOnly = media.length === 1 && media[0].type === 'image'

  return (
    <div className="space-y-2">
      {/* Miniatures */}
      {showPreview && media.length > 0 && (
        <div
          className={
            singleImageOnly
              ? 'flex justify-center'
              : 'grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
          }
        >
          {media.map((m) => (
            <div
              key={m.url}
              className={
                'relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group ' +
                (singleImageOnly ? 'w-40' : 'w-full')
              }
            >
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={m.url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              )}
              <button
                type="button"
                onClick={() => removeMedia(m.url)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 hover:bg-red-500 text-white transition"
                title="Retirer"
              >
                <X size={12} />
              </button>
              {m.type === 'video' && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 text-white">
                  🎥
                </span>
              )}
            </div>
          ))}

          {!singleImageOnly && (canAddImage || canAddVideo) && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition disabled:opacity-50 w-full"
              title="Ajouter un média"
            >
              {uploading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  <span className="text-[10px] font-bold">
                    {media.length}/20
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Inputs cachés */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleImagesSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {/* Boutons d'action */}
      {showButtons && (canAddImage || canAddVideo) && (
        <div className="flex items-center gap-0.5">
          {canAddImage && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
              title="Ajouter des photos ou vidéos"
            >
              {uploading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <ImageIcon size={18} />
              )}
            </button>
          )}

          {canAddVideo && (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-50 transition disabled:opacity-50"
              title={`Ajouter une vidéo (max ${MAX_VIDEO_SIZE_MB} MB)`}
            >
              {uploading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Video size={18} />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}