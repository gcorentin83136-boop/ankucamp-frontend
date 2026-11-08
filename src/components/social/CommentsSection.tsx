import { useCallback, useEffect, useState } from 'react'
import { Loader } from 'lucide-react'
import postsApi from '../../service/api/posts.api'
import CommentItem from './CommentItem'
import CommentInput from './CommentInput'
import type { PostComment } from '../../types/post'

const ANKU = { green: '#6aa84f' }

export default function CommentsSection({
  postId,
  currentUserId,
  onCommentAdded,
  onReport,
  initialLimit = 2,
  showInput = true,
  isModal = false,
  onSeeAll,
  highlightCommentId,
}: {
  postId: number
  currentUserId: number | undefined
  onCommentAdded?: () => void
  onReport?: (commentId: number) => void
  initialLimit?: number
  showInput?: boolean
  isModal?: boolean
  onSeeAll?: () => void
  highlightCommentId?: number | null
}) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await postsApi.comments(postId, { limit: 50 })
      setComments(res.comments)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    load()
  }, [load])

  // 🆕 GESTION DU SCROLL VERS LE COMMENTAIRE
  useEffect(() => {
    if (loading || comments.length === 0 || !highlightCommentId) return

    // Petit délai pour être sûr que React a bien peint le DOM
    const timer = setTimeout(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Effet visuel de surbrillance
        el.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-50', 'rounded-xl', 'p-2', 'transition-all', 'duration-500')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-50', 'p-2')
        }, 3000)
      }
    }, 400) // 400ms de marge

    return () => clearTimeout(timer)
  }, [loading, comments, highlightCommentId])

  const visible = isModal ? comments : comments.slice(0, initialLimit)
  const hasMore = comments.length > initialLimit && !isModal

  return (
    <div className={isModal ? "space-y-4" : "border-t border-gray-100 bg-gray-50/50 p-4 space-y-3"}>
      {loading && comments.length === 0 ? (
        <Loader size={16} className="animate-spin text-gray-300 mx-auto" />
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic text-center">
          Aucun commentaire. Sois le premier à réagir !
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onRefresh={() => {
                load()
                onCommentAdded?.()
              }}
              onReport={onReport}
            />
          ))}
          
          {hasMore && onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-[11px] font-bold hover:underline"
              style={{ color: ANKU.green }}
            >
              Voir tous les {comments.length} commentaires
            </button>
          )}
        </div>
      )}

      {showInput && (
        <CommentInput
          placeholder="Écris un commentaire…"
          onSubmit={async (content, mediaUrl) => {
            await postsApi.addComment(postId, content, null, mediaUrl)
            await load()
            onCommentAdded?.()
          }}
        />
      )}
    </div>
  )
}