import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, Calendar, MapPin, Clock, Heart, Filter, Ticket, Loader, MessageCircle } from 'lucide-react'
import eventsApi from '../service/api/events.api'
import type { Event, EventType } from '../types/event'
import AnimatedShopsBackground from '../components/shops/AnimatedShopsBackground'
import QuickMenu from '../components/shops/QuickMenu'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

const EVENT_TYPES: { value: EventType | 'all', label: string, color: string }[] = [
  { value: 'all', label: 'Tous les événements', color: '#1f1f1f' },
  { value: 'marche', label: 'Marchés', color: '#e67e22' },
  { value: 'atelier', label: 'Ateliers', color: '#3498db' },
  { value: 'salon', label: 'Salons', color: '#9b59b6' },
  { value: 'porte_ouverte', label: 'Portes ouvertes', color: '#e74c3c' },
  { value: 'degustation', label: 'Dégustations', color: '#f1c40f' },
  { value: 'autre', label: 'Autres', color: '#7f8c8d' },
]

function formatDate(iso: string): { day: string, month: string, full: string } {
  try {
    const d = new Date(iso)
    return {
      day: d.toLocaleDateString('fr-FR', { day: '2-digit' }),
      month: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      full: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    }
  } catch {
    return { day: '--', month: '---', full: iso }
  }
}

export default function Events() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')
  const [registeringId, setRegisteringId] = useState<number | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsApi.list({ limit: 50, upcoming: false })
        if (res && res.events) {
          setEvents(res.events)
        }
      } catch (err: any) {
        console.error("❌ ERREUR API EVENTS :", err)
        toast.error('Impossible de charger les événements.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    let result = events
    if (typeFilter !== 'all') {
      result = result.filter(e => e.type === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.address && e.address.toLowerCase().includes(q))
      )
    }
    return result
  }, [events, search, typeFilter])

  const handleRegister = async (e: React.MouseEvent, eventId: number, isRegistered?: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (registeringId === eventId) return
    
    setRegisteringId(eventId)
    try {
      if (isRegistered) {
        await eventsApi.unregister(eventId)
        toast.success('Inscription annulée')
      } else {
        await eventsApi.register(eventId)
        toast.success('Inscription confirmée ! 🎉')
      }
      
      setEvents(prev => prev.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            is_registered: !isRegistered,
            registered_count: isRegistered ? Math.max(0, (ev.registered_count || 1) - 1) : (ev.registered_count || 0) + 1
          }
        }
        return ev
      }))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'inscription")
    } finally {
      setRegisteringId(null)
    }
  }

  const handleLike = async (e: React.MouseEvent, eventId: number, isLiked?: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await eventsApi.toggleLike(eventId)
      setEvents(prev => prev.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            is_liked: !isLiked,
            likes_count: isLiked ? Math.max(0, (ev.likes_count || 1) - 1) : (ev.likes_count || 0) + 1
          }
        }
        return ev
      }))
    } catch {
      toast.error('Erreur lors du like')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative overflow-hidden">
      <AnimatedShopsBackground />
      <QuickMenu />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:pl-24 pt-6">
        
        <div className="rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm mb-8" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)' }}>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md border border-emerald-100 shrink-0">
              <Calendar size={32} style={{ color: ANKU.greenDark }} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Les Événements ANKU
              </h1>
              <p className="text-gray-600 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">
                Découvre les marchés, ateliers et rencontres près de chez toi. Rejoins la communauté !
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex flex-col md:flex-row gap-4 items-center mb-10">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un événement, une ville..."
              className="w-full rounded-xl bg-gray-50 border-none py-3.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>
          <div className="w-full md:w-px h-px md:h-8 bg-gray-200"></div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
            <Filter size={16} className="text-gray-400 shrink-0 ml-2 mr-1" />
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  typeFilter === t.value
                    ? 'text-white border-transparent shadow-md scale-105'
                    : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                }`}
                style={{ background: typeFilter === t.value ? t.color : undefined }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-emerald-500 mb-4" />
            <p className="text-sm font-semibold text-gray-500">Chargement des événements…</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun événement trouvé</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {search || typeFilter !== 'all' ? 'Essaie de modifier tes filtres.' : 'Reviens plus tard, de nouveaux événements arrivent bientôt.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const dateInfo = formatDate(ev.start_at)
              const typeObj = EVENT_TYPES.find(t => t.value === ev.type) || EVENT_TYPES[6]
              const isFull = ev.capacity && ev.registered_count && ev.registered_count >= ev.capacity
              
              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    {ev.cover_url ? (
                      <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                        <Calendar size={32} className="text-emerald-200" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md text-center px-3 py-1.5 flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-lg font-black text-gray-900 leading-none">{dateInfo.day}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{dateInfo.month}</span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white shadow-md" style={{ background: typeObj.color }}>
                        {typeObj.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition mb-3">
                      {ev.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <Clock size={14} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{dateInfo.full}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <MapPin size={14} className="text-red-400 shrink-0" />
                        <span className="truncate">{ev.address ? `${ev.address}, ` : ''}{ev.city || 'Lieu non précisé'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-3">
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/author hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); navigate(`/u/${ev.organizer?.username}`); }}
                      >
                        {ev.organizer?.avatar_url ? (
                          <img src={ev.organizer.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500">
                            {ev.organizer?.first_name?.[0]}{ev.organizer?.last_name?.[0]}
                          </div>
                        )}
                        <span className="text-xs font-bold text-gray-800 group-hover/author:text-emerald-600 truncate max-w-[100px]">
                          {ev.organizer?.first_name} {ev.organizer?.last_name}
                        </span>
                      </div>
                      <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        {ev.is_free ? 'Gratuit' : `${ev.price} €`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mb-3">
                      <button onClick={(e) => handleLike(e, ev.id, ev.is_liked)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${ev.is_liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                        <Heart size={14} fill={ev.is_liked ? 'currentColor' : 'none'} /> {ev.likes_count || 0}
                      </button>
                      
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          navigate(`/events/${ev.id}#comments`); 
                        }} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
                      >
                        <MessageCircle size={14} /> Commenter
                      </button>
                    </div>

                    <button
                      onClick={(e) => handleRegister(e, ev.id, ev.is_registered)}
                      disabled={!!isFull && !ev.is_registered}
                      className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl font-bold text-sm transition shadow-sm ${
                        ev.is_registered 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {registeringId === ev.id ? (
                        <Loader size={16} className="animate-spin" />
                      ) : ev.is_registered ? (
                        <>Inscrit(e) ✅</>
                      ) : isFull ? (
                        'Complet'
                      ) : (
                        <><Ticket size={16} /> Participer</>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}