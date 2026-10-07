import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  MessageCircle,
  Send,
  Loader,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import commentsApi from '../../service/api/comments.api'
import type { Comment } from '../../types/comment'
import CommentItem from './CommentItem'
import EmojiPicker from './EmojiPicker'

const ANKU = {
  green: '#6aa84f',
  greenPale: '#f0f9e8',
  greenDark: '#4a7a35',
}

interface Props {
  articleId: number
  currentUserId?: number
}

export default function CommentSection({
  articleId,
  currentUserId,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await commentsApi.listForArticle(articleId)
      setComments(res.comments)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0
  )

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await commentsApi.uploadMedia(file)
      setMediaUrl(res.url)
      toast.success('Image ajoutée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      await commentsApi.createForArticle(articleId, {
        content: content.trim(),
        media_url: mediaUrl,
      })
      setContent('')
      setMediaUrl(null)
      toast.success('Commentaire ajouté ✅')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const handleReply = async (
    parentId: number,
    replyContent: string,
    replyMedia: string | null
  ) => {
    try {
      await commentsApi.createForArticle(articleId, {
        content: replyContent,
        media_url: replyMedia,
        parent_comment_id: parentId,
      })
      toast.success('Réponse ajoutée ✅')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleReact = async (commentId: number, emoji: string) => {
    try {
      await commentsApi.react(commentId, emoji)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleUpdate = async (
    commentId: number,
    newContent: string
  ) => {
    try {
      await commentsApi.update(commentId, newContent)
      toast.success('Commentaire modifié ✅')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await commentsApi.delete(commentId)
      toast.success('Commentaire supprimé ✅')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={18} style={{ color: ANKU.greenDark }} />
        <h3 className="text-base font-bold text-gray-900">
          Commentaires
          {totalCount > 0 && (
            <span className="text-gray-400 ml-2 text-sm font-semibold">
              ({totalCount})
            </span>
          )}
        </h3>
      </div>

      {currentUserId && (
        <div className="rounded-2xl border border-gray-200 p-3 bg-gray-50">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder="Écris un commentaire…"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-emerald-400"
          />
          {mediaUrl && (
            <div className="relative inline-block mt-2">
              <img
                src={mediaUrl}
                alt=""
                className="max-h-28 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setMediaUrl(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <label className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer">
              {uploading ? (
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
                  if (f) handleUpload(f)
                  e.target.value = ''
                }}
              />
            </label>
            <EmojiPicker onPick={(e) => setContent((c) => c + e)} />
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending || !content.trim()}
              className="rounded-full px-4 py-1.5 text-sm font-bold text-white disabled:opacity-40 flex items-center gap-1"
              style={{ background: ANKU.green }}
            >
              {sending ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Envoyer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <Loader
            size={20}
            className="animate-spin text-gray-400 mx-auto"
          />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Aucun commentaire — sois le premier à réagir !
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onReply={handleReply}
              onReact={handleReact}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
