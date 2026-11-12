import { useState, useEffect, useRef } from 'react'
import { X, MoreVertical, EyeOff, AlertTriangle, ChevronRight, ChevronLeft, Trash2, Lock, Users, Globe } from 'lucide-react'
import storiesApi from '../../service/api/stories.api'
import api from '../../service/api/httpClient'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../context/AuthContext'

export default function StoryViewerModal({ 
  group, 
  initialIndex = 0, 
  onClose 
}: { 
  group: any, 
  initialIndex?: number, 
  onClose: () => void 
}) {
  const auth = useAuthStore(); 
  const user = (auth as any)?.user;

  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showMenu, setShowMenu] = useState(false)
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [videoError, setVideoError] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStory = group?.stories[currentIndex]
  const isOwn = currentStory?.author_id === user?.id

  useEffect(() => {
    setVideoError(false)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [currentIndex, currentStory])

  useEffect(() => {
    if (currentStory && currentStory.media_type === 'image') {
      const timer = setTimeout(() => {
        if (currentIndex < group.stories.length - 1) setCurrentIndex(prev => prev + 1)
        else onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, currentStory, group, onClose])

  const handleNext = () => {
    if (currentIndex < (group?.stories.length || 0) - 1) setCurrentIndex(prev => prev + 1)
    else onClose()
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  const handleDelete = async () => {
    if (!confirm("Supprimer cette Story ?")) return
    try {
      await storiesApi.delete(currentStory.id)
      toast.success("Supprimée")
      onClose()
    } catch { toast.error("Erreur") }
  }

  const handleChangeVisibility = async (vis: 'public' | 'friends' | 'private') => {
    try {
      await storiesApi.updateVisibility(currentStory.id, vis)
      toast.success("Visibilité modifiée")
      setShowVisibilityMenu(false)
      setShowMenu(false)
    } catch { toast.error("Erreur") }
  }

  const handleRestrict = async () => {
    if (!confirm(`Masquer toutes les stories de ${group.author.first_name} ?`)) return
    try {
      await api.post(`/users/blocks/restrict`, { userId: group.author.id })
      toast.success(`Stories de ${group.author.first_name} masquées`)
      onClose()
    } catch (err: any) { 
      console.error(err)
      toast.error("Erreur lors du masquage") 
    }
  }

  const handleReport = async () => {
    const reason = prompt("Pourquoi signalez-vous cette story ? (Spam, Nu, Violence, etc.)")
    if (!reason) return
    try {
      await api.post('/reports', { targetType: 'story', targetId: currentStory.id, reason })
      toast.success("Story signalée à l'administration.")
      onClose()
    } catch (err: any) { 
      console.error(err)
      toast.error(err?.response?.status === 404 ? "Route backend introuvable" : "Erreur de signalement") 
    }
  }

  if (!group || !currentStory) return null

  return (
    <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center">
      <button onClick={handlePrev} className="hidden sm:block absolute left-10 text-white/50 hover:text-white z-50"><ChevronLeft size={48}/></button>
      <button onClick={handleNext} className="hidden sm:block absolute right-10 text-white/50 hover:text-white z-50"><ChevronRight size={48}/></button>

      <div className="w-full h-full sm:h-[90vh] sm:w-[420px] relative bg-gray-900 sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-50 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img src={group.author.avatar_url} className="w-10 h-10 rounded-full border-2 border-white" alt="" />
            <div>
              <p className="text-white font-bold text-sm">{group.author.first_name} {group.author.last_name}</p>
              <p className="text-white/70 text-xs">@{group.author.username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-white p-2 hover:bg-white/20 rounded-full"><MoreVertical size={20}/></button>
            <button onClick={onClose} className="text-white p-2 hover:bg-white/20 rounded-full"><X size={24}/></button>

            {showMenu && (
              <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl overflow-hidden w-56 z-[60]">
                {isOwn ? (
                  <>
                    <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 flex items-center gap-2"><Trash2 size={16}/> Supprimer</button>
                    <button onClick={() => setShowVisibilityMenu(!showVisibilityMenu)} className="w-full text-left px-4 py-3 text-sm text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Lock size={16}/> Visibilité</span>
                    </button>
                    {showVisibilityMenu && (
                      <div className="bg-gray-50 border-t border-gray-100 py-1">
                        <button onClick={() => handleChangeVisibility('public')} className={`w-full text-left px-8 py-2 text-xs font-semibold hover:bg-gray-100 flex items-center gap-2 ${currentStory.visibility === 'public' ? 'text-blue-600' : 'text-gray-700'}`}><Globe size={12}/> Public</button>
                        <button onClick={() => handleChangeVisibility('friends')} className={`w-full text-left px-8 py-2 text-xs font-semibold hover:bg-gray-100 flex items-center gap-2 ${currentStory.visibility === 'friends' ? 'text-blue-600' : 'text-gray-700'}`}><Users size={12}/> Amis</button>
                        <button onClick={() => handleChangeVisibility('private')} className={`w-full text-left px-8 py-2 text-xs font-semibold hover:bg-gray-100 flex items-center gap-2 ${currentStory.visibility === 'private' ? 'text-blue-600' : 'text-gray-700'}`}><Lock size={12}/> Privé</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={handleRestrict} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 font-bold hover:bg-gray-50 transition">
                      <EyeOff size={16} className="text-orange-400" /> Masquer ses stories
                    </button>
                    <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition">
                      <AlertTriangle size={16} /> Signaler la story
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barres de progression */}
        <div className="absolute top-2 inset-x-4 flex gap-1 z-50">
          {group.stories.map((s: any, i: number) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className={`h-full bg-white transition-all duration-300 ${i < currentIndex ? 'w-full' : i === currentIndex ? 'w-full animate-progress' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {/* Média */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {currentStory.media_type === 'video' ? (
            <>
              {videoError ? (
                <div className="text-white text-center p-4">
                  <AlertTriangle size={40} className="mx-auto mb-2 text-red-500" />
                  <p className="text-sm">La vidéo n'a pas pu être chargée.</p>
                  <p className="text-xs text-gray-400 mt-2">Format non supporté ou erreur réseau.</p>
                </div>
              ) : (
                <video 
                  key={currentStory.id} 
                  ref={videoRef}
                  src={currentStory.media_url} 
                  className="w-full h-full object-contain" 
                  autoPlay 
                  playsInline
                  muted={false}
                  controls={false} 
                  onEnded={handleNext}
                  onError={(e) => {
                    // 🆕 On tente une seule fois de contourner le cache
                    const target = e.currentTarget;
                    if (!target.dataset.retried) {
                      target.dataset.retried = "true";
                      console.log("🔄 Contournement du cache Chrome pour la vidéo...");
                      const cleanSrc = currentStory.media_url.split('?')[0];
                      target.src = cleanSrc + '?nocache=' + Date.now();
                      target.load();
                    } else {
                      setVideoError(true);
                    }
                  }}
                />
              )}
            </>
          ) : (
            <img key={currentStory.id} src={currentStory.media_url} className="w-full h-full object-contain" alt="" />
          )}
        </div>

        {/* Éléments superposés (Texte/Emoji) */}
        {currentStory.elements?.map((el: any) => (
          <div key={el.id} style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`absolute z-40 pointer-events-none drop-shadow-xl ${el.type === 'text' ? `${el.bgColor || 'bg-black/60'} ${el.textColor || 'text-white'} ${el.font || 'font-bold'} backdrop-blur-md px-4 py-2 rounded-xl text-xl border border-white/20` : 'text-5xl'}`}
          >
            {el.content}
          </div>
        ))}

        {/* Zones de clic pour avancer/reculer */}
        <div className="absolute inset-0 z-30 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>
      </div>
    </div>
  )
}