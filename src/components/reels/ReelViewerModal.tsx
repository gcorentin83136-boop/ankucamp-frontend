import { useState, useEffect } from 'react'
import { X, Heart, MessageCircle, Share2 } from 'lucide-react'
import reelsApi from '../../service/api/reels.api'
import postsApi from '../../service/api/posts.api'
import toast from 'react-hot-toast'

export default function ReelViewerModal({ initialReelId, onClose }: { initialReelId: number, onClose: () => void }) {
  const [reels, setReels] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    reelsApi.feed().then(res => {
      setReels(res.reels)
      const idx = res.reels.findIndex((r: any) => r.id === initialReelId)
      if (idx >= 0) {
        setCurrentIndex(idx)
        setLiked(res.reels[idx].liked_by_me)
        setLikesCount(res.reels[idx].likes_count)
      }
    })
  }, [initialReelId])

  const currentReel = reels[currentIndex]

  const handleLike = async () => {
    if (!currentReel) return
    const res = await reelsApi.like(currentReel.id)
    setLiked(res.liked)
    setLikesCount((c: number) => res.liked ? c + 1 : c - 1)
  }

  const handleShareToFeed = async () => {
    if (sharing) return
    setSharing(true)
    try {
      await postsApi.shareReel(currentReel.id, { share_comment: 'Regardez cet Anku Live !', visibility: 'public' })
      toast.success("Partagé sur ton feed !")
    } catch {
      toast.error("Erreur de partage")
    } finally {
      setSharing(false)
    }
  }

  if (!currentReel) return <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center text-white">Chargement...</div>

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col">
      <button onClick={onClose} className="absolute top-4 left-4 z-50 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition"><X size={24} /></button>
      
      {/* Média */}
      <div className="flex-1 relative flex items-center justify-center">
        {currentReel.media_type === 'video' ? (
          <video src={currentReel.media_url} className="w-full h-full object-contain" autoPlay loop controls playsInline />
        ) : (
          <img src={currentReel.media_url} className="w-full h-full object-contain" />
        )}
      </div>

      {/* Overlay Actions & Infos */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-end">
        <div className="flex-1 text-white pr-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white">
              {currentReel.author?.avatar_url && <img src={currentReel.author.avatar_url} className="w-full h-full object-cover" />}
            </div>
            <p className="font-bold text-sm">@{currentReel.author.username}</p>
          </div>
          <p className="text-sm">{currentReel.caption}</p>
        </div>
        
        <div className="flex flex-col items-center gap-6 text-white pb-2">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 hover:scale-110 transition">
            <Heart size={30} className={liked ? 'fill-red-500 text-red-500' : ''} />
            <span className="text-xs font-bold">{likesCount}</span>
          </button>
          <button className="flex flex-col items-center gap-1 hover:scale-110 transition">
            <MessageCircle size={30} />
            <span className="text-xs font-bold">{currentReel.comments_count}</span>
          </button>
          <button onClick={handleShareToFeed} disabled={sharing} className="flex flex-col items-center gap-1 hover:scale-110 transition">
            <Share2 size={30} className={sharing ? 'opacity-50' : ''} />
            <span className="text-[10px] font-bold text-center">Feed</span>
          </button>
        </div>
      </div>
    </div>
  )
}