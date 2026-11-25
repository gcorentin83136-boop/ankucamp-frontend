import { useState, useEffect, useRef } from 'react'
import { X, MoreVertical, EyeOff, AlertTriangle, ChevronRight, ChevronLeft, Trash2, Lock, Users, Globe, Send, Loader } from 'lucide-react'
import storiesApi from '../../service/api/stories.api'
import postsApi from '../../service/api/posts.api'
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
  
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareText, setShareText] = useState('')
  const [sharing, setSharing] = useState(false)

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
    if (showMenu || showShareModal) return
    if (currentIndex < (group?.stories.length || 0) - 1) setCurrentIndex(prev => prev + 1)
    else onClose()
  }

  const handlePrev = () => {
    if (showMenu || showShareModal) return
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

  const handleOpenShareModal = () => {
    setShowMenu(false)
    setShareText('')
    setShowShareModal(true)
  }

  const handleShareToFeed = async () => {
    setSharing(true)
    try {
      await postsApi.create({
        content: shareText.trim() || "J'ai publié une nouvelle Story ! 🌿",
        media_urls: [currentStory.media_url],
        visibility: 'public'
      })
      toast.success("Story partagée sur ton feed !")
      setShowShareModal(false)
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error("Erreur lors du partage sur le feed.")
    } finally {
      setSharing(false)
    }
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
      toast.error("Erreur de signalement") 
    }
  }

  if (!group || !currentStory) return null

  return (
    <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center">
      <button onClick={handlePrev} className="hidden sm:block absolute left-10 text-white/50 hover:text-white z-50"><ChevronLeft size={48}/></button>
      <button onClick={handleNext} className="hidden sm:block absolute right-10 text-white/50 hover:text-white z-50"><ChevronRight size={48}/></button>

      <div className="w-full h-full sm:h-[90vh] sm:w-[420px] relative bg-gray-900 sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div 
          className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-[100] flex justify-between items-start"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <img src={group.author.avatar_url} className="w-10 h-10 rounded-full border-2 border-white" alt="" />
            <div>
              <p className="text-white font-bold text-sm">{group.author.first_name} {group.author.last_name}</p>
              <p className="text-white/70 text-xs">@{group.author.username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
              className="text-white p-2 hover:bg-white/20 rounded-full"
            >
              <MoreVertical size={20}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="text-white p-2 hover:bg-white/20 rounded-full"
            >
              <X size={24}/>
            </button>

            {showMenu && (
              <div 
                className="absolute top-12 right-0 bg-white rounded-xl shadow-xl overflow-hidden w-56 z-[110]"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={handleOpenShareModal} className="w-full text-left px-4 py-3 text-sm text-blue-600 font-bold hover:bg-blue-50 flex items-center gap-2">
                  <Send size={16}/> Partager sur le feed
                </button>

                {isOwn ? (
                  <>
                    <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"><Trash2 size={16}/> Supprimer</button>
                    <button onClick={() => setShowVisibilityMenu(!showVisibilityMenu)} className="w-full text-left px-4 py-3 text-sm text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-between border-t border-gray-100">
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
                    <button onClick={handleRestrict} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 font-bold hover:bg-gray-50 transition border-t border-gray-100">
                      <EyeOff size={16} className="text-orange-400" /> Masquer ses stories
                    </button>
                    <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition border-t border-gray-100">
                      <AlertTriangle size={16} /> Signaler la story
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barres de progression */}
        <div className="absolute top-2 inset-x-4 flex gap-1 z-[90]">
          {group.stories.map((s: any, i: number) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className={`h-full bg-white transition-all duration-300 ${i < currentIndex ? 'w-full' : i === currentIndex ? 'w-full animate-progress' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {/* Média principal */}
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          {currentStory.media_type === 'video' ? (
            <>
              {videoError ? (
                <div className="text-white text-center p-4">
                  <AlertTriangle size={40} className="mx-auto mb-2 text-red-500" />
                  <p className="text-sm">La vidéo n'a pas pu être chargée.</p>
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
                    const target = e.currentTarget;
                    if (!target.dataset.retried) {
                      target.dataset.retried = "true";
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

        {/* 🆕 Éléments superposés (Texte, Emojis, Stickers) - CORRIGÉ */}
        {currentStory.elements?.map((el: any) => (
          <div 
            key={el.id} 
            style={{ 
              left: `${el.x}%`, 
              top: `${el.y}%`, 
              transform: `translate(-50%, -50%) scale(${el.scale || 1})` // 👈 Prise en compte de la taille
            }}
            className={`absolute z-20 pointer-events-none drop-shadow-xl ${el.type === 'text' ? `${el.bgColor || 'bg-black/60'} ${el.textColor || 'text-white'} ${el.font || 'font-bold'} backdrop-blur-md px-4 py-2 rounded-xl text-xl border border-white/20` : ''}`}
          >
            {/* 👇 Vérification de l'URL pour afficher l'image au lieu du texte */}
            {el.content.startsWith('http') ? (
              <img 
                src={el.content} 
                alt="Sticker" 
                className="w-32 h-auto object-contain" 
              />
            ) : (
              el.content
            )}
          </div>
        ))}

        {/* Zones de clic */}
        <div className="absolute inset-0 z-20 flex">
          <div className={`w-1/3 h-full ${!showMenu && !showShareModal ? 'cursor-pointer' : ''}`} onClick={handlePrev} />
          <div className={`w-2/3 h-full ${!showMenu && !showShareModal ? 'cursor-pointer' : ''}`} onClick={handleNext} />
        </div>

        {/* POPUP DE PARTAGE */}
        {showShareModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm border border-gray-800 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">Partager sur le feed</h3>
                <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                placeholder="Écris un texte pour accompagner ta story..."
                className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 text-sm border border-gray-700 focus:border-blue-500 outline-none resize-none h-24 mb-4"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowShareModal(false)} 
                  className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleShareToFeed} 
                  disabled={sharing}
                  className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sharing ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                  Partager
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}