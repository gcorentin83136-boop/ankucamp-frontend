import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader, Type, Smile, Globe, Users, Lock, Send, Film, Music, Play, Pause } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react' // 👈 Nouvel import propre
import toast from 'react-hot-toast'
import uploadsApi from '../../service/api/uploads.api'
import storiesApi from '../../service/api/stories.api'

const FONTS = ['font-sans', 'font-serif', 'font-mono', 'font-bold', 'font-black']

const TEXT_COLORS = [
  { name: 'white', hex: '#FFFFFF', class: 'text-white' },
  { name: 'black', hex: '#000000', class: 'text-black' },
  { name: 'blue', hex: '#3B82F6', class: 'text-blue-500' },
  { name: 'green', hex: '#10B981', class: 'text-emerald-500' },
  { name: 'red', hex: '#EF4444', class: 'text-red-500' },
  { name: 'yellow', hex: '#FACC15', class: 'text-yellow-400' }
]

const BG_COLORS = [
  { name: 'transparent', hex: 'transparent', class: 'bg-transparent border-gray-500' },
  { name: 'black', hex: 'rgba(0,0,0,0.6)', class: 'bg-black/60' },
  { name: 'white', hex: '#FFFFFF', class: 'bg-white' },
  { name: 'blue', hex: '#3B82F6', class: 'bg-blue-500' },
  { name: 'green', hex: '#10B981', class: 'bg-emerald-500' },
  { name: 'red', hex: '#EF4444', class: 'bg-red-500' }
]

const MOCK_TRACKS = [
  { id: '1', title: 'Chill Vibes (Lo-Fi)', artist: 'Free Music', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Upbeat Pop', artist: 'Free Music', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Cinematic Sunset', artist: 'Free Music', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
]

type StoryElement = {
  id: string
  type: 'text' | 'emoji'
  content: string
  x: number
  y: number
  scale?: number
  font?: string
  bgColor?: string
  textColor?: string
}

export default function CreateStoryModal({ onClose }: { onClose: () => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public')
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [elements, setElements] = useState<StoryElement[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<'text' | 'emoji' | 'gif' | 'music' | 'visibility' | null>(null)

  const [textInput, setTextInput] = useState('')
  const [selectedFont, setSelectedFont] = useState(FONTS[0])
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[1])
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0])

  const [gifSearch, setGifSearch] = useState('')
  const [gifResults, setGifResults] = useState<any[]>([])
  const [searchingGif, setSearchingGif] = useState(false)

  const [selectedMusic, setSelectedMusic] = useState<{ title: string, artist: string, url: string } | null>(null)
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const resizeStartRef = useRef<{ startDist: number, startScale: number } | null>(null)

  const [videoKey, setVideoKey] = useState(0)

  useEffect(() => {
    if (!mediaUrl) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', aspectRatio: 9 / 16 }, audio: true })
        .then((s) => {
          setStream(s)
          if (videoRef.current) videoRef.current.srcObject = s
        })
        .catch(() => { toast.error('Caméra inaccessible.') })
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [mediaUrl])

  useEffect(() => {
    if (activeTool === 'gif' && gifResults.length === 0) {
      fetchTrendingStickers()
    }
  }, [activeTool])

  useEffect(() => {
    if (playingPreview) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = playingPreview;
        audioPreviewRef.current.play();
      }
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    }
  }, [playingPreview])

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    let options: MediaRecorderOptions = { mimeType: 'video/mp4' }
    if (!MediaRecorder.isTypeSupported('video/mp4')) {
      options = { mimeType: 'video/webm;codecs=vp9' }
    }
    const recorder = new MediaRecorder(stream, options)
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      const ext = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `story-${Date.now()}.${ext}`, { type: recorder.mimeType })
      if (stream) stream.getTracks().forEach(t => t.stop())
      await handleUpload(file, 'video')
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
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
      setVideoKey(prev => prev + 1)
    } catch (err) {
      console.error("❌ Erreur d'upload:", err)
      toast.error("Erreur d'upload")
    } finally {
      setUploading(false)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    if (resizingId && resizeStartRef.current) {
      const el = elements.find(item => item.id === resizingId)
      if (!el) return

      const elCenterX = rect.left + (el.x / 100) * rect.width
      const elCenterY = rect.top + (el.y / 100) * rect.height

      const currentDist = Math.hypot(e.clientX - elCenterX, e.clientY - elCenterY)
      const scaleFactor = currentDist / Math.max(resizeStartRef.current.startDist, 1)
      
      const newScale = Math.max(0.2, Math.min(5, resizeStartRef.current.startScale * scaleFactor))

      setElements(prev => prev.map(item => item.id === resizingId ? { ...item, scale: newScale } : item))
      return
    }

    if (draggingId) {
      const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100))
      setElements(prev => prev.map(el => el.id === draggingId ? { ...el, x, y } : el))
    }
  }

  const handlePointerUp = () => {
    setDraggingId(null)
    setResizingId(null)
    resizeStartRef.current = null
  }

  const handleContainerClick = (e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'VIDEO' || (e.target as HTMLElement).tagName === 'IMG') {
      setSelectedElementId(null)
    }
  }

  const handleResizeStart = (e: React.PointerEvent, el: StoryElement) => {
    e.stopPropagation()
    e.preventDefault()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const elCenterX = rect.left + (el.x / 100) * rect.width
    const elCenterY = rect.top + (el.y / 100) * rect.height
    const startDist = Math.hypot(e.clientX - elCenterX, e.clientY - elCenterY)
    setResizingId(el.id)
    resizeStartRef.current = { startDist, startScale: el.scale || 1 }
  }

  const addElement = (type: 'text' | 'emoji', content: string) => {
    if (!content.trim()) return
    const newElement: StoryElement = { id: Date.now().toString(), type, content, x: 50, y: 50, scale: 1 }
    if (type === 'text') {
      newElement.font = selectedFont
      newElement.bgColor = selectedBg.class
      newElement.textColor = selectedTextColor.class
    }
    setElements([...elements, newElement])
    setActiveTool(null)
    setTextInput('')
    setSelectedElementId(newElement.id)
  }

  const fetchTrendingStickers = async () => {
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY
    if (!apiKey) return
    setSearchingGif(true)
    try {
      const res = await fetch(`https://api.giphy.com/v1/stickers/trending?api_key=${apiKey}&limit=20&rating=g`)
      const json = await res.json()
      setGifResults(json.data || [])
    } catch (err) {
      console.error("Erreur tendances:", err)
    } finally {
      setSearchingGif(false)
    }
  }

  const searchGifs = async () => {
    if (!gifSearch.trim()) {
      fetchTrendingStickers()
      return
    }
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY
    if (!apiKey) {
      toast.error("Clé API Giphy manquante")
      return
    }
    setSearchingGif(true)
    try {
      const res = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=${apiKey}&q=${encodeURIComponent(gifSearch)}&limit=20&rating=g`)
      const json = await res.json()
      setGifResults(json.data || [])
    } catch (err) {
      console.error(err)
      toast.error("Erreur de recherche de stickers")
    } finally {
      setSearchingGif(false)
    }
  }

  const handleSelectMusic = (track: any) => {
    setSelectedMusic({ title: track.title, artist: track.artist, url: track.url })
    setPlayingPreview(null)
    setActiveTool(null)
  }

  const handleRemoveMusic = () => {
    setSelectedMusic(null)
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
        music: selectedMusic ? JSON.stringify(selectedMusic) : null,
      })
      toast.success("Story publiée !")
      onClose()
    } catch {
      toast.error("Erreur de publication")
    } finally {
      setUploading(false)
    }
  }

  const isToolOpen = activeTool === 'text' || activeTool === 'emoji' || activeTool === 'gif' || activeTool === 'music'

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col sm:items-center sm:justify-center">
      <audio ref={audioPreviewRef} onEnded={() => setPlayingPreview(null)} />

      <div
        className="w-full h-full sm:h-[90vh] sm:max-h-[850px] sm:w-[420px] bg-gray-900 sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerDown={handleContainerClick}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 z-0">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video key={videoKey} src={mediaUrl} controls autoPlay loop playsInline muted className="w-full h-full object-contain bg-black" />
            ) : (
              <img src={mediaUrl} className="w-full h-full object-cover" alt="Story media" />
            )
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        </div>

        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 pointer-events-none">
          <button onClick={onClose} className="text-white bg-black/30 backdrop-blur-md p-2.5 rounded-full hover:bg-black/50 transition pointer-events-auto">
            <X size={20} />
          </button>
          
          {selectedMusic ? (
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 pointer-events-auto">
              <Music size={14} className="text-blue-400 animate-pulse" />
              <span className="text-white text-xs font-bold truncate max-w-[120px]">{selectedMusic.title}</span>
              <button onClick={handleRemoveMusic} className="text-gray-400 hover:text-white ml-1"><X size={14} /></button>
            </div>
          ) : (
            <span className="text-white font-bold text-sm bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full">Nouvelle Story</span>
          )}
          
          <div className="w-10" />
        </div>

        {mediaUrl && elements.map(el => {
          const isSelected = selectedElementId === el.id;
          return (
            <div
              key={el.id}
              onPointerDown={(e) => { e.stopPropagation(); setDraggingId(el.id); setSelectedElementId(el.id); }}
              style={{ left: `${el.x}%`, top: `${el.y}%`, transform: `translate(-50%, -50%) scale(${el.scale || 1})`, touchAction: 'none' }}
              className={`absolute cursor-move select-none z-40 drop-shadow-xl rounded-md ${el.type === 'text' ? `${el.bgColor || 'bg-black/60'} ${el.textColor || 'text-white'} ${el.font || 'font-bold'} backdrop-blur-md px-4 py-2 text-xl` : ''}`}
            >
              {el.content.startsWith('http') ? (
                <img src={el.content} alt="Sticker" className="w-32 h-auto object-contain pointer-events-none" />
              ) : (
                el.content
              )}
              {isSelected && (
                <div onPointerDown={(e) => handleResizeStart(e, el)} className="absolute -bottom-4 -right-4 w-10 h-10 bg-transparent cursor-nwse-resize z-50 pointer-events-auto" />
              )}
            </div>
          )
        })}

        {activeTool === 'music' && (
          <div className="absolute bottom-0 inset-x-0 z-50 bg-[#1a1a1a] p-4 rounded-t-3xl border-t border-gray-800 max-h-[60vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <span className="text-white font-bold flex items-center gap-2"><Music size={18}/> Ajouter une musique</span>
              <button onClick={() => { setActiveTool(null); setPlayingPreview(null); }} className="text-gray-400 hover:text-white p-2"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-2">
              {MOCK_TRACKS.map((track) => (
                <div key={track.id} className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded-xl border border-gray-700">
                  <div>
                    <p className="text-white font-bold text-sm">{track.title}</p>
                    <p className="text-gray-400 text-xs">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPlayingPreview(playingPreview === track.url ? null : track.url)}
                      className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/40 transition"
                    >
                      {playingPreview === track.url ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
                    </button>
                    <button 
                      onClick={() => handleSelectMusic(track)}
                      className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTool === 'text' && (
          <div className="absolute bottom-0 inset-x-0 z-50 bg-[#1a1a1a] p-5 rounded-t-3xl border-t border-gray-800 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <span className="text-white font-bold">Ajouter du texte</span>
              <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-white p-2"><X size={20} /></button>
            </div>
            <input autoFocus value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Écris quelque chose..." className={`w-full bg-[#2a2a2a] text-white text-center text-xl outline-none mb-5 p-4 rounded-xl border border-gray-700 shrink-0 ${selectedTextColor.class} ${selectedFont}`} onKeyDown={e => e.key === 'Enter' && addElement('text', textInput)} />
            <div className="space-y-4 mb-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1">
              <div>
                <p className="text-xs text-gray-400 mb-2">Police</p>
                <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {FONTS.map(f => (
                    <button key={f} onClick={() => setSelectedFont(f)} className={`min-w-[50px] h-10 rounded-lg flex items-center justify-center border border-gray-700 ${selectedFont === f ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white'} ${f}`}>Aa</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Couleur</p>
                <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {TEXT_COLORS.map(c => (
                    <button key={c.name} onClick={() => setSelectedTextColor(c)} style={{ backgroundColor: c.hex }} className={`shrink-0 w-9 h-9 rounded-full border-2 ${selectedTextColor.name === c.name ? 'border-blue-500 scale-110' : 'border-gray-600'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Fond</p>
                <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {BG_COLORS.map(bg => (
                    <button key={bg.name} onClick={() => setSelectedBg(bg)} style={{ backgroundColor: bg.hex }} className={`shrink-0 w-9 h-9 rounded-full border-2 ${selectedBg.name === bg.name ? 'border-blue-500 scale-110' : 'border-gray-600'}`} />
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => addElement('text', textInput)} className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition shrink-0">Ajouter le texte</button>
          </div>
        )}

        {/* 👇 NOUVEAU PICKER D'EMOJIS PROPRE */}
        {activeTool === 'emoji' && (
          <div className="absolute bottom-0 inset-x-0 z-50 bg-[#1a1a1a] p-2 rounded-t-3xl border-t border-gray-800 max-h-[60vh] flex flex-col">
            <div className="flex justify-between items-center mb-2 px-2 shrink-0">
              <span className="text-white font-bold">Emojis</span>
              <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-white p-2"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex justify-center" style={{ height: 350 }}>
              <EmojiPicker 
                onEmojiClick={(emojiData) => addElement('emoji', emojiData.emoji)} 
                theme="dark" 
                lazyLoadEmojis={true}
                width="100%"
                height="100%"
              />
            </div>
          </div>
        )}

        {activeTool === 'gif' && (
          <div className="absolute bottom-0 inset-x-0 z-50 bg-[#1a1a1a] p-4 rounded-t-3xl border-t border-gray-800 max-h-[60vh] flex flex-col">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <span className="text-white font-bold">Rechercher un Sticker</span>
              <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-white p-2"><X size={20} /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="text" value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchGifs()} placeholder="Rechercher des Stickers..." className="flex-1 bg-[#2a2a2a] text-white rounded-xl p-3 text-sm border border-gray-700 focus:border-blue-500 outline-none" />
              <button onClick={searchGifs} disabled={searchingGif} className="bg-blue-500 text-white px-4 rounded-xl font-bold disabled:opacity-50">
                {searchingGif ? <Loader size={16} className="animate-spin" /> : 'Go'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {gifResults.map((gif) => (
                <img key={gif.id} src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full rounded-lg cursor-pointer hover:opacity-80 transition bg-black/20" onClick={() => { addElement('emoji', gif.images.original.url); setActiveTool(null); }} />
              ))}
            </div>
          </div>
        )}

        {activeTool === 'visibility' && (
          <div className="absolute top-16 right-4 z-50 bg-white rounded-xl shadow-xl overflow-hidden w-48">
            <button onClick={() => { setVisibility('public'); setActiveTool(null) }} className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${visibility === 'public' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}><Globe size={16} /> Public</button>
            <button onClick={() => { setVisibility('friends'); setActiveTool(null) }} className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${visibility === 'friends' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}><Users size={16} /> Amis</button>
            <button onClick={() => { setVisibility('private'); setActiveTool(null) }} className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${visibility === 'private' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}><Lock size={16} /> Privé</button>
          </div>
        )}

        {!mediaUrl && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center items-center gap-8 z-20">
            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition"><Upload size={20} className="text-white" /></button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,image/*" className="hidden" />
            <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-xl ${isRecording ? 'bg-red-500/80 scale-110' : 'bg-transparent'}`}>
              <div className={`bg-white transition-all ${isRecording ? 'w-8 h-8 rounded-md' : 'w-16 h-16 rounded-full'}`} />
            </button>
            <button onClick={takePhoto} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition"><Camera size={20} className="text-white" /></button>
          </div>
        )}

        {mediaUrl && !isToolOpen && (
          <div className="absolute bottom-0 inset-x-0 z-40">
            <div className="flex justify-around items-center px-4 mb-4">
              <button onClick={() => setActiveTool('text')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg"><Type size={20} /></button>
              <button onClick={() => setActiveTool('emoji')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg"><Smile size={20} /></button>
              <button onClick={() => setActiveTool('gif')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg"><Film size={20} /></button>
              <button onClick={() => setActiveTool('music')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg"><Music size={20} /></button>
              <button onClick={() => setActiveTool('visibility')} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white hover:bg-black/60 transition shadow-lg">
                {visibility === 'public' ? <Globe size={20} /> : visibility === 'friends' ? <Users size={20} /> : <Lock size={20} />}
              </button>
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-4 pb-6 rounded-t-3xl border-t border-white/10 flex items-center justify-between gap-3">
              <button onClick={() => { setMediaUrl(null); setElements([]); setSelectedMusic(null); }} className="w-12 h-12 flex items-center justify-center bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"><X size={20} /></button>
              <button onClick={handlePublish} disabled={uploading} className="flex-1 bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <Loader className="animate-spin" size={20} /> : <><Send size={20} /> Publier</>}
              </button>
            </div>
          </div>
        )}

        {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[100]"><Loader className="animate-spin text-blue-500" size={50} /></div>}
      </div>
    </div>
  )
}