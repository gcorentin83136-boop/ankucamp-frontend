import { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Mic, Play } from 'lucide-react'
import type { Message } from '../../types/message'

type TabType = 'images' | 'videos' | 'audio'

interface MediaItem {
  key: string
  messageId: number
  url: string
  type: 'image' | 'video' | 'audio'
  createdAt: string
}

interface Props {
  messages: Message[]
  onClose: () => void
}

export default function MediaArchive({ messages, onClose }: Props) {
  const [tab, setTab] = useState<TabType>('images')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const allItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = []
    for (const m of messages) {
      if (!m.media_url || m.deleted_at) continue

      if (m.type === 'image') {
        let urls: string[] = []
        try {
          const parsed = JSON.parse(m.media_url)
          if (Array.isArray(parsed)) urls = parsed.filter((u): u is string => typeof u === 'string')
          else urls = [m.media_url]
        } catch {
          urls = [m.media_url]
        }
        urls.forEach((url, i) => {
          items.push({ key: `${m.id}-img-${i}`, messageId: m.id, url, type: 'image', createdAt: m.created_at })
        })
      } else if (m.type === 'video') {
        items.push({ key: `${m.id}-vid`, messageId: m.id, url: m.media_url, type: 'video', createdAt: m.created_at })
      } else if (m.type === 'audio') {
        items.push({ key: `${m.id}-aud`, messageId: m.id, url: m.media_url, type: 'audio', createdAt: m.created_at })
      }
    }
    return items
  }, [messages])

  const images = useMemo(() => allItems.filter(i => i.type === 'image'), [allItems])
  const videos = useMemo(() => allItems.filter(i => i.type === 'video'), [allItems])
  const audios = useMemo(() => allItems.filter(i => i.type === 'audio'), [allItems])

  const currentItems = tab === 'images' ? images : tab === 'videos' ? videos : audios
  const currentItem = lightboxIndex !== null ? currentItems[lightboxIndex] : null

  useEffect(() => { setLightboxIndex(null) }, [tab])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null && i > 0 ? i - 1 : i)
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null && i < currentItems.length - 1 ? i + 1 : i)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, currentItems.length])

  const tabs = [
    { key: 'images' as const, label: 'Images', icon: ImageIcon, count: images.length },
    { key: 'videos' as const, label: 'Vidéos', icon: Video, count: videos.length },
    { key: 'audio' as const, label: 'Vocaux', icon: Mic, count: audios.length },
  ]

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl h-[85%] flex flex-col overflow-hidden shadow-2xl">
        <header className="p-3 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50 shrink-0">
          <h3 className="font-bold text-gray-900 text-sm">Archives des médias</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={18} />
          </button>
        </header>

        <div className="flex border-b border-emerald-100 bg-white/80 shrink-0">
          {tabs.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 px-1 flex items-center justify-center gap-1 text-xs font-medium transition border-b-2 ${
                  active
                    ? 'text-emerald-700 border-emerald-500 bg-emerald-50/50'
                    : 'text-gray-500 border-transparent hover:bg-gray-50'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-10">
              {tab === 'images' && <ImageIcon size={36} />}
              {tab === 'videos' && <Video size={36} />}
              {tab === 'audio' && <Mic size={36} />}
              <p className="text-xs">Aucun média dans cette catégorie.</p>
            </div>
          ) : tab !== 'audio' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
              {currentItems.map((item, idx) => (
                <button
                  key={item.key}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group hover:ring-2 hover:ring-emerald-400 transition"
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <>
                      <video src={`${item.url}#t=0.1`} className="w-full h-full object-cover" preload="metadata" muted />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition">
                        <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                          <Play size={12} className="text-emerald-700 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {currentItems.map((item, idx) => (
                <button
                  key={item.key}
                  onClick={() => setLightboxIndex(idx)}
                  className="flex items-center gap-2.5 p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                    <Play size={14} className="ml-0.5" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">Message vocal</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null) }}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
          >
            <X size={24} />
          </button>

          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-medium">
            {lightboxIndex + 1} / {currentItems.length}
          </div>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {lightboxIndex < currentItems.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              <ChevronRight size={22} />
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full flex items-center justify-center">
            {currentItem.type === 'image' && (
              <img src={currentItem.url} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            )}
            {currentItem.type === 'video' && (
              <video src={currentItem.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            )}
            {currentItem.type === 'audio' && (
              <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Mic size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Message vocal</p>
                    <p className="text-xs text-gray-500">{new Date(currentItem.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                <audio src={currentItem.url} controls autoPlay className="w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}