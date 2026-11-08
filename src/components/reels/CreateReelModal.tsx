import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader, Video, Type, Smile, Music, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import uploadsApi from '../../service/api/uploads.api'
import reelsApi from '../../service/api/reels.api'
import postsApi from '../../service/api/posts.api' // 🆕
import { useAuthStore } from '../../context/AuthContext'

type Sticker = { id: string, type: 'text' | 'emoji', content: string, x: number, y: number }

export default function CreateReelModal({ 
  onClose, 
  sharedPost, 
  initialMode = 'camera' 
}: { 
  onClose: () => void, 
  sharedPost?: any, 
  initialMode?: 'camera' | 'upload' 
}) {
  const auth = useAuthStore()
  const user = (auth as any)?.user

  const [mode, setMode] = useState<'camera' | 'upload'>(initialMode)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video')
  const [caption, setCaption] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [shareToFeed, setShareToFeed] = useState(true) // 🆕 Option de partage

  // 🆕 Éditeur Stickers
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mode === 'camera' && !mediaUrl) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
        .then((s) => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s })
        .catch(() => { toast.error("Caméra inaccessible."); setMode('upload') })
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [mode, mediaUrl])

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      await handleUpload(new File([blob], 'live.webm', { type: 'video/webm' }), 'video')
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const takePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      if (blob) await handleUpload(new File([blob], 'photo.jpg', { type: 'image/jpeg' }), 'image')
    }, 'image/jpeg')
  }

  const handleUpload = async (file: File, type: 'video' | 'image') => {
    setUploading(true)
    try {
      const res = type === 'video' ? await uploadsApi.uploadPostVideo(file) : await uploadsApi.uploadPostMedia(file)
      setMediaUrl(res.url)
      setMediaType(type)
      if (stream) stream.getTracks().forEach(t => t.stop())
    } catch { toast.error("Erreur upload") } finally { setUploading(false) }
  }

  // 🆕 Gestion des Stickers (Texte / Emoji)
  const addSticker = (type: 'text' | 'emoji') => {
    if (type === 'text') {
      const text = prompt("Quel texte veux-tu ajouter ?")
      if (text) setStickers([...stickers, { id: Date.now().toString(), type, content: text, x: 50, y: 50 }])
    } else {
      const emojis = ['🔥', '🌿', '❤️', '😂', '😮', '👏', '🥰', '🎉']
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]
      setStickers([...stickers, { id: Date.now().toString(), type, content: emoji, x: 40, y: 40 }])
    }
  }

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    setDraggingId(id)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setStickers(stickers.map(s => s.id === draggingId ? { ...s, x, y } : s))
  }

  const handlePublish = async () => {
    if (!mediaUrl) return toast.error("Ajoute un média")
    setPublishing(true)
    try {
      const reelRes = await reelsApi.create({
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        shared_post_id: sharedPost?.id || null,
        stickers_json: JSON.stringify(stickers)
      })

      // 🆕 Partage automatique sur le feed si coché
      if (shareToFeed) {
        await postsApi.shareReel(reelRes.reel.id, {
          share_comment: caption || 'Regardez mon Anku Live !',
          visibility: 'public'
        })
      }
      
      toast.success("Anku Live publié ! 🎉")
      onClose()
    } catch { toast.error("Erreur de publication") } finally { setPublishing(false) }
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col sm:items-center sm:justify-center">
      <div 
        className="w-full h-full sm:h-[80vh] sm:max-h-[800px] sm:w-[400px] bg-black sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingId(null)}
      >
        
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full"><X size={24} /></button>
          <span className="text-white font-bold text-sm">Créer un Anku Live</span>
          <div className="w-10" />
        </div>

        {/* Zone Média & Éditeur */}
        <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video src={mediaUrl} controls autoPlay loop className="w-full h-full object-contain" />
            ) : (
              <img src={mediaUrl} className="w-full h-full object-contain" />
            )
          ) : mode === 'camera' ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" style={{ transform: 'scaleX(-1)' }} />
          ) : (
            <div className="text-center p-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4"><Upload size={32} className="text-blue-500" /></div>
              <p className="text-gray-300 text-sm mb-6">Sélectionne une photo ou une vidéo</p>
              <label className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold cursor-pointer hover:bg-blue-600">
                Parcourir
                <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file, file.type.startsWith('video') ? 'video' : 'image')
                }} />
              </label>
            </div>
          )}

          {/* 🆕 AFFICHAGE DES STICKERS */}
          {mediaUrl && stickers.map(s => (
            <div
              key={s.id}
              onPointerDown={(e) => handlePointerDown(e, s.id)}
              style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
              className={`absolute cursor-move select-none z-40 ${s.type === 'text' ? 'bg-black/50 text-white px-3 py-1 rounded-lg backdrop-blur-sm text-lg font-bold' : 'text-4xl'}`}
            >
              {s.content}
            </div>
          ))}
          
          {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"><Loader className="animate-spin text-blue-500" size={40} /></div>}
        </div>

        {/* Contrôles Caméra */}
        {!mediaUrl && mode === 'camera' && (
          <div className="absolute bottom-32 inset-x-0 flex justify-center items-center gap-10 z-20">
            <button onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${isRecording ? 'bg-red-500/80 scale-110' : 'bg-transparent'}`}>
              <div className={`bg-white ${isRecording ? 'w-8 h-8 rounded-md' : 'w-16 h-16 rounded-full'}`} />
            </button>
            {!isRecording && <button onClick={takePhoto} className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center"><Camera size={24} className="text-white" /></button>}
          </div>
        )}

        {/* Footer (Éditeur + Publier) */}
        {mediaUrl && (
          <div className="p-4 bg-black z-50 space-y-4 rounded-t-3xl border-t border-gray-800">
            {/* Barre d'outils Éditeur */}
            <div className="flex justify-around text-white pb-2 border-b border-gray-800">
              <button onClick={() => addSticker('text')} className="flex flex-col items-center gap-1 hover:text-blue-400"><Type size={20} /><span className="text-[10px]">Texte</span></button>
              <button onClick={() => addSticker('emoji')} className="flex flex-col items-center gap-1 hover:text-yellow-400"><Smile size={20} /><span className="text-[10px]">Emoji</span></button>
              <button className="flex flex-col items-center gap-1 hover:text-pink-400"><Music size={20} /><span className="text-[10px]">Musique</span></button>
              <button className="flex flex-col items-center gap-1 hover:text-emerald-400"><UserPlus size={20} /><span className="text-[10px]">Taguer</span></button>
            </div>

            <div className="flex items-center gap-3">
              {user?.avatar_url && <img src={user.avatar_url} className="w-10 h-10 rounded-full" />}
              <input 
                value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Ajouter une légende..." 
                className="flex-1 bg-transparent text-white px-2 py-2 outline-none text-sm"
              />
            </div>

            {/* 🆕 Option Partage Feed */}
            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
              <input type="checkbox" checked={shareToFeed} onChange={e => setShareToFeed(e.target.checked)} className="w-4 h-4 accent-blue-500 rounded" />
              Partager aussi sur mon Feed
            </label>

            <button onClick={handlePublish} disabled={publishing} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition flex justify-center items-center">
              {publishing ? <Loader className="animate-spin" size={20} /> : 'Publier le Live'}
            </button>
          </div>
        )}

        {/* Onglets bas */}
        {!mediaUrl && (
          <div className="p-4 bg-black flex justify-center gap-6 z-20 pb-8">
            <button onClick={() => setMode('camera')} className={`p-3 rounded-full ${mode === 'camera' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}><Video size={20}/></button>
            <button onClick={() => setMode('upload')} className={`p-3 rounded-full ${mode === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}><Upload size={20}/></button>
          </div>
        )}
      </div>
    </div>
  )
}