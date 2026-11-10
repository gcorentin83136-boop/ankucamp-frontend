import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader, Type, Smile, Music, UserPlus, Globe, Users, Lock, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import uploadsApi from '../../service/api/uploads.api'
import storiesApi from '../../service/api/stories.api'
import { useAuthStore } from '../../context/AuthContext'

const ANKU_EMOJIS = ['🌱', '🌿', '🍀', '🌳', '🌻', '🌺', '🍎', '🍇', '🥕', '🍞', '🐝', '🦋', '☀️', '🌙', '🌍', '💚']

type StoryElement = {
  id: string
  type: 'text' | 'emoji'
  content: string
  x: number
  y: number
}

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

  const [elements, setElements] = useState<StoryElement[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<'text' | 'emoji' | null>(null)
  const [textInput, setTextInput] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mediaUrl) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', aspectRatio: 9/16 }, audio: true })
        .then((s) => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s })
        .catch(() => { toast.error("Caméra inaccessible."); })
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    setDraggingId(id)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100))
    setElements(prev => prev.map(el => el.id === draggingId ? { ...el, x, y } : el))
  }

  const addElement = (type: 'text' | 'emoji', content: string) => {
    if (!content.trim()) return
    setElements([...elements, { id: Date.now().toString(), type, content, x: 50, y: 50 }])
    setActiveTool(null)
    setTextInput('')
  }

  const handlePublish = async () => {
    if (!mediaUrl) return toast.error("Ajoute un média d'abord")
    setUploading(true)
    try {
      await storiesApi.create({
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        visibility,
        type: 'story',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
        elements: JSON.stringify(elements),
      })
      toast.success("Story publiée !")
      onClose()
    } catch { toast.error("Erreur de publication") } finally { setUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col sm:items-center sm:justify-center">
      <div 
        className="w-full h-full sm:h-[90vh] sm:max-h-[850px] sm:w-[420px] bg-gray-900 sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingId(null)}
        onPointerLeave={() => setDraggingId(null)}
      >
        <div className="absolute inset-0 z-0">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video src={mediaUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} className="w-full h-full object-cover" />
            )
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" style={{ transform: 'scaleX(-1)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        </div>

        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50">
          <button onClick={onClose} className="text-white bg-black/30 backdrop-blur-md p-2.5 rounded-full hover:bg-black/50 transition"><X size={20} /></button>
          <span className="text-white font-bold text-sm bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full">Nouvelle Story</span>
          <div className="w-10" />
        </div>

        {mediaUrl && elements.map(el => (
          <div
            key={el.id}
            onPointerDown={(e) => handlePointerDown(e, el.id)}
            style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`absolute cursor-move select-none z-40 drop-shadow-xl ${
              el.type === 'text' 
                ? 'bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xl font-bold border border-white/20' 
                : 'text-5xl'
            }`}
          >
            {el.content}
          </div>
        ))}

        {activeTool === 'text' && (
          <div className="absolute inset-x-4 bottom-32 z-50 bg-black/80 backdrop-blur-xl p-4 rounded-2xl">
            <input
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Écris quelque chose..."
              className="w-full bg-transparent text-white text-center text-xl font-bold outline-none mb-4"
              onKeyDown={e => e.key === 'Enter' && addElement('text', textInput)}
            />
            <div className="flex justify-center">
              <button onClick={() => addElement('text', textInput)} className="bg-white text-black px-6 py-2 rounded-full font-bold">Valider</button>
            </div>
          </div>
        )}

        {activeTool === 'emoji' && (
          <div className="absolute inset-x-4 bottom-32 z-50 bg-black/80 backdrop-blur-xl p-4 rounded-2xl">
            <div className="grid grid-cols-8 gap-2">
              {ANKU_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => addElement('emoji', emoji)} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
              ))}
            </div>
            <button onClick={() => setActiveTool(null)} className="w-full mt-3 text-gray-400 text-xs font-bold">Fermer</button>
          </div>
        )}

        {!mediaUrl && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center items-center gap-8 z-20">
            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition">
              <Upload size={20} className="text-white" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,image/*" className="hidden" />

            <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-xl ${isRecording ? 'bg-red-500/80 scale-110' : 'bg-transparent'}`}>
              <div className={`bg-white transition-all ${isRecording ? 'w-8 h-8 rounded-md' : 'w-16 h-16 rounded-full'}`} />
            </button>

            <button onClick={takePhoto} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition">
              <Camera size={20} className="text-white" />
            </button>
          </div>
        )}

        {mediaUrl && (
          <div className="absolute bottom-0 inset-x-0 z-50">
            <div className="flex justify-around items-center px-4 mb-4">
              <button onClick={() => setActiveTool('text')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                <Type size={20} />
              </button>
              <button onClick={() => setActiveTool('emoji')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                <Smile size={20} />
              </button>
              <button onClick={() => toast("Musique bientôt disponible !")} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                <Music size={20} />
              </button>
              <button onClick={() => toast("Tags bientôt disponibles !")} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                <UserPlus size={20} />
              </button>
            </div>

            <div className="bg-black/60 backdrop-blur-xl p-4 pb-6 rounded-t-3xl border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                {user?.avatar_url && <img src={user.avatar_url} className="w-10 h-10 rounded-full border border-white/30" />}
                <input 
                  value={caption} 
                  onChange={e => setCaption(e.target.value)} 
                  placeholder="Ajouter une légende..." 
                  className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-gray-300 border border-white/10 focus:border-white/30 transition" 
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-300 font-bold uppercase tracking-wider">Visibilité</span>
                  <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                    <button onClick={() => setVisibility('public')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${visibility === 'public' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Globe size={12}/> Public</button>
                    <button onClick={() => setVisibility('friends')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${visibility === 'friends' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Users size={12}/> Amis</button>
                    <button onClick={() => setVisibility('private')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${visibility === 'private' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Lock size={12}/> Privé</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setMediaUrl(null); setElements([]); }} className="w-14 flex items-center justify-center bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition">
                  <X size={20} />
                </button>
                <button onClick={handlePublish} disabled={uploading} className="flex-1 bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition flex justify-center items-center gap-2 shadow-lg">
                  {uploading ? <Loader className="animate-spin" size={20} /> : <><Send size={18} /> Publier la Story</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[100]"><Loader className="animate-spin text-blue-500" size={50} /></div>}
      </div>
    </div>
  )
}