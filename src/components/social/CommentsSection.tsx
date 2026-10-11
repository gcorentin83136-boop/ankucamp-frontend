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
}: {
  postId: number
  currentUserId: number | undefined
  onCommentAdded?: () => void
  onReport?: (commentId: number) => void
  initialLimit?: number
  showInput?: boolean
}) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

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

  const visible = expanded ? comments : comments.slice(0, initialLimit)
  const hasMore = comments.length > initialLimit && !expanded

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
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
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-[11px] font-bold hover:underline"
              style={{ color: ANKU.green }}
            >
              Voir les {comments.length - initialLimit} autres commentaires
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