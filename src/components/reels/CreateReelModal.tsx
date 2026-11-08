import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import uploadsApi from '../../service/api/uploads.api'
import reelsApi from '../../service/api/reels.api'
import { useAuthStore } from '../../context/AuthContext'

export default function CreateReelModal({ onClose, sharedPost }: { onClose: () => void, sharedPost?: any }) {
  const auth = useAuthStore()
  const user = (auth as any)?.user

  const [mode, setMode] = useState<'camera' | 'upload'>('camera')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video')
  const [caption, setCaption] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Initialisation de la caméra
  useEffect(() => {
    if (mode === 'camera' && !mediaUrl) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
        .then((s) => {
          setStream(s)
          if (videoRef.current) videoRef.current.srcObject = s
        })
        .catch(() => {
          toast.error("Impossible d'accéder à la caméra. Vérifie les autorisations.")
          setMode('upload')
        })
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [mode, mediaUrl])

  // Caméra - Vidéo
  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const file = new File([blob], 'anku-live.webm', { type: 'video/webm' })
      await handleUpload(file, 'video')
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  // Caméra - Photo
  const takePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'anku-photo.jpg', { type: 'image/jpeg' })
      await handleUpload(file, 'image')
    }, 'image/jpeg')
  }

  // Upload
  const handleUpload = async (file: File, type: 'video' | 'image') => {
    setUploading(true)
    try {
      const res = type === 'video' 
        ? await uploadsApi.uploadPostVideo(file) 
        : await uploadsApi.uploadPostMedia(file)
      setMediaUrl(res.url)
      setMediaType(type)
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  // Publication
  const handlePublish = async () => {
    if (!mediaUrl) return toast.error("Ajoute un média d'abord")
    setPublishing(true)
    try {
      await reelsApi.create({
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        shared_post_id: sharedPost?.id || null
      })
      toast.success("Anku Live publié ! 🎉")
      onClose()
    } catch {
      toast.error("Erreur lors de la publication")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col sm:items-center sm:justify-center">
      <div className="w-full h-full sm:h-[80vh] sm:max-h-[800px] sm:w-[400px] bg-black sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition"><X size={24} /></button>
          <span className="text-white font-bold text-sm">Créer un Anku Live</span>
          <div className="w-10" />
        </div>

        {/* Zone Média */}
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
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <Upload size={32} className="text-emerald-500" />
              </div>
              <p className="text-gray-300 text-sm mb-6">Sélectionne une photo ou une vidéo depuis ton appareil</p>
              <label className="bg-emerald-500 text-white px-8 py-3 rounded-full font-bold cursor-pointer hover:bg-emerald-600 transition">
                Parcourir
                <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file, file.type.startsWith('video') ? 'video' : 'image')
                }} />
              </label>
            </div>
          )}
          
          {uploading && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center"><Loader className="animate-spin text-emerald-500 mb-2" size={40} /><p className="text-white text-sm font-bold">Upload en cours...</p></div>}
        </div>

        {/* Contrôles Caméra */}
        {!mediaUrl && mode === 'camera' && (
          <div className="absolute bottom-32 inset-x-0 flex justify-center items-center gap-10 z-10">
            <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${isRecording ? 'bg-red-500/80 scale-110' : 'bg-transparent'}`}>
              <div className={`bg-white transition-all ${isRecording ? 'w-8 h-8 rounded-md' : 'w-16 h-16 rounded-full'}`} />
            </button>
            {!isRecording && (
               <button onClick={takePhoto} className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center backdrop-blur-sm hover:bg-white/30">
                 <Camera size={24} className="text-white" />
               </button>
            )}
          </div>
        )}

        {/* Footer (Légende + Publier) */}
        {mediaUrl && (
          <div className="p-4 bg-black space-y-4">
            <div className="flex items-center gap-3">
              {user?.avatar_url && <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" />}
              <input 
                value={caption} 
                onChange={e => setCaption(e.target.value)}
                placeholder="Ajouter une légende..." 
                className="flex-1 bg-transparent text-white px-2 py-2 outline-none placeholder-gray-500 text-sm"
              />
            </div>
            <button onClick={handlePublish} disabled={publishing} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition flex justify-center items-center">
              {publishing ? <Loader className="animate-spin" size={20} /> : 'Publier le Live'}
            </button>
            <button onClick={() => { setMediaUrl(null); setMode('camera'); }} className="w-full text-gray-400 text-xs font-bold py-2 hover:text-white transition">
              Recommencer
            </button>
          </div>
        )}

        {/* Onglets */}
        {!mediaUrl && (
          <div className="p-4 bg-black flex justify-center gap-6 z-10 pb-8">
            <button onClick={() => setMode('camera')} className={`p-3 rounded-full transition ${mode === 'camera' ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'}`}><Video size={20}/></button>
            <button onClick={() => setMode('upload')} className={`p-3 rounded-full transition ${mode === 'upload' ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'}`}><Upload size={20}/></button>
          </div>
        )}
      </div>
    </div>
  )
}