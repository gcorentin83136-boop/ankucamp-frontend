import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MessageSquare, Search, Loader, Trash2, Phone, Video } from 'lucide-react'
import messagesApi from '../service/api/messages.api'
import type { Conversation } from '../types/message'
import ChatWindow from '../components/chat/ChatWindow'
import { useCallContext } from '../context/CallContext'
import { useAuthStore } from '../context/AuthContext'
import AppHeader from '../components/layout/AppHeader'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

type Tab = 'messages' | 'calls'

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('c') ? Number(searchParams.get('c')) : null
  const call = useCallContext()
  const auth = useAuthStore()
  const currentUser = (auth as any)?.user

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('messages')

  const fetchConversations = async () => {
    try {
      const res = await messagesApi.listConversations()
      setConversations(res.conversations)
    } catch {
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const handler = () => fetchConversations()
    window.addEventListener('refresh-conversations', handler)
    return () => window.removeEventListener('refresh-conversations', handler)
  }, [])

  const handleDeleteConv = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation ? Elle disparaîtra de ta liste.')) return

    try {
      await messagesApi.leaveConversation(id)
      toast.success('Conversation supprimée')
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) setSearchParams({})
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true
    return (c.name || '').toLowerCase().includes(search.toLowerCase())
  })

  // Onglet Appels : conversations dont le last_message_preview contient 📞
  const callConversations = filtered.filter((c) =>
    c.last_message_preview?.includes('📞')
  )

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

          {/* Onglets Messages / Appels */}
          <div className="flex border-b border-emerald-100 bg-white/70">
            <button
              onClick={() => setTab('messages')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-sm font-medium transition border-b-2 ${
                tab === 'messages'
                  ? 'text-emerald-700 border-emerald-500 bg-emerald-50/50'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={14} />
              Messages
            </button>
            <button
              onClick={() => setTab('calls')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-sm font-medium transition border-b-2 ${
                tab === 'calls'
                  ? 'text-emerald-700 border-emerald-500 bg-emerald-50/50'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              <Phone size={14} />
              Appels
              {callConversations.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === 'calls' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {callConversations.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl bg-white border border-emerald-100 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'messages' ? (
              // ─── ONGLET MESSAGES ───
              filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Aucune conversation pour le moment.</div>
              ) : (
                filtered.map((conv) => {
                  const isActive = activeId === conv.id
                  const hasUnread = conv.unread_count > 0
                  return (
                    <div
                      key={conv.id}
                      onClick={() => openChat(conv.id)}
                      className={`relative group cursor-pointer w-full flex items-center gap-3 p-4 transition border-b border-gray-50 ${isActive ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' : 'hover:bg-emerald-50/50'}`}
                    >
                      {conv.avatar_url ? (
                        <img src={conv.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #6aa84f, #4a7a35)' }}>{conv.name?.[0]?.toUpperCase()}</div>
                      )}

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{conv.name}</p>
                          {conv.last_message_at && (
                            <span
                              className={`text-[10px] shrink-0 ml-2 transition-opacity duration-200 opacity-0 md:opacity-100 md:group-hover:opacity-0 ${
                                hasUnread ? 'text-emerald-600 font-bold' : 'text-gray-400'
                              }`}
                            >
                              {new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={`text-xs truncate pr-2 ${hasUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{conv.last_message_preview || 'Nouvelle conversation'}</p>
                          {hasUnread && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm" style={{ background: ANKU.green }}>{conv.unread_count}</span>}
                        </div>
                      </div>

                      {/* 🆕 Boutons d'appel (hover desktop, toujours visible mobile) */}
                      {(() => {
                        const other = conv.participants?.find(
                          (p: any) => p.user_id !== currentUser?.id
                        )
                        if (!other) return null
                        return (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                call.startCall(conv.id, other.user_id, other.first_name + ' ' + other.last_name, other.avatar_url ?? null, 'audio')
                              }}
                              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-sm"
                              title="Appel vocal"
                            >
                              <Phone size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                call.startCall(conv.id, other.user_id, other.first_name + ' ' + other.last_name, other.avatar_url ?? null, 'video')
                              }}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-sm"
                              title="Appel vidéo"
                            >
                              <Video size={14} />
                            </button>
                          </div>
                        )
                      })()}

                      <button
                        onClick={(e) => handleDeleteConv(e, conv.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer la conversation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })
              )
            ) : (
              // ─── ONGLET APPELS ───
              callConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2 py-10">
                  <Phone size={32} className="text-gray-300" />
                  <p>Aucun appel pour le moment.</p>
                </div>
              ) : (
                callConversations.map((conv) => {
                  const isActive = activeId === conv.id
                  const isVideo = conv.last_message_preview?.includes('vidéo')
                  const isMissed = conv.last_message_preview?.includes('manqué')
                  return (
                    <div
                      key={conv.id}
                      onClick={() => openChat(conv.id)}
                      className={`cursor-pointer w-full flex items-center gap-3 p-4 transition border-b border-gray-50 ${isActive ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' : 'hover:bg-emerald-50/50'}`}
                    >
                      {conv.avatar_url ? (
                        <img src={conv.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #6aa84f, #4a7a35)' }}>{conv.name?.[0]?.toUpperCase()}</div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isMissed ? 'text-red-500' : 'font-semibold text-gray-700'}`}>{conv.name}</p>
                        <p className={`text-xs truncate flex items-center gap-1 mt-0.5 ${isMissed ? 'text-red-500' : 'text-gray-500'}`}>
                          {isVideo ? <Video size={12} /> : <Phone size={12} />}
                          {conv.last_message_preview || 'Appel'}
                        </p>
                      </div>

                      {conv.last_message_at && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(conv.last_message_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )
                })
              )
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