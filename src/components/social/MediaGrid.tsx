import { Play } from 'lucide-react'

function isVideoUrl(url: string): boolean {
  return (
    url.includes('/video/') ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov')
  )
}

export default function MediaGrid({
  media,
  onOpenLightbox,
  maxVisible = 4,
}: {
  media: string[]
  onOpenLightbox: (index: number) => void
  maxVisible?: number
}) {
  if (media.length === 0) return null

  const totalImages = media.filter((u) => !isVideoUrl(u))
  const hasMore = media.length > maxVisible
  const visible = media.slice(0, maxVisible)
  const remaining = media.length - maxVisible

  // 1 seul média : plein
  if (media.length === 1) {
    const url = media[0]
    if (isVideoUrl(url)) {
      return (
        <div className="px-4 pb-3">
          <video
            src={url}
            className="w-full rounded-xl bg-black max-h-[500px] object-contain"
            controls
            preload="metadata"
          />
        </div>
      )
    }
    return (
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => onOpenLightbox(0)}
          className="w-full rounded-xl overflow-hidden cursor-zoom-in"
        >
          <img
            src={url}
            alt=""
            className="w-full max-h-[500px] object-cover hover:opacity-95 transition"
            loading="lazy"
          />
        </button>
      </div>
    )
  }

  // 2+ médias : grille 2 cols
  return (
    <div className="px-4 pb-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {visible.map((url, i) => {
          const isLast = i === maxVisible - 1 && hasMore
          const isVideo = isVideoUrl(url)
          const imageIdx = isVideo ? -1 : totalImages.indexOf(url)
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (isVideo) {
                  onOpenLightbox(i)
                } else {
                  onOpenLightbox(imageIdx >= 0 ? imageIdx : i)
                }
              }}
              className="relative w-full aspect-square overflow-hidden bg-gray-100"
            >
              {isVideo ? (
                <>
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play
                      size={32}
                      fill="#ffffff"
                      className="text-white"
                      strokeWidth={0}
                    />
                  </div>
                </>
              ) : (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover hover:opacity-95 transition"
                  loading="lazy"
                />
              )}

              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <span className="text-white font-extrabold text-2xl">
                    +{remaining}
                  </span>
                  <span className="text-white/80 text-[10px] font-bold mt-0.5">
                    Voir plus
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}