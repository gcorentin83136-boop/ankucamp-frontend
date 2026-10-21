import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'
import {
  Send, Image as ImageIcon, Mic, MoreVertical, User, Store,
  Flag, Ban, FolderOpen, X, CheckCheck, ArrowLeft, Phone,
  Smile, Pencil, Trash2, Check, Video, Square, Reply, Paperclip, FileText, Download,
  PhoneOff,
} from 'lucide-react'
import messagesApi from '../../service/api/messages.api'
import type { Conversation, Message } from '../../types/message'
import { useAuthStore } from '../../context/AuthContext'
import { blocksApi } from '../../service/api/blocks.api'
import { reportsApi } from '../../service/api/reports.api'
import MediaArchive from './MediaArchive'
import { useCallContext } from '../../context/CallContext'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }
const SOCKET_URL = 'http://localhost:3001'
const PAGE_SIZE = 50

export default function ChatWindow({ conversationId, onCloseMobile, hideHeader = false }: { conversationId: number, onCloseMobile?: () => void, hideHeader?: boolean }) {
  const auth = useAuthStore()
  const currentUser = (auth as any)?.user
  const navigate = useNavigate()
  const call = useCallContext()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)

  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const [previewFiles, setPreviewFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [captionText, setCaptionText] = useState('')

  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [videoCaption, setVideoCaption] = useState('')

  const [previewFile, setPreviewFile] = useState<File | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<any>(null)

  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const isLoadingMoreRef = useRef<boolean>(false)
  const lastMessageIdRef = useRef<number | null>(null)
  const loadMoreRef = useRef<() => void>(() => {})
  const observerStateRef = useRef({ hasMore: true, messagesLength: 0 })

  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setHasMore(true)
      lastMessageIdRef.current = null
      try {
        const [convRes, msgsRes] = await Promise.all([
          messagesApi.getConversation(conversationId),
          messagesApi.listMessages(conversationId, { limit: PAGE_SIZE })
        ])
        setConversation(convRes.conversation)
        setMessages(msgsRes.messages)
        setHasMore(msgsRes.messages.length >= PAGE_SIZE)
        messagesApi.markAsRead(conversationId)
      } catch (err) {
        toast.error('Erreur chargement du chat')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [conversationId])

  useEffect(() => {
    const token = localStorage.getItem('anku_token')
    socketRef.current = io(SOCKET_URL, { withCredentials: true, autoConnect: true, auth: { token } })
    const socket = socketRef.current
    socket.emit('conversation:join', { conversationId })

    socket.on('message:new', (msg: Message) => {
      if (msg.conversation_id === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        })
        messagesApi.markAsRead(conversationId)
        scrollToBottom()
      }
    })

    socket.on('message:edited', (msg: Message) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
    })

    socket.on('message:deleted', (data: { messageId: number }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, deleted_at: new Date().toISOString() } : m))
    })

    socket.on('message:reacted', (data: { messageId: number, emoji: string, userId: number, action: 'added' | 'removed' }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== data.messageId) return m;
        const reactions = JSON.parse(JSON.stringify(m.reactions || {}));
        if (data.action === 'added') {
          if (!reactions[data.emoji]) reactions[data.emoji] = [];
          if (!reactions[data.emoji].includes(data.userId)) reactions[data.emoji].push(data.userId);
        } else if (data.action === 'removed') {
          if (reactions[data.emoji]) {
            reactions[data.emoji] = reactions[data.emoji].filter((id: number) => id !== data.userId);
            if (reactions[data.emoji].length === 0) delete reactions[data.emoji];
          }
        }
        return { ...m, reactions };
      }))
    })

    socket.on('typing:user', (data: { userId: number, isTyping: boolean }) => {
      if (data.userId !== currentUser?.id) setIsTyping(data.isTyping)
    })

    return () => {
      socket.emit('conversation:leave', { conversationId })
      socket.disconnect()
    }
  }, [conversationId, currentUser?.id])

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 100)
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return
    const oldestId = messages[0]?.id
    if (!oldestId) return
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0
    try {
      const res = await messagesApi.listMessages(conversationId, {
        limit: PAGE_SIZE, before_message_id: oldestId,
      })
      if (res.messages.length < PAGE_SIZE) setHasMore(false)
      setMessages(prev => [...res.messages, ...prev])
    } catch {
      toast.error('Erreur chargement des anciens messages')
      prevScrollHeightRef.current = 0
      isLoadingMoreRef.current = false
    } finally {
      setIsLoadingMore(false)
    }
  }, [conversationId, hasMore, messages])

  loadMoreRef.current = loadMore

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    if (prevScrollHeightRef.current > 0) {
      const prevHeight = prevScrollHeightRef.current
      const newHeight = container.scrollHeight
      container.scrollTop = newHeight - prevHeight
      prevScrollHeightRef.current = 0
      isLoadingMoreRef.current = false
      return
    }
    const lastId = messages[messages.length - 1]?.id ?? null
    if (lastId !== null && lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId
      scrollToBottom()
    }
  }, [messages, isTyping])

  observerStateRef.current = { hasMore, messagesLength: messages.length }

  useEffect(() => {
    const sentinel = topSentinelRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container) return
    const observer = new IntersectionObserver(
      (entries) => {
        const { hasMore: hm, messagesLength: ml } = observerStateRef.current
        if (entries[0].isIntersecting && hm && ml > 0) loadMoreRef.current()
      },
      { root: container, rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const handleSendMessage = async (e?: React.FormEvent, mediaUrl?: string, type: 'text'|'image'|'audio'|'video'|'file' = 'text', contentText?: string) => {
    e?.preventDefault()
    const textToSend = contentText !== undefined ? contentText : inputText.trim()
    if (!textToSend && !mediaUrl) return
    const payload: any = { type, media_url: mediaUrl }
    if (textToSend) payload.content = textToSend
    if (replyToMessage) payload.reply_to_message_id = replyToMessage.id
    const tempId = Date.now()
    const optimisticMsg: Message = {
      id: tempId, conversation_id: conversationId, sender_id: currentUser?.id || 0,
      type, content: payload.content || '', media_url: mediaUrl || null,
      created_at: new Date().toISOString(), reply_to_message_id: replyToMessage?.id ?? null, edited_at: null, deleted_at: null, author: currentUser, reply_to_message: replyToMessage ? { id: replyToMessage.id, content: replyToMessage.content, type: replyToMessage.type, media_url: replyToMessage.media_url, deleted_at: replyToMessage.deleted_at, author: replyToMessage.author } : null,
    }
    setMessages(prev => [...prev, optimisticMsg])
    if (contentText === undefined) setInputText('')
    setReplyToMessage(null)
    try {
      const res = await messagesApi.sendMessage(conversationId, payload)
      setMessages(prev => prev.map(m => m.id === tempId ? res.message : m))
      socketRef.current?.emit('typing:stop', { conversationId })
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(err?.response?.data?.message || "Impossible d'envoyer le message")
    }
  }

  const handleEditMessage = async (msgId: number) => {
    if (!editContent.trim()) return setEditingMessageId(null)
    try {
      const res = await messagesApi.editMessage(msgId, editContent)
      setMessages(prev => prev.map(m => m.id === msgId ? res.message : m))
      socketRef.current?.emit('message:edit', { messageId: msgId, content: editContent })
      setEditingMessageId(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'édition")
    }
  }

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      await messagesApi.deleteMessage(msgId)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m))
      socketRef.current?.emit('message:delete', { messageId: msgId })
      toast.success('Message supprimé')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur de suppression")
    }
  }

  const handleReact = async (msgId: number, emoji: string) => {
    try {
      const res = await messagesApi.reactToMessage(msgId, emoji)
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        const reactions = JSON.parse(JSON.stringify(m.reactions || {}));
        if (res.action === 'added') {
          if (!reactions[emoji]) reactions[emoji] = [];
          if (!reactions[emoji].includes(currentUser?.id)) reactions[emoji].push(currentUser?.id);
        } else if (res.action === 'removed') {
          if (reactions[emoji]) {
            reactions[emoji] = reactions[emoji].filter((id: number) => id !== currentUser?.id);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          }
        }
        return { ...m, reactions };
      }))
      setShowReactionPicker(null)
    } catch (err) {
      toast.error("Erreur d'envoi de la réaction")
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (!socketRef.current) return
    socketRef.current.emit('typing:start', { conversationId })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { conversationId })
    }, 2000)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    const newUrls = newFiles.map(f => URL.createObjectURL(f))
    setPreviewFiles(prev => [...prev, ...newFiles])
    setPreviewUrls(prev => [...prev, ...newUrls])
    e.target.value = ''
  }

  const removePreviewImage = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const confirmImagesSend = async () => {
    if (previewFiles.length === 0) return
    toast.loading(`Envoi de ${previewFiles.length} image(s)...`, { id: 'upload' })
    const uploadedUrls: string[] = []
    try {
      for (const file of previewFiles) {
        const res = await messagesApi.uploadChatMedia(file)
        uploadedUrls.push(res.url)
      }
      const mediaUrlPayload = uploadedUrls.length === 1 ? uploadedUrls[0] : JSON.stringify(uploadedUrls)
      await handleSendMessage(undefined, mediaUrlPayload, 'image', captionText)
      setPreviewFiles([])
      setPreviewUrls([])
      setCaptionText('')
      toast.success('Image(s) envoyée(s) !', { id: 'upload' })
    } catch (err) {
      toast.error("Erreur d'envoi d'une image", { id: 'upload' })
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewVideoFile(file)
    setPreviewVideoUrl(URL.createObjectURL(file))
    setVideoCaption('')
    e.target.value = ''
  }

  const cancelVideoPreview = () => {
    setPreviewVideoFile(null)
    setPreviewVideoUrl(null)
    setVideoCaption('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      toast.error('Utilise les boutons Image / Vidéo / Vocal pour ce type de fichier')
      e.target.value = ''
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error('Fichier trop lourd (max 200 MB)')
      e.target.value = ''
      return
    }
    setPreviewFile(file)
    e.target.value = ''
  }

  const cancelFilePreview = () => setPreviewFile(null)

  const confirmFileSend = async () => {
    if (!previewFile) return
    toast.loading('Envoi du fichier...', { id: 'file' })
    try {
      const res = await messagesApi.uploadChatMedia(previewFile)
      await handleSendMessage(undefined, res.url, 'file', previewFile.name)
      setPreviewFile(null)
      toast.success('Fichier envoyé !', { id: 'file' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur d'envoi du fichier", { id: 'file' })
    }
  }

  const confirmVideoSend = async () => {
    if (!previewVideoFile) return
    toast.loading('Envoi de la vidéo...', { id: 'video' })
    try {
      const res = await messagesApi.uploadChatMedia(previewVideoFile)
      await handleSendMessage(undefined, res.url, 'video', videoCaption)
      cancelVideoPreview()
      toast.success('Vidéo envoyée !', { id: 'video' })
    } catch (err) {
      toast.error('Erreur vidéo', { id: 'video' })
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingTimerRef.current)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], 'vocal.webm', { type: 'audio/webm' })
        toast.loading('Envoi du vocal...', { id: 'vocal' })
        try {
          const res = await messagesApi.uploadChatMedia(file)
          await handleSendMessage(undefined, res.url, 'audio')
          toast.success('Vocal envoyé !', { id: 'vocal' })
        } catch (err) {
          toast.error("Erreur d'envoi du vocal", { id: 'vocal' })
        }
        stream.getTracks().forEach(track => track.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(recordingTimerRef.current)
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      toast.error('Impossible d’accéder au microphone')
    }
  }

  const handleLeave = async () => {
    if (!confirm('Quitter cette conversation ? Elle disparaîtra de ta liste de messages.')) return
    try {
      await messagesApi.leaveConversation(conversationId)
      toast.success('Conversation quittée')
      window.dispatchEvent(new Event('refresh-conversations'))
      if (onCloseMobile) onCloseMobile()
      else navigate('/messages')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const handleBlock = async () => {
    try {
      const otherUser = conversation?.participants.find(p => p.user_id !== currentUser?.id)
      if (otherUser) {
        await blocksApi.block(otherUser.user_id)
        toast.success('Utilisateur bloqué')
        setShowMenu(false)
        window.dispatchEvent(new Event('refresh-conversations'))
        if (onCloseMobile) onCloseMobile()
        else navigate('/messages')
      }
    } catch (err: any) {
      if (err?.response?.status === 409) toast('Déjà bloqué', { icon: 'ℹ️' })
      else toast.error('Erreur lors du blocage')
    }
  }

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) return toast.error('Renseigne un motif')
    try {
      const otherUser = conversation?.participants.find(p => p.user_id !== currentUser?.id)
      if (otherUser) {
        await reportsApi.create({ target_type: 'user', target_id: otherUser.user_id, reason: 'other', description: reportReason })
        toast.success('Signalement envoyé')
        setShowReportModal(false)
        setReportReason('')
      }
    } catch (err) {
      toast.error('Erreur lors du signalement')
    }
  }

  if (loading || !conversation) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )

  const otherUser = conversation.participants.find(p => p.user_id !== currentUser?.id)

  const renderImages = (mediaUrl: string) => {
    try {
      const urls = JSON.parse(mediaUrl)
      if (Array.isArray(urls) && urls.length > 0) {
        return (
          <div className={`grid gap-1 mb-2 rounded-lg overflow-hidden ${urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {urls.map((url, i) => (
              <img key={i} src={url} className="w-full h-full object-cover cursor-pointer max-h-48" onClick={() => window.open(url, '_blank')} alt={`media-${i}`} />
            ))}
          </div>
        )
      }
    } catch (e) {}
    return <img src={mediaUrl} className="rounded-lg mb-2 max-h-48 object-cover cursor-pointer" alt="media" onClick={() => window.open(mediaUrl, '_blank')} />
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#e6f4e1] via-white to-[#d0e8c6] relative">
      {!hideHeader && (<header className="h-16 px-4 border-b border-emerald-200/50 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onCloseMobile} className="p-2 -ml-2 text-emerald-800 hover:bg-emerald-100/50 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #6aa84f, #4a7a35)' }}>
            {conversation.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{conversation.name}</h3>
            {isTyping ? <p className="text-xs text-emerald-600 animate-pulse">En train d'écrire...</p> : <p className="text-xs text-gray-500">En ligne</p>}
          </div>
          {otherUser && (
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => call.startCall(conversationId, otherUser.user_id, `${otherUser.first_name} ${otherUser.last_name}`, otherUser.avatar_url ?? null, 'audio')} className="p-2 rounded-full text-emerald-600 hover:bg-emerald-100 transition" title="Appel vocal">
                <Phone size={18} />
              </button>
              <button onClick={() => call.startCall(conversationId, otherUser.user_id, `${otherUser.first_name} ${otherUser.last_name}`, otherUser.avatar_url ?? null, 'video')} className="p-2 rounded-full text-emerald-600 hover:bg-emerald-100 transition" title="Appel vidéo">
                <Video size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl rounded-xl py-2 z-50 text-sm">
              <button onClick={handleLeave} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-left transition">
                <Trash2 size={16}/> Supprimer la conversation
              </button>
              <button onClick={() => { setShowReportModal(true); setShowMenu(false) }} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-orange-50 text-orange-600 text-left transition border-t border-gray-100">
                <Flag size={16}/> Signaler
              </button>
            </div>
          )}
        </div>
      </header>)}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div ref={topSentinelRef} className="flex justify-center py-2 min-h-[1px]">
          {isLoadingMore && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>}
          {!hasMore && messages.length > 0 && !isLoadingMore && <p className="text-xs text-gray-400 italic">Début de la conversation</p>}
        </div>

        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm italic">Aucun message pour le moment. Dis bonjour ! 👋</div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id
          const isDeleted = !!msg.deleted_at
          const isEditing = editingMessageId === msg.id

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
              {!isDeleted && !isEditing && (
                <div className={`absolute -top-8 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-md border border-gray-100 rounded-full px-2 py-1 z-10`}>
                  <button onClick={() => setReplyToMessage(msg)} className="p-1 text-gray-500 hover:text-emerald-600" title="Répondre"><Reply size={14} /></button>
                  <button onClick={() => setShowReactionPicker(msg.id)} className="p-1 text-gray-500 hover:text-emerald-600"><Smile size={14} /></button>
                  {isMe && (
                    <>
                      <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content) }} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                      <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              )}

              {showReactionPicker === msg.id && (
                <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} bg-white shadow-xl rounded-full px-3 py-1.5 flex gap-2 z-20 border border-gray-100`}>
                  {['❤️', '👍', '😂', '😮', '😢'].map(emoji => (
                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-lg hover:scale-125 transition">{emoji}</button>
                  ))}
                </div>
              )}

              <div
                className={`max-w-[75%] px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  isMe
                    ? 'text-white rounded-t-3xl rounded-bl-3xl rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-t-3xl rounded-br-3xl rounded-bl-sm'
                } ${isDeleted ? 'opacity-60 italic' : ''}`}
                style={isMe ? { background: 'linear-gradient(135deg, #6aa84f 0%, #3d6b2b 100%)' } : {}}
              >
                {isDeleted ? (
                  <p className="text-sm">Ce message a été supprimé.</p>
                ) : isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-white/20 text-white placeholder-white/50 border border-white/30 rounded px-2 py-1 text-sm outline-none w-full"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMessageId(null)} className="text-xs text-white/70 hover:text-white">Annuler</button>
                      <button onClick={() => handleEditMessage(msg.id)} className="text-xs font-bold flex items-center gap-1"><Check size={12}/> OK</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.reply_to_message && (
                      <div className={`mb-2 pl-2 border-l-2 ${isMe ? 'border-white/40 bg-white/10' : 'border-emerald-400 bg-emerald-50'} rounded-r px-2 py-1 text-xs`}>
                        <div className={`font-semibold mb-0.5 ${isMe ? 'text-white/90' : 'text-emerald-700'}`}>
                          {msg.reply_to_message.author?.first_name} {msg.reply_to_message.author?.last_name}
                        </div>
                        <div className={`truncate ${isMe ? 'text-white/70' : 'text-gray-600'}`}>
                          {msg.reply_to_message.deleted_at ? 'Message supprimé' : msg.reply_to_message.type === 'image' ? '📷 Photo' : msg.reply_to_message.type === 'video' ? '🎬 Vidéo' : msg.reply_to_message.type === 'audio' ? '🎤 Vocal' : msg.reply_to_message.content}
                        </div>
                      </div>
                    )}

                    {/* BULLE CALL */}
                    {msg.type === 'call' && (() => {
                      try {
                        const callData = JSON.parse(msg.content)
                        const isVideo = callData.callType === 'video'
                        const status = callData.status
                        const duration = callData.duration || 0
                        const isMissed = status === 'missed' || status === 'rejected'
                        const Icon = isVideo ? Video : Phone
                        return (
                          <div className={`flex items-center gap-2 mb-1 ${isMe ? 'text-white' : 'text-gray-800'}`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isMissed ? 'bg-red-100 text-red-500' : (isMe ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600')}`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs font-medium flex items-center gap-1 ${isMissed ? 'text-red-500' : ''}`}>
                                {isMissed && <PhoneOff size={11} />}
                                {isMissed ? 'Appel manqué' : `Appel ${isVideo ? 'vidéo' : 'vocal'} ${isMe ? 'émis' : 'reçu'}`}
                              </p>
                              <p className={`text-[10px] ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                {duration > 0 ? `${Math.floor(duration / 60)}m${duration % 60}s` : 'Aucune réponse'}
                              </p>
                            </div>
                          </div>
                        )
                      } catch {
                        return <p className="text-xs italic">Message d'appel</p>
                      }
                    })()}

                    {msg.type === 'image' && msg.media_url && renderImages(msg.media_url)}

                    {msg.type === 'video' && msg.media_url && (
                      <video controls className="rounded-lg mb-2 max-h-48 object-cover">
                        <source src={msg.media_url} />
                      </video>
                    )}

                    {msg.type === 'audio' && msg.media_url && (
                      <audio controls className="mb-2 max-w-full h-10">
                        <source src={msg.media_url} />
                      </audio>
                    )}

                    {msg.type === 'file' && msg.media_url && (
                      <a
                        href={msg.media_url}
                        download={msg.content || 'fichier'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 mb-2 p-2 rounded-lg transition ${isMe ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
                      >
                        <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
                          <FileText size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{msg.content || 'Fichier'}</p>
                          <p className={`text-[10px] ${isMe ? 'opacity-70' : 'text-gray-500'}`}>Cliquer pour télécharger</p>
                        </div>
                        <Download size={16} className="shrink-0 opacity-70" />
                      </a>
                    )}

                    {msg.type !== 'call' && msg.content && <p className="text-sm">{msg.content}</p>}

                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <span key={emoji} className={`text-[11px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${isMe ? 'bg-white/20' : 'bg-gray-100'}`}>
                            {emoji} <span className="font-bold">{users.length}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {msg.edited_at && <span className="italic mr-1">modifié</span>}
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <CheckCheck size={12} className={msg.id === messages[messages.length-1]?.id ? 'text-white' : ''} />}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {isTyping && <div className="text-emerald-600 text-xs italic animate-pulse">✏️ L'utilisateur écrit...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-white/90 backdrop-blur-xl border-t border-emerald-100 flex items-center gap-3 overflow-x-auto shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {otherUser && (
          <Link to={`/u/${otherUser.username}`} className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#0ba360] text-white shadow-md hover:scale-110 transition" title="Voir le profil">
            <User size={18} />
          </Link>
        )}
        <Link to={`/shops/1`} className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#3b82f6] text-white shadow-md hover:scale-110 transition" title="Voir la boutique">
          <Store size={18} />
        </Link>
        <button onClick={() => setShowArchive(true)} className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#8b5cf6] text-white shadow-md hover:scale-110 transition" title="Archives médias">
          <FolderOpen size={18} />
        </button>
        <button onClick={handleBlock} className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#ef4444] text-white shadow-md hover:scale-110 transition" title="Bloquer">
          <Ban size={18} />
        </button>
        {otherUser && (
          <>
            <button onClick={() => call.startCall(conversationId, otherUser.user_id, `${otherUser.first_name} ${otherUser.last_name}`, otherUser.avatar_url ?? null, 'audio')} className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-md hover:scale-110 transition" title="Appel vocal">
              <Phone size={18} />
            </button>
            <button onClick={() => call.startCall(conversationId, otherUser.user_id, `${otherUser.first_name} ${otherUser.last_name}`, otherUser.avatar_url ?? null, 'video')} className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white shadow-md hover:scale-110 transition" title="Appel vidéo">
              <Video size={18} />
            </button>
          </>
        )}
      </div>

      <footer className="p-3 bg-white/80 backdrop-blur-xl border-t border-emerald-100 shrink-0 relative">
        {replyToMessage && (
          <div className="absolute bottom-full left-0 right-0 px-3 py-2 bg-white/95 backdrop-blur-xl border-t border-emerald-100 flex items-center gap-2 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
            <Reply size={16} className="text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0 border-l-2 border-emerald-500 pl-2">
              <p className="text-xs font-semibold text-emerald-700">
                {replyToMessage.author?.first_name} {replyToMessage.author?.last_name}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {replyToMessage.deleted_at ? 'Message supprimé' : replyToMessage.type === 'image' ? '📷 Photo' : replyToMessage.type === 'video' ? '🎬 Vidéo' : replyToMessage.type === 'audio' ? '🎤 Vocal' : replyToMessage.content}
              </p>
            </div>
            <button onClick={() => setReplyToMessage(null)} className="p-1 text-gray-400 hover:text-red-500 rounded-full">
              <X size={16} />
            </button>
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative shrink-0">
                    <img src={url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-emerald-200 shadow-sm" />
                    <button onClick={() => removePreviewImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-end">
                <textarea
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Ajouter une légende..."
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:border-emerald-500 outline-none resize-none"
                  rows={2}
                />
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setPreviewFiles([]); setPreviewUrls([]) }} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">Annuler</button>
                  <button onClick={confirmImagesSend} className="px-4 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition shadow-md flex items-center gap-2">
                    <Send size={14}/> Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewFile && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <FileText size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{previewFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(previewFile.size)}</p>
                </div>
                <button onClick={cancelFilePreview} className="p-1.5 bg-red-500 text-white rounded-full shadow-md shrink-0">
                  <X size={14} />
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={cancelFilePreview} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">Annuler</button>
                <button onClick={confirmFileSend} className="px-4 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition shadow-md flex items-center gap-2">
                  <Send size={14}/> Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {previewVideoUrl && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
            <div className="flex flex-col gap-3">
              <div className="relative w-full max-w-sm mx-auto">
                <video src={previewVideoUrl} controls className="w-full rounded-xl border border-emerald-200 shadow-sm max-h-48 object-cover" />
                <button onClick={cancelVideoPreview} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-2 items-end">
                <textarea
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  placeholder="Ajouter une légende..."
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:border-emerald-500 outline-none resize-none"
                  rows={2}
                />
                <div className="flex gap-2 shrink-0">
                  <button onClick={cancelVideoPreview} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">Annuler</button>
                  <button onClick={confirmVideoSend} className="px-4 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition shadow-md flex items-center gap-2">
                    <Send size={14}/> Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-1 bg-white border-2 border-emerald-100 rounded-3xl p-1.5 shadow-sm focus-within:border-emerald-400 transition-colors">
          <label className="p-1.5 text-emerald-600 hover:text-emerald-800 cursor-pointer transition" title="Envoyer des images">
            <ImageIcon size={18} />
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          </label>
          <label className="p-1.5 text-emerald-600 hover:text-emerald-800 cursor-pointer transition" title="Envoyer une vidéo">
            <Video size={18} />
            <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
          </label>
          <label className="p-1.5 text-emerald-600 hover:text-emerald-800 cursor-pointer transition" title="Envoyer un fichier (PDF, doc, zip...)">
            <Paperclip size={18} />
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.zip,.rar,.7z,.gz,.tar,application/*,text/*" className="hidden" onChange={handleFileSelect} />
          </label>
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-1.5 transition flex items-center justify-center rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-emerald-600 hover:text-emerald-800'}`}
            title={isRecording ? 'Arrêter l’enregistrement' : 'Enregistrer un vocal'}
          >
            {isRecording ? (
              <div className="flex items-center gap-1 px-0.5">
                <Square size={12} fill="currentColor" />
                <span className="text-[10px] font-bold">{recordingTime}s</span>
              </div>
            ) : (
              <Mic size={18} />
            )}
          </button>
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            placeholder={isRecording ? "Enregistrement en cours..." : "Écris ton message..."}
            disabled={isRecording}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 outline-none disabled:opacity-50"
          />
          <button type="submit" disabled={!inputText.trim() || isRecording} className="flex items-center justify-center w-9 h-9 rounded-full text-white disabled:opacity-50 transition shadow-md hover:shadow-lg shrink-0" style={{ background: ANKU.green }}>
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </footer>

      {showArchive && <MediaArchive messages={messages} onClose={() => setShowArchive(false)} />}

      {showReportModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-3">Signaler la conversation</h3>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none mb-4"
              rows={3}
              placeholder="Explique brièvement le problème..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition">Annuler</button>
              <button onClick={handleReportSubmit} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-md">Signaler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}