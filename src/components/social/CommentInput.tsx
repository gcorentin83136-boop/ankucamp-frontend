import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Send, Loader, Image as ImageIcon, X } from 'lucide-react'
import EmojiPicker from '../common/EmojiPicker'
import uploadsApi from '../../service/api/uploads.api'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

export default function CommentInput({
  onSubmit,
  placeholder = 'Écris un commentaire…',
  autoFocus = false,
  onCancel,
  avatarUrl,
  userName,
}: {
  onSubmit: (content: string, mediaUrl: string | null) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
  onCancel?: () => void
  avatarUrl?: string | null
  userName?: string
}) {
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 MB")
      return
    }
    setUploading(true)
    try {
      const res = await uploadsApi.uploadCommentMedia(file)
      setMediaUrl(res.url)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl) return
    setSending(true)
    try {
      await onSubmit(content.trim(), mediaUrl)
      setContent('')
      setMediaUrl(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-2">
      {avatarUrl !== undefined && (
        <>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: ANKU.greenDark }}
            >
              {userName?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </>
      )}
      <div className="flex-1 min-w-0">
        {mediaUrl && (
          <div className="relative inline-block mb-2">
            <img
              src={mediaUrl}
              alt=""
              className="max-h-32 rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => setMediaUrl(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1 rounded-2xl border border-gray-200 bg-white px-2 py-1 focus-within:border-emerald-400 transition">
          <textarea
            value={content}
            autoFocus={autoFocus}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={1}
            maxLength={2000}
            className="flex-1 bg-transparent outline-none text-xs resize-none py-1.5 min-h-[28px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
            title="Ajouter une image"
          >
            {uploading ? (
              <Loader size={12} className="animate-spin" />
            ) : (
              <ImageIcon size={14} />
            )}
          </button>
          <EmojiPicker onSelect={(emoji) => setContent((c) => c + emoji)} />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || (!content.trim() && !mediaUrl)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white disabled:opacity-40"
            style={{ background: ANKU.green }}
            title="Envoyer"
          >
            {sending ? (
              <Loader size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
          </button>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] text-gray-500 mt-1 hover:underline font-semibold"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}