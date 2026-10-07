import { useState } from 'react'
import {
  Reply,
  Trash2,
  Pencil,
  X,
  Send,
  Loader,
  Image as ImageIcon,
} from 'lucide-react'
import type { Comment } from '../../types/comment'
import EmojiPicker from './EmojiPicker'
import commentsApi from '../../service/api/comments.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return 'à l’instant'
    const min = Math.floor(sec / 60)
    if (min < 60) return `il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `il y a ${h} h`
    const days = Math.floor(h / 24)
    if (days < 7) return `il y a ${days} j`
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

interface Props {
  comment: Comment
  currentUserId?: number
  depth?: number
  onReply: (
    parentId: number,
    content: string,
    mediaUrl: string | null
  ) => Promise<void>
  onReact: (commentId: number, emoji: string) => Promise<void>
  onUpdate: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
}

export default function CommentItem({
  comment,
  currentUserId,
  depth = 0,
  onReply,
  onReact,
  onUpdate,
  onDelete,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyMedia, setReplyMedia] = useState<string | null>(null)
  const [replyUploading, setReplyUploading] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const [sending, setSending] = useState(false)

  const isOwn = currentUserId === comment.author_id
  const author = comment.author
  const authorName = author
    ? `${author.first_name} ${author.last_name}`.trim() || author.username
    : `User #${comment.author_id}`

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return
    setSending(true)
    try {
      await onReply(comment.id, replyContent.trim(), replyMedia)
      setReplyContent('')
      setReplyMedia(null)
      setShowReplyForm(false)
    } finally {
      setSending(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setEditing(false)
      return
    }
    setSending(true)
    try {
      await onUpdate(comment.id, editContent.trim())
      setEditing(false)
    } finally {
      setSending(false)
    }
  }

  const handleUploadReply = async (file: File) => {
    setReplyUploading(true)
    try {
      const res = await commentsApi.uploadMedia(file)
      setReplyMedia(res.url)
    } catch {
      // silent
    } finally {
      setReplyUploading(false)
    }
  }

  return (
    <div className={depth > 0 ? 'ml-8 mt-3' : 'mt-3'}>
      <div className="flex gap-3">
        {author?.avatar_url ? (
          <img
            src={author.avatar_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: ANKU.greenPale, color: ANKU.greenDark }}
          >
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
              {authorName}
            </span>
            {author?.badges?.slice(0, 2).map((b) => (
              <span
                key={b}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
              >
                {b}
              </span>
            ))}
            <span className="text-[11px] text-gray-400">
              {timeAgo(comment.created_at)}
            </span>
            {comment.updated_at &&
              comment.updated_at !== comment.created_at && (
                <span className="text-[10px] text-gray-400 italic">
                  (modifié)
                </span>
              )}
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm resize-none focus:outline-none focus:border-emerald-400 focus:bg-white transition"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={sending}
                  className="text-xs font-bold text-white rounded-full px-3 py-1 disabled:opacity-50"
                  style={{ background: ANKU.green }}
                >
                  {sending ? '...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
              {comment.media_url && (
                <img
                  src={comment.media_url}
                  alt=""
                  className="mt-2 rounded-xl max-h-64 object-cover cursor-pointer"
                  onClick={() =>
                    window.open(comment.media_url!, '_blank')
                  }
                />
              )}
            </div>
          )}

          {!editing && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {comment.reactions &&
                Object.entries(comment.reactions).map(
                  ([emoji, userIds]) => {
                    const isMine = comment.my_reactions?.includes(emoji)
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReact(comment.id, emoji)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                          isMine
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px]">{userIds.length}</span>
                      </button>
                    )
                  }
                )}

              <EmojiPicker
                compact
                onPick={(e) => onReact(comment.id, e)}
              />

              {depth < 3 && (
                <button
                  type="button"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 ml-1"
                >
                  <Reply size={12} /> Répondre
                </button>
              )}

              {isOwn && !editing && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true)
                      setEditContent(comment.content)
                    }}
                    className="text-xs text-gray-400 hover:text-gray-700 ml-auto"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Supprimer ce commentaire ?')) {
                        onDelete(comment.id)
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          )}

          {showReplyForm && (
            <div className="mt-2 rounded-xl border border-gray-200 p-2 bg-gray-50">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                placeholder={`Répondre à ${authorName}…`}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-emerald-400"
              />
              {replyMedia && (
                <div className="relative inline-block mt-2">
                  <img
                    src={replyMedia}
                    alt=""
                    className="max-h-24 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setReplyMedia(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <label className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer">
                  {replyUploading ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <ImageIcon size={14} />
                  )}
                  <input
                    type="file"
                    accept="image/*,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUploadReply(f)
                      e.target.value = ''
                    }}
                  />
                </label>
                <EmojiPicker
                  compact
                  onPick={(e) => setReplyContent((c) => c + e)}
                />
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false)
                    setReplyContent('')
                    setReplyMedia(null)
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleReplySubmit}
                  disabled={sending || !replyContent.trim()}
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 flex items-center gap-1"
                  style={{ background: ANKU.green }}
                >
                  {sending ? (
                    <Loader size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div>
              {comment.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  onReply={onReply}
                  onReact={onReact}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
