import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MessageSquare, Search, Loader } from 'lucide-react'
import messagesApi from '../service/api/messages.api'
import type { Conversation } from '../types/message'
import ChatWindow from '../components/chat/ChatWindow'
import AppHeader from '../components/layout/AppHeader'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('c') ? Number(searchParams.get('c')) : null

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchConversations = async () => {
    try {
      const res = await messagesApi.listConversations()
      setConversations(res.conversations)
    } catch (err) {
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()

    // 🆕 Écouter l'événement de rafraîchissement venant du WebSocket (AppHeader)
    const handler = () => fetchConversations()
    window.addEventListener('refresh-conversations', handler)
    return () => window.removeEventListener('refresh-conversations', handler)
  }, [])

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true
    return (c.name || '').toLowerCase().includes(search.toLowerCase())
  })

  const openChat = (id: number) => setSearchParams({ c: id.toString() })
  const closeChat = () => setSearchParams({})

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Loader className="animate-spin text-emerald-600" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#e6f4e1] via-white to-[#d0e8c6]">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Liste des discussions */}
        <div className={`w-full md:w-96 bg-white/80 backdrop-blur-xl border-r border-emerald-100 flex flex-col h-[calc(100vh-64px)] ${activeId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-emerald-100 flex items-center gap-2 bg-white/50">
            <MessageSquare size={20} style={{ color: ANKU.greenDark }} />
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl bg-white border border-emerald-100 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">Aucune conversation pour le moment.</div>
            ) : (
              filtered.map((conv) => {
                const isActive = activeId === conv.id
                const hasUnread = conv.unread_count > 0
                return (
                  <button key={conv.id} onClick={() => openChat(conv.id)} className={`w-full flex items-center gap-3 p-4 transition border-b border-gray-50 ${isActive ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' : 'hover:bg-emerald-50/50'}`}>
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #6aa84f, #4a7a35)' }}>{conv.name?.[0]?.toUpperCase()}</div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{conv.name}</p>
                        {conv.last_message_at && <span className={`text-[10px] ${hasUnread ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>{new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate pr-2 ${hasUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{conv.last_message_preview || 'Nouvelle conversation'}</p>
                        {hasUnread && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm" style={{ background: ANKU.green }}>{conv.unread_count}</span>}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Zone de Chat */}
        <div className={`flex-1 h-[calc(100vh-64px)] ${!activeId ? 'hidden md:flex' : 'flex'} flex-col relative`}>
          {activeId ? (
            <ChatWindow conversationId={activeId} onCloseMobile={closeChat} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col bg-white/40 backdrop-blur-sm">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #6aa84f, #4a7a35)' }}>
                <MessageSquare size={40} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Tes messages</h2>
              <p className="text-sm mt-2 max-w-xs text-center">Sélectionne une conversation à gauche ou démarre une discussion depuis un profil.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}