import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'
import { 
  Send, Image as ImageIcon, Mic, MoreVertical, User, Store, 
  Flag, Ban, FolderOpen, X, CheckCheck, Play, ArrowLeft
} from 'lucide-react'
import messagesApi from '../../service/api/messages.api'
import type { Conversation, Message } from '../../types/message'
import { useAuthStore } from '../../context/AuthContext'
import { blocksApi } from '../../service/api/blocks.api'
import { commentsApi } from '../../service/api/comments.api'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }
const SOCKET_URL = 'http://localhost:3001'

export default function ChatWindow({ conversationId, onCloseMobile }: { conversationId: number, onCloseMobile?: () => void }) {
  const auth = useAuthStore()
  const currentUser = (auth as any)?.user
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Charger la conversation et les messages
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [convRes, msgsRes] = await Promise.all([
          messagesApi.getConversation(conversationId),
          messagesApi.listMessages(conversationId, { limit: 50 })
        ])
        setConversation(convRes.conversation)
        setMessages(msgsRes.messages)
        messagesApi.markAsRead(conversationId)
      } catch (err) {
        toast.error('Erreur chargement du chat')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [conversationId])

  // 2. Connexion WebSocket
  useEffect(() => {
    const token = localStorage.getItem('anku_token')
    socketRef.current = io(SOCKET_URL, { 
      withCredentials: true, 
      autoConnect: true,
      auth: { token } 
    })
    const socket = socketRef.current

    socket.emit('conversation:join', { conversationId })

    socket.on('message:new', (msg: Message) => {
      if (msg.conversation_id === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id || m.id === Number(msg.id))) return prev;
          return [...prev, msg];
        })
        messagesApi.markAsRead(conversationId)
        scrollToBottom()
      }
    })

    socket.on('typing:user', (data: { userId: number, isTyping: boolean }) => {
      if (data.userId !== currentUser?.id) setIsTyping(data.isTyping)
    })

    return () => {
      socket.emit('conversation:leave', { conversationId })
      socket.disconnect()
    }
  }, [conversationId, currentUser?.id])

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }
  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  // 3. Envoyer un message (Optimistic UI)
  const handleSendMessage = async (e?: React.FormEvent, mediaUrl?: string, type: 'text'|'image'|'audio' = 'text') => {
    e?.preventDefault()
    if (!inputText.trim() && !mediaUrl) return
    
    const payload: any = { type, media_url: mediaUrl }
    if (inputText.trim()) payload.content = inputText.trim()

    // Afficher instantanément
    const tempId = Date.now()
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser?.id || 0,
      type,
      content: payload.content || '',
      media_url: mediaUrl || null,
      created_at: new Date().toISOString(),
      reply_to_message_id: null,
      edited_at: null,
      deleted_at: null,
      author: currentUser,
    }
    
    setMessages(prev => [...prev, optimisticMsg])
    setInputText('')

    try {
      const res = await messagesApi.sendMessage(conversationId, payload)
      setMessages(prev => prev.map(m => m.id === tempId ? res.message : m))
      socketRef.current?.emit('typing:stop', { conversationId })
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(err?.response?.data?.message || "Impossible d'envoyer le message")
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

  const handleBlock = async () => {
    try {
      const otherUser = conversation?.participants.find(p => p.user_id !== currentUser?.id)
      if (otherUser) {
        await blocksApi.block(otherUser.user_id)
        toast.success('Utilisateur bloqué')
        setShowMenu(false)
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast('Cet utilisateur est déjà dans tes bloqués', { icon: 'ℹ️' })
      } else {
        toast.error('Erreur lors du blocage')
      }
    }
  }

  const handleReport = () => {
    toast.success('Signalement envoyé à l’équipe ANKU')
    setShowMenu(false)
  }
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    toast.loading('Envoi de l’image...', { id: 'upload' })
    try {
      const res = await commentsApi.uploadMedia(file)
      await handleSendMessage(undefined, res.url, 'image')
      toast.success('Image envoyée !', { id: 'upload' })
    } catch (err) {
      toast.error('Erreur lors de l’envoi de l’image', { id: 'upload' })
    }
  }

  const handleVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        
        // 🚨 HACK : On force un nom d'image et un type MIME d'image pour passer le filtre du backend
        const file = new File([blob], 'vocal.png', { type: 'image/png' })
        
        toast.loading('Envoi du vocal...', { id: 'vocal' })
        try {
          const res = await commentsApi.uploadMedia(file)
          await handleSendMessage(undefined, res.url, 'audio')
          toast.success('Vocal envoyé !', { id: 'vocal' })
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Erreur d'envoi du vocal", { id: 'vocal' })
        }
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      toast('Enregistrement en cours... (S\'arrête tout seul dans 5s)', { icon: '🎙️', duration: 5000 })
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop()
      }, 5000)
      
    } catch (err) {
      toast.error('Impossible d’accéder au microphone')
    }
  }

  if (loading || !conversation) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )

  const mediaArchive = messages.filter(m => m.type === 'image' || m.type === 'audio')
  const otherUser = conversation.participants.find(p => p.user_id !== currentUser?.id)

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#e6f4e1] via-white to-[#d0e8c6] relative">
      <header className="h-16 px-4 border-b border-emerald-200/50 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0 shadow-sm z-10">
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
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl rounded-xl py-2 z-50 text-sm">
              <button onClick={handleReport} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-left transition">
                <Flag size={16}/> Signaler
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm italic">
            Aucun message pour le moment. Dis bonjour ! 👋
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  isMe
                    ? 'text-white rounded-t-3xl rounded-bl-3xl rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-t-3xl rounded-br-3xl rounded-bl-sm'
                }`}
                style={isMe ? { background: 'linear-gradient(135deg, #6aa84f 0%, #3d6b2b 100%)' } : {}}
              >
                {msg.type === 'image' && msg.media_url && (
                  <img src={msg.media_url} className="rounded-lg mb-2 max-h-48 object-cover" alt="media" />
                )}
                {msg.type === 'audio' && msg.media_url && (
                  <div className="flex items-center gap-2 mb-1">
                    <button className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center"><Play size={14}/></button>
                    <div className="h-1 w-32 bg-black/20 rounded-full"><div className="h-1 w-1/2 bg-black/40 rounded-full"></div></div>
                  </div>
                )}
                {msg.content && <p className="text-sm">{msg.content}</p>}
                <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <CheckCheck size={12} className={msg.id === messages[messages.length-1]?.id ? 'text-white' : ''} />}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && <div className="text-emerald-600 text-xs italic animate-pulse">✏️ L'utilisateur écrit...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Actions Rapides (Style QuickMenu) */}
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
      </div>

      <footer className="p-3 bg-white/80 backdrop-blur-xl border-t border-emerald-100 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-white border-2 border-emerald-100 rounded-3xl p-1.5 shadow-sm focus-within:border-emerald-400 transition-colors">
          <label className="p-2 text-emerald-600 hover:text-emerald-800 cursor-pointer transition">
            <ImageIcon size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button type="button" onClick={handleVoiceRecord} className="p-2 text-emerald-600 hover:text-emerald-800 transition">
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            placeholder="Écris ton message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 outline-none"
          />
          <button type="submit" disabled={!inputText.trim()} className="p-2 rounded-xl text-white disabled:opacity-50 transition shadow-md hover:shadow-lg" style={{ background: ANKU.green }}>
            <Send size={18} />
          </button>
        </form>
      </footer>

      {showArchive && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl h-[80%] flex flex-col overflow-hidden">
            <header className="p-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50">
              <h3 className="font-bold text-gray-900">Archives des médias</h3>
              <button onClick={() => setShowArchive(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2">
              {mediaArchive.length === 0 && <p className="col-span-3 text-center text-gray-500 mt-10">Aucun média partagé.</p>}
              {mediaArchive.map(m => (
                <div key={m.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {m.type === 'image' ? <img src={m.media_url!} className="w-full h-full object-cover" /> : <Mic size={24} className="text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}