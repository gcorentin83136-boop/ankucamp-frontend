import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Minimize2, X, ExternalLink, Leaf } from 'lucide-react'
import ChatWindow from './ChatWindow'

export default function FloatingChatBubble() {
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [convName, setConvName] = useState<string>('Discussion')
  const [lastAvatar, setLastAvatar] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Charge l'état du toggle depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('anku_chat_bubble_enabled')
    if (saved === 'false') setEnabled(false)
    else setEnabled(true)
  }, [])

  // Écoute l'événement de nouveau message
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      const msg = customEvent.detail

      if (!enabled) return
      if (!msg || !msg.conversation_id) return

      // Met à jour les infos du dernier contact
      setActiveConvId(msg.conversation_id)
      setConvName(`${msg.author?.first_name} ${msg.author?.last_name}`)
      if (msg.author?.avatar_url) setLastAvatar(msg.author.avatar_url)

      // Si la fenêtre est fermée, on incrémente juste le badge
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    window.addEventListener('anku:new-message', handler)
    return () => window.removeEventListener('anku:new-message', handler)
  }, [enabled, isOpen])

  // Écoute le toggle des paramètres
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      setEnabled(customEvent.detail)
      if (!customEvent.detail) {
        setIsOpen(false)
        setActiveConvId(null)
        setLastAvatar(null)
        setUnreadCount(0)
      }
    }
    window.addEventListener('anku:chat-bubble-toggle', handler)
    return () => window.removeEventListener('anku:chat-bubble-toggle', handler)
  }, [])

  if (!enabled) return null

  // 🆕 Si on n'a jamais reçu de message (activeConvId null), on n'affiche rien !
  if (!activeConvId) return null

  const handleMinimize = () => {
    setIsOpen(false) // Réduit juste la fenêtre, la bulle reste
  }

  const handleClose = () => {
    // Ferme tout et fait disparaître la bulle
    setIsOpen(false)
    setActiveConvId(null)
    setLastAvatar(null)
    setUnreadCount(0)
  }

  const handleExpand = () => {
    if (activeConvId) {
      navigate(`/messages?c=${activeConvId}`)
      handleClose()
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  return (
    <>
      {/* 🍃 Mini-fenêtre de chat (remontée) */}
      {isOpen && (
        <div
          className="fixed bottom-48 right-6 w-[360px] h-[500px] bg-white z-[9999] flex flex-col overflow-hidden shadow-2xl border border-emerald-200"
          style={{ borderRadius: '24px 8px 24px 8px' }}
        >
          <header className="h-12 px-3 border-b border-emerald-100 bg-gradient-to-r from-[#6aa84f] to-[#4a7a35] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Leaf size={16} />
              {convName}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="p-1.5 text-white/80 hover:bg-white/20 rounded-md transition"
                title="Réduire"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={handleExpand}
                className="p-1.5 text-white/80 hover:bg-white/20 rounded-md transition"
                title="Ouvrir en pleine page"
              >
                <ExternalLink size={16} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 text-white/80 hover:bg-red-500 rounded-md transition"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            <ChatWindow
              conversationId={activeConvId}
              onCloseMobile={handleClose}
              hideHeader={true}
            />
          </div>
        </div>
      )}

      {/* 🍃 Bouton flottant : Forme de "Feuille Galet" asymétrique */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="fixed bottom-28 right-6 w-16 h-16 bg-white z-[9998] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform p-0.5"
        style={{
          borderRadius: '60% 40% 70% 30% / 40% 60% 30% 70%',
          border: '2.5px solid #6aa84f',
          transform: 'rotate(-6deg)'
        }}
        title="Messagerie"
      >
        <div
          className="w-full h-full overflow-hidden bg-gradient-to-br from-[#6aa84f] to-[#4a7a35] flex items-center justify-center text-white"
          style={{
            borderRadius: '60% 40% 70% 30% / 40% 60% 30% 70%',
            transform: 'rotate(6deg)'
          }}
        >
          {lastAvatar ? (
            <img
              src={lastAvatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <MessageSquare size={28} />
          )}
        </div>

        {/* Le petit badge de notification */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm"
            style={{ transform: 'rotate(6deg)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}