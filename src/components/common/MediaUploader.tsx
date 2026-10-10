import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Image as ImageIcon, Video, X, Loader, Plus } from 'lucide-react'
import uploadsApi from '../../service/api/uploads.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const MAX_IMAGES = 20
const MAX_IMAGE_SIZE_MB = 10
const MAX_VIDEO_SIZE_MB = 50

export interface MediaItem {
  url: string
  type: 'image' | 'video'
}

export default function MediaUploader({
  media,
  onChange,
}: {
  media: MediaItem[]
  onChange: (next: MediaItem[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const hasImages = media.some((m) => m.type === 'image')
  const hasVideo = media.some((m) => m.type === 'video')

  // ----- Images -----
  const handleImagesSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (hasVideo) {
      toast.error('Retire la vidéo avant d\'ajouter des images')
      return
    }
    const currentCount = media.filter((m) => m.type === 'image').length
    if (currentCount + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images par post`)
      return
    }

    setUploading(true)
    const newItems: MediaItem[] = []
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} n'est pas une image`)
          continue
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} dépasse ${MAX_IMAGE_SIZE_MB} MB`)
          continue
        }
        try {
          const res = await uploadsApi.uploadPostMedia(file)
          newItems.push({ url: res.url, type: 'image' })
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message || `Erreur upload ${file.name}`
          )
        }
      }
      if (newItems.length > 0) {
        onChange([...media, ...newItems])
        toast.success(
          `${newItems.length} image${newItems.length > 1 ? 's' : ''} ajoutée${newItems.length > 1 ? 's' : ''}`
        )
      }
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // ----- Vidéo -----
  const handleVideoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (media.length > 0) {
      toast.error('Retire les images avant d\'ajouter une vidéo')
      return
    }
    if (!file.type.startsWith('video/')) {
      toast.error('Ce fichier n\'est pas une vidéo')
      return
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`La vidéo dépasse ${MAX_VIDEO_SIZE_MB} MB`)
      return
    }

    setUploading(true)
    try {
      const res = await uploadsApi.uploadPostVideo(file)
      onChange([{ url: res.url, type: 'video' }])
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

  return (
    <div className="space-y-2">
      {/* Miniatures */}
      {media.length > 0 && (
        <div
          className={
            'grid gap-2 ' +
            (media.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-2 sm:grid-cols-4')
          }
        >
          {media.map((m) => (
            <div
              key={m.url}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
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
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 text-white transition"
                title="Retirer"
              >
                <X size={12} />
              </button>
              {m.type === 'video' && (
                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 text-white">
                  🎥 Vidéo
                </span>
              )}
            </div>
          ))}

          {/* Bouton "+" si on peut encore ajouter des images */}
          {hasImages && media.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition disabled:opacity-50"
            >
              {uploading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  <span className="text-[10px] font-bold">
                    {media.length}/{MAX_IMAGES}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Input caché image */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImagesSelect}
        className="hidden"
      />
      {/* Input caché vidéo */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {/* Boutons d'action */}
      <div className="flex items-center gap-2 flex-wrap">
        {media.length === 0 && (
          <>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition border"
              style={{
                color: ANKU.greenDark,
                borderColor: `${ANKU.green}55`,
                background: '#ffffff',
              }}
            >
              {uploading ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                <ImageIcon size={12} />
              )}
              Photos (max {MAX_IMAGES})
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition border"
              style={{
                color: ANKU.greenDark,
                borderColor: `${ANKU.green}55`,
                background: '#ffffff',
              }}
            >
              {uploading ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                <Video size={12} />
              )}
              Vidéo (max {MAX_VIDEO_SIZE_MB} MB)
            </button>
          </>
        )}

        {hasVideo && media.length === 1 && (
          <p className="text-[10px] text-gray-500 italic">
            🎥 Vidéo seule (retire-la pour ajouter des images)
          </p>
        )}
      </div>
    </div>
  )
}