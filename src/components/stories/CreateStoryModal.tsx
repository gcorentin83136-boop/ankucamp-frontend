import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader, Video, Type, Smile, Music, UserPlus, Globe, Users, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import uploadsApi from '../../service/api/uploads.api'
import storiesApi from '../../service/api/stories.api'
import { useAuthStore } from '../../context/AuthContext'

export default function CreateStoryModal({ onClose }: { onClose: () => void }) {
  const auth = useAuthStore()
  const user = (auth as any)?.user

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video')
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public')
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!mediaUrl) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', aspectRatio: 9/16 }, audio: true })
        .then((s) => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s })
        .catch(() => { toast.error("Caméra inaccessible. Utilise le bouton Télécharger.") })
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [mediaUrl])

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      await handleUpload(new File([blob], 'story-video.webm', { type: 'video/webm' }), 'video')
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file, file.type.startsWith('video') ? 'video' : 'image')
  }

  const handleUpload = async (file: File, type: 'video' | 'image') => {
    setUploading(true)
    try {
      const res = type === 'video' ? await uploadsApi.uploadPostVideo(file) : await uploadsApi.uploadPostMedia(file)
      setMediaUrl(res.url)
      setMediaType(type)
      if (stream) stream.getTracks().forEach(t => t.stop())
    } catch { toast.error("Erreur d'upload") } finally { setUploading(false) }
  }

  const handlePublish = async () => {
    if (!mediaUrl) return toast.error("Ajoute un média d'abord")
    setUploading(true)
    try {
      await storiesApi.create({
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        visibility, // 🆕 On envoie la visibilité
        type: 'story',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      toast.success("Story publiée !")
      onClose()
    } catch { toast.error("Erreur de publication") } finally { setUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col sm:items-center sm:justify-center">
      <div className="w-full h-full sm:h-[85vh] sm:max-h-[800px] sm:w-[400px] bg-black sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full"><X size={24} /></button>
          <span className="text-white font-bold text-sm">Nouvelle Story</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video src={mediaUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} className="w-full h-full object-cover" />
            )
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" style={{ transform: 'scaleX(-1)' }} />
          )}
          {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"><Loader className="animate-spin text-blue-500" size={40} /></div>}
        </div>

        {!mediaUrl && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center items-center gap-8 z-20">
            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/50 flex items-center justify-center hover:bg-white/30 transition shadow-lg">
              <Upload size={24} className="text-white" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,image/*" className="hidden" />

            <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-xl ${isRecording ? 'bg-red-500/80 scale-110' : 'bg-transparent'}`}>
              <div className={`bg-white transition-all ${isRecording ? 'w-8 h-8 rounded-md' : 'w-16 h-16 rounded-full'}`} />
            </button>

            <button onClick={takePhoto} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/50 flex items-center justify-center hover:bg-white/30 transition shadow-lg">
              <Camera size={24} className="text-white" />
            </button>
          </div>
        )}

        {mediaUrl && (
          <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-50 space-y-4 rounded-t-3xl">
            <div className="flex justify-around text-white pb-2 border-b border-gray-700">
              <button onClick={() => toast("Bientôt !")} className="flex flex-col items-center gap-1 hover:text-blue-400"><Type size={20} /><span className="text-[10px]">Texte</span></button>
              <button onClick={() => toast("Bientôt !")} className="flex flex-col items-center gap-1 hover:text-yellow-400"><Smile size={20} /><span className="text-[10px]">Emoji</span></button>
              <button onClick={() => toast("Bientôt !")} className="flex flex-col items-center gap-1 hover:text-pink-400"><Music size={20} /><span className="text-[10px]">Musique</span></button>
              <button onClick={() => toast("Bientôt !")} className="flex flex-col items-center gap-1 hover:text-emerald-400"><UserPlus size={20} /><span className="text-[10px]">Taguer</span></button>
            </div>
            
            <div className="flex items-center gap-3">
              {user?.avatar_url && <img src={user.avatar_url} className="w-10 h-10 rounded-full" />}
              <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Ajouter une légende..." className="flex-1 bg-transparent text-white px-2 py-2 outline-none text-sm placeholder-gray-400" />
            </div>

            {/* 🆕 CHOIX DE LA VISIBILITÉ */}
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs text-gray-400 font-bold">Qui peut voir ?</span>
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button onClick={() => setVisibility('public')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${visibility === 'public' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}><Globe size={12}/> Public</button>
                <button onClick={() => setVisibility('friends')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${visibility === 'friends' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}><Users size={12}/> Amis</button>
                <button onClick={() => setVisibility('private')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${visibility === 'private' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}><Lock size={12}/> Privé</button>
              </div>
            </div>

            <button onClick={handlePublish} disabled={uploading} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition flex justify-center items-center">
              {uploading ? <Loader className="animate-spin" size={20} /> : `Publier la Story`}
            </button>
            <button onClick={() => setMediaUrl(null)} className="w-full text-gray-400 text-xs font-bold py-2 hover:text-white transition">Recommencer</button>
          </div>
        )}
      </div>
    </div>
  )
}