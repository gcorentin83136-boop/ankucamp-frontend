import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trash2, Flag, CornerDownRight } from 'lucide-react'
import postsApi from '../../service/api/posts.api'
import CommentInput from './CommentInput'
import type { PostComment } from '../../types/post'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h} h`
    const j = Math.floor(h / 24)
    if (j < 7) return `${j} j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

export default function CommentItem({
  comment,
  currentUserId,
  onRefresh,
  isReply = false,
  onReport,
}: {
  comment: PostComment
  currentUserId: number | undefined
  onRefresh: () => void
  isReply?: boolean
  onReport?: (commentId: number) => void
}) {
  const isMine = comment.author_id === currentUserId
  const [replyOpen, setReplyOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Supprimer ce commentaire ?')) return
    try {
      await postsApi.removeComment(comment.post_id, comment.id)
      toast.success('Commentaire supprimé')
      onRefresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleSubmitReply = async (
    content: string,
    mediaUrl: string | null
  ) => {
    await postsApi.addComment(comment.post_id, content, comment.id, mediaUrl)
    setReplyOpen(false)
    onRefresh()
  }

  return (
    <div>
      <div className="flex gap-2">
        <Link
          to={comment.author?.username ? `/u/${comment.author.username}` : '#'}
          className="shrink-0"
        >
          {comment.author?.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: ANKU.greenDark }}
            >
              {(comment.author?.first_name?.[0] ?? '') +
                (comment.author?.last_name?.[0] ?? '')}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl px-3 py-2 border border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={
                  comment.author?.username
                    ? `/u/${comment.author.username}`
                    : '#'
                }
                className="text-xs font-bold text-gray-900 hover:underline truncate"
              >
                {comment.author?.first_name} {comment.author?.last_name}
              </Link>
              <span className="text-[10px] text-gray-400 shrink-0">
                {formatTime(comment.created_at)}
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-line break-words">
              {comment.content}
            </p>
            {comment.media_url && (
              <img
                src={comment.media_url}
                alt=""
                className="mt-2 rounded-lg max-h-64 object-cover"
                loading="lazy"
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 mt-1 ml-1">
            {!isReply && (
              <button
                type="button"
                onClick={() => setReplyOpen((v) => !v)}
                className="hover:text-emerald-600 transition inline-flex items-center gap-1"
              >
                <CornerDownRight size={10} />
                Répondre
              </button>
            )}
            {isMine && (
              <button
                type="button"
                onClick={handleDelete}
                className="hover:text-red-600 transition inline-flex items-center gap-1"
              >
                <Trash2 size={10} />
                Supprimer
              </button>
            )}
            {!isMine && onReport && (
              <button
                type="button"
                onClick={() => onReport(comment.id)}
                className="hover:text-amber-600 transition inline-flex items-center gap-1"
              >
                <Flag size={10} />
                Signaler
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Réponses imbriquées (1 niveau) */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 mt-2 space-y-2">
          {comment.replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              onRefresh={onRefresh}
              isReply
              onReport={onReport}
            />
          ))}
        </div>
      )}

      {/* Input réponse */}
      {replyOpen && (
        <div className="ml-10 mt-2">
          <CommentInput
            autoFocus
            placeholder={`Répondre à ${comment.author?.first_name ?? ''}…`}
            onSubmit={handleSubmitReply}
            onCancel={() => setReplyOpen(false)}
          />
        </div>
      )}
    </div>
  )
}