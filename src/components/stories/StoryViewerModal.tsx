import { useState, useEffect } from 'react'
import { X, MoreVertical, Trash2, Lock, Users, Globe } from 'lucide-react'
import storiesApi from '../../service/api/stories.api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../context/AuthContext'

export default function StoryViewerModal({ initialStoryId, onClose }: { initialStoryId: number, onClose: () => void }) {
  const auth = useAuthStore(); const user = (auth as any)?.user;

  const [stories, setStories] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)

  useEffect(() => {
    storiesApi.feed().then((res: any) => {
      const fetchedStories = res.stories || []
      setStories(fetchedStories)
      const idx = fetchedStories.findIndex((r: any) => r.id === initialStoryId)
      if (idx >= 0) setCurrentIndex(idx)
    })
  }, [initialStoryId])

  const currentStory = stories[currentIndex]
  const isOwn = currentStory?.author_id === user?.id

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

  if (!currentStory) return <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center text-white">Chargement...</div>

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full sm:w-[400px] sm:h-[85vh] sm:rounded-2xl overflow-hidden bg-gray-900">
        
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
          <button onClick={onClose} className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60"><X size={20} /></button>
          {isOwn && (
            <button onClick={() => setShowMenu(!showMenu)} className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60"><MoreVertical size={20} /></button>
          )}
        </div>

        {/* 🆕 MENU 3 POINTS (Supprimer + Restreindre) */}
        {showMenu && (
          <div className="absolute top-16 right-4 z-50 bg-white rounded-xl shadow-xl overflow-hidden w-56">
            <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 flex items-center gap-2"><Trash2 size={16}/> Supprimer</button>
            <button onClick={() => setShowVisibilityMenu(!showVisibilityMenu)} className="w-full text-left px-4 py-3 text-sm text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-between">
              <span className="flex items-center gap-2"><Lock size={16}/> Restreindre</span>
            </button>
            
            {/* Sous-menu de visibilité */}
            {showVisibilityMenu && (
              <div className="bg-gray-50 border-t border-gray-100 py-1">
                <button onClick={() => handleChangeVisibility('public')} className={`w-full text-left px-8 py-2 text-xs font-semibold hover:bg-gray-100 flex items-center gap-2 ${currentStory.visibility === 'public' ? 'text-blue-600' : 'text-gray-700'}`}><Globe size={12}/> Public</button>
                <button onClick={() => handleChangeVisibility('friends')} className={`w-full text-left px-8 py-2 text-xs font-semibold hover:bg-gray-100 flex items-center gap-2 ${currentStory.visibility === 'friends' ? 'text-blue-600' : 'text-gray-700'}`}><Users size={12}/> Amis</button>
                <button onClick={() => handleChangeVisibility('private')} className={`w-full text-left px-8 py-2 text-xs font-semibold hover:bg-gray-100 flex items-center gap-2 ${currentStory.visibility === 'private' ? 'text-blue-600' : 'text-gray-700'}`}><Lock size={12}/> Privé</button>
              </div>
            )}
          </div>
        )}

        {currentStory.media_type === 'video' ? (
          <video src={currentStory.media_url} className="w-full h-full object-cover" autoPlay loop controls playsInline />
        ) : (
          <img src={currentStory.media_url} className="w-full h-full object-cover" />
        )}

        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white">
              {currentStory.author?.avatar_url && <img src={currentStory.author.avatar_url} className="w-full h-full object-cover" />}
            </div>
            <p className="font-bold text-sm">@{currentStory.author?.username}</p>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Story 48h</span>
          </div>
          <p className="text-sm">{currentStory.caption}</p>
        </div>
      </div>
    </div>
  )
}