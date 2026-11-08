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
}: {
  postId: number
  currentUserId: number | undefined
  onCommentAdded?: () => void
  onReport?: (commentId: number) => void
  initialLimit?: number
  showInput?: boolean
  isModal?: boolean
  onSeeAll?: () => void
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

  // 🆕 Si on est dans la popup, on affiche tout. Sinon, on limite.
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
          
          {/* 🆕 Le bouton ouvre la popup au lieu de dérouler */}
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