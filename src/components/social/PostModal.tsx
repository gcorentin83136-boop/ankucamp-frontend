import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader } from 'lucide-react'
import postsApi from '../../service/api/posts.api'
import PostCard from './PostCard'
import type { Post } from '../../types/post'

export default function PostModal({
  postId,
  commentId,
  onClose,
  onPostUpdated,
}: {
  postId: number
  commentId?: number | null
  onClose: () => void
  onPostUpdated?: () => void
}) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await postsApi.getOne(postId)
        setPost(res.post)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [postId])

  // 🆕 Scroll auto vers le commentaire spécifique une fois chargé
  useEffect(() => {
    if (loading || !post || !commentId) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`comment-${commentId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-50', 'rounded-xl', 'p-2')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-50', 'p-2')
        }, 3000)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [loading, post, commentId])

  const modal = (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div 
        className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <h3 className="text-sm font-bold text-gray-900">Publication</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <Loader size={32} className="animate-spin text-emerald-500" />
            </div>
          ) : post ? (
            <PostCard
              post={post}
              currentUserId={post.author_id}
              onPostUpdated={() => {
                // Re-fetch pour avoir les nouveaux commentaires
                postsApi.getOne(postId).then(res => setPost(res.post))
                onPostUpdated?.()
              }}
              isModal={true} // 🆕 Important : active l'affichage de tous les commentaires
            />
          ) : (
            <p className="text-center text-gray-500 py-10">Post introuvable</p>
          )}
        </div>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null
}