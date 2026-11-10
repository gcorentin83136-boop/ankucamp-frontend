import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader, Type, Smile, Globe, Users, Lock, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import uploadsApi from '../../service/api/uploads.api'
import storiesApi from '../../service/api/stories.api'
import postsApi from '../../service/api/posts.api'

const ANKU_EMOJIS = ['🌱', '🌿', '🍀', '🌳', '🌻', '🌺', '🍎', '🍇', '🥕', '🍞', '🐝', '🦋', '☀️', '🌙', '🌍', '💚']
const FONTS = ['font-sans', 'font-serif', 'font-mono', 'font-bold', 'font-black']
const BG_COLORS = ['bg-transparent', 'bg-black/60', 'bg-white', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-400']
const TEXT_COLORS = ['text-white', 'text-black', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-yellow-400']

type StoryElement = {
  id: string
  type: 'text' | 'emoji'
  content: string
  x: number
  y: number
  font?: string
  bgColor?: string
  textColor?: string
}

export default function CreateStoryModal({ onClose }: { onClose: () => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public')
  const [shareToFeed, setShareToFeed] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [elements, setElements] = useState<StoryElement[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<'text' | 'emoji' | 'visibility' | null>(null)
  
  const [textInput, setTextInput] = useState('')
  const [selectedFont, setSelectedFont] = useState(FONTS[0])
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[1])
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0])

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
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const file = new File([blob], 'story-video.webm', { type: 'video/webm' })
      if (stream) stream.getTracks().forEach(t => t.stop())
      await handleUpload(file, 'video')
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
    } catch { toast.error("Erreur d'upload") } finally { setUploading(false) }
  }

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    setDraggingId(id)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100))
    setElements(prev => prev.map(el => el.id === draggingId ? { ...el, x, y } : el))
  }

  const addElement = (type: 'text' | 'emoji', content: string) => {
    if (!content.trim()) return
    const newElement: StoryElement = { id: Date.now().toString(), type, content, x: 50, y: 50 }
    if (type === 'text') {
      newElement.font = selectedFont
      newElement.bgColor = selectedBg
      newElement.textColor = selectedTextColor
    }
    setElements([...elements, newElement])
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
        caption: '', 
        visibility,
        type: 'story',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
        elements: JSON.stringify(elements),
      })

      if (shareToFeed) {
        try {
          await postsApi.create({
            content: "J'ai publié une nouvelle Story ! 🌿",
            media_urls: [mediaUrl],
            visibility: 'public'
          })
          toast.success("Story publiée et partagée sur le feed !")
        } catch (err) {
          console.error("Erreur partage feed:", err)
          toast.error("Story publiée, mais erreur de partage sur le feed.")
        }
      } else {
        toast.success("Story publiée !")
      }
      onClose()
    } catch { toast.error("Erreur de publication") } finally { setUploading(false) }
  }

  const isToolOpen = activeTool === 'text' || activeTool === 'emoji'

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col sm:items-center sm:justify-center">
      <div 
        className="w-full h-full sm:h-[90vh] sm:max-h-[850px] sm:w-[420px] bg-gray-900 sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingId(null)}
        onPointerLeave={() => setDraggingId(null)}
        style={{ touchAction: 'none' }}
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

        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 pointer-events-none">
          <button onClick={onClose} className="text-white bg-black/30 backdrop-blur-md p-2.5 rounded-full hover:bg-black/50 transition pointer-events-auto"><X size={20} /></button>
          <span className="text-white font-bold text-sm bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full">Nouvelle Story</span>
          <div className="w-10" />
        </div>

        {mediaUrl && elements.map(el => (
          <div
            key={el.id}
            onPointerDown={(e) => handlePointerDown(e, el.id)}
            style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
            className={`absolute cursor-move select-none z-40 drop-shadow-xl ${
              el.type === 'text' 
                ? `${el.bgColor || 'bg-black/60'} ${el.textColor || 'text-white'} ${el.font || 'font-bold'} backdrop-blur-md px-4 py-2 rounded-xl text-xl border border-white/20` 
                : 'text-5xl'
            }`}
          >
            {el.content}
          </div>
        ))}

        {/* OUTILS (Texte / Emoji) */}
        {activeTool === 'text' && (
          <div className="absolute bottom-0 inset-x-0 z-50 bg-[#1a1a1a] p-5 rounded-t-3xl border-t border-gray-800 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <span className="text-white font-bold">Ajouter du texte</span>
              <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-white p-2"><X size={20}/></button>
            </div>
            
            <input
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Écris quelque chose..."
              className={`w-full bg-[#2a2a2a] text-white text-center text-xl outline-none mb-5 p-4 rounded-xl border border-gray-700 shrink-0 ${selectedTextColor} ${selectedFont}`}
              onKeyDown={e => e.key === 'Enter' && addElement('text', textInput)}
            />
            
            <div className="space-y-4 mb-6 overflow-y-auto flex-1 scrollbar-hide px-1">
              <div>
                <p className="text-xs text-gray-400 mb-2">Police</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {FONTS.map(f => (
                    <button key={f} onClick={() => setSelectedFont(f)} className={`min-w-[50px] h-10 rounded-lg flex items-center justify-center border border-gray-700 ${selectedFont === f ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white'} ${f}`}>Aa</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Couleur</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {TEXT_COLORS.map(c => (
                    <button key={c} onClick={() => setSelectedTextColor(c)} className={`shrink-0 w-9 h-9 rounded-full border-2 ${c} ${selectedTextColor === c ? 'border-blue-500 scale-110' : 'border-gray-600'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Fond</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {BG_COLORS.map(bg => (
                    <button key={bg} onClick={() => setSelectedBg(bg)} className={`shrink-0 w-9 h-9 rounded-full border-2 ${bg === 'bg-transparent' ? 'bg-[#2a2a2a]' : bg} ${selectedBg === bg ? 'border-blue-500 scale-110' : 'border-gray-600'}`} />
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => addElement('text', textInput)} className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition shrink-0">
              Ajouter le texte
            </button>
          </div>
        )}

        {activeTool === 'emoji' && (
          <div className="absolute bottom-0 inset-x-0 z-50 bg-[#1a1a1a] p-5 rounded-t-3xl border-t border-gray-800 max-h-[60vh] flex flex-col">
             <div className="flex justify-between items-center mb-4 shrink-0">
              <span className="text-white font-bold">Emojis</span>
              <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-white p-2"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-5 gap-3 overflow-y-auto pb-4 scrollbar-hide">
              {ANKU_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => addElement('emoji', emoji)} className="text-3xl hover:scale-125 transition-transform p-2 bg-[#2a2a2a] rounded-xl flex items-center justify-center aspect-square">{emoji}</button>
              ))}
            </div>
          </div>
        )}

        {/* MENU VISIBILITÉ */}
        {activeTool === 'visibility' && (
          <div className="absolute top-16 right-4 z-50 bg-white rounded-xl shadow-xl overflow-hidden w-48">
            <button onClick={() => { setVisibility('public'); setActiveTool(null); }} className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${visibility === 'public' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}><Globe size={16}/> Public</button>
            <button onClick={() => { setVisibility('friends'); setActiveTool(null); }} className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${visibility === 'friends' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}><Users size={16}/> Amis</button>
            <button onClick={() => { setVisibility('private'); setActiveTool(null); }} className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${visibility === 'private' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}><Lock size={16}/> Privé</button>
          </div>
        )}

        {/* BARRE DU BAS */}
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

        {mediaUrl && !isToolOpen && (
          <div className="absolute bottom-0 inset-x-0 z-40">
            <div className="flex justify-around items-center px-4 mb-4">
              <button onClick={() => setActiveTool('text')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                <Type size={20} />
              </button>
              <button onClick={() => setActiveTool('emoji')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                <Smile size={20} />
              </button>
              <button onClick={() => setActiveTool('visibility')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                {visibility === 'public' ? <Globe size={20} /> : visibility === 'friends' ? <Users size={20} /> : <Lock size={20} />}
              </button>
            </div>

            <div className="bg-black/60 backdrop-blur-xl p-4 pb-6 rounded-t-3xl border-t border-white/10 flex items-center gap-3">
              <button onClick={() => { setMediaUrl(null); setElements([]); }} className="w-12 h-12 flex items-center justify-center bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition">
                <X size={20} />
              </button>
              
              <label className="flex-1 flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                <input type="checkbox" checked={shareToFeed} onChange={e => setShareToFeed(e.target.checked)} className="w-5 h-5 accent-blue-500 rounded" />
                <span className="text-sm text-white font-medium">Publier sur mon Feed</span>
              </label>

              <button onClick={handlePublish} disabled={uploading} className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-lg">
                {uploading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        )}

        {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[100]"><Loader className="animate-spin text-blue-500" size={50} /></div>}
      </div>
    </div>
  )
}