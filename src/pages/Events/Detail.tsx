import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Heart, Calendar, MapPin, Loader, Share2, BookOpen, Link as LinkIcon, Ticket } from 'lucide-react'
import eventsApi from '../../service/api/events.api'
import type { Event } from '../../types/event'
import AnimatedShopsBackground from '../../components/shops/AnimatedShopsBackground'
import QuickMenu from '../../components/shops/QuickMenu'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35' }

const IconFacebook = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
const IconInstagram = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const IconWhatsApp = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await eventsApi.getById(Number(id))
        if (res && res.event) {
          setEvent(res.event)
        }
      } catch (err: any) {
        console.error("❌ ERREUR CHARGEMENT ÉVÉNEMENT :", err?.response?.data || err)
        toast.error('Événement introuvable.')
        navigate('/events')
      } finally { setLoading(false) }
    }
    fetchEventData()
  }, [id, navigate])

  const handleLike = async () => {
    if (!event || liking) return
    setLiking(true)
    try {
      await eventsApi.toggleLike(event.id)
      setEvent(prev => prev ? { ...prev, is_liked: !prev.is_liked, likes_count: prev.is_liked ? (prev.likes_count || 1) - 1 : (prev.likes_count || 0) + 1 } : null)
    } catch { toast.error('Erreur lors du like.') } finally { setLiking(false) }
  }

  const confirmRegistration = async () => {
    if (!event || registering) return
    setRegistering(true)
    try {
      if (event.is_registered) {
        await eventsApi.unregister(event.id)
        setEvent(prev => prev ? { ...prev, is_registered: false, registered_count: Math.max(0, (prev.registered_count || 1) - 1) } : null)
        toast.success('Inscription annulée')
      } else {
        await eventsApi.register(event.id)
        setEvent(prev => prev ? { ...prev, is_registered: true, registered_count: (prev.registered_count || 0) + 1 } : null)
        toast.success('Inscription confirmée ! 🎉')
      }
      setShowRegisterModal(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur")
    } finally { setRegistering(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader size={32} className="animate-spin text-emerald-500" /></div>
  if (!event) return null

  const dateStr = new Date(event.start_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  const isFull = event.capacity && event.registered_count && event.registered_count >= event.capacity
  const isPast = new Date(event.end_at || event.start_at).getTime() < new Date().getTime()
  
  const shareUrl = window.location.href
  const shareTitle = encodeURIComponent(event.title)

  const shareLinks = [
    { name: 'WhatsApp', icon: IconWhatsApp, url: `https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`, color: '#25D366' },
    { name: 'Facebook', icon: IconFacebook, url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, color: '#1877F2' },
    { name: 'X (Twitter)', icon: IconX, url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`, color: '#000000' },
    { name: 'Instagram', icon: IconInstagram, url: `https://www.instagram.com/`, color: '#E1306C' },
  ]

  return (
    <div className="min-h-screen bg-[#fcfbf9] pb-20 relative overflow-hidden">
      <AnimatedShopsBackground />
      <QuickMenu />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:pl-24 pt-8">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition mb-6 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <ArrowLeft size={16} /> Retour aux Événements
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white shadow-sm bg-emerald-600">
              {event.type}
            </span>
            <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
              <Calendar size={14} /> {dateStr}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black text-gray-900 leading-tight mb-4">{event.title}</h1>
          
          {event.description && (
            <p className="text-lg text-gray-600 leading-relaxed font-serif italic mb-6">{event.description}</p>
          )}

          <div className="flex items-center gap-6 border-t border-gray-100 pt-6">
            <Link to={`/u/${event.organizer?.username}`} className="flex items-center gap-3 group">
              {event.organizer?.avatar_url ? (
                <img src={event.organizer.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-emerald-400 transition-colors" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white bg-emerald-500 shadow-sm">{event.organizer?.first_name?.[0]}{event.organizer?.last_name?.[0]}</div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Par {event.organizer?.first_name} {event.organizer?.last_name}</p>
                <p className="text-xs text-gray-500">@{event.organizer?.username}</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full ml-auto">
              <span className="flex items-center gap-1.5"><MapPin size={16} className="text-red-400"/> {event.city || 'Lieu non précisé'}</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">{event.is_free ? 'Gratuit' : `${event.price} €`}</span>
            </div>
          </div>
        </div>

        {event.cover_url && (
          <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8 bg-white p-2">
            <img src={event.cover_url} alt={event.title} className="w-full max-h-[500px] object-cover rounded-2xl" />
          </div>
        )}

        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} disabled={liking} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all ${event.is_liked ? 'bg-red-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
              <Heart size={18} fill={event.is_liked ? 'currentColor' : 'none'} /> {event.likes_count || 0}
            </button>
            
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
                <Share2 size={18} /> Partager
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-2 space-y-1">
                    {shareLinks.map((link) => (
                      <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition">
                        <link.icon /> <span style={{ color: link.color }}>{link.name}</span>
                      </a>
                    ))}
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        try {
                          toast.loading('Partage sur ANKU...', { id: 'share-anku' })
                          await eventsApi.share(event.id, { share_comment: "Je participe à cet événement !" })
                          toast.success('Partagé sur ton profil ANKU ! 🎉', { id: 'share-anku' })
                          setShowShareMenu(false)
                        } catch { toast.error('Erreur lors du partage', { id: 'share-anku' }) }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      <BookOpen size={18} /> Partager sur ANKU
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Lien copié !'); setShowShareMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition"
                    >
                      <LinkIcon size={18} className="text-gray-400" /> Copier le lien
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowRegisterModal(true)}
            disabled={!!isFull && !event.is_registered || isPast}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${
              isPast 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : event.is_registered 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isPast 
              ? 'Événement terminé' 
              : event.is_registered 
                ? 'Inscrit(e) ✅' 
                : isFull 
                  ? 'Complet' 
                  : <><Ticket size={18} /> Participer</>}
          </button>
        </div>

      </div>

      {/* POPUP DE CONFIRMATION D'INSCRIPTION */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Ticket size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {event.is_registered ? "Annuler l'inscription ?" : "Confirmer l'inscription ?"}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {event.is_registered 
                  ? `Tu ne participeras plus à "${event.title}".`
                  : `Tu vas participer à "${event.title}" le ${dateStr}.`}
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setShowRegisterModal(false)} disabled={registering} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                  Annuler
                </button>
                <button onClick={confirmRegistration} disabled={registering} className="flex-1 py-2.5 rounded-xl font-bold text-white shadow-md transition flex items-center justify-center" style={{ background: ANKU.green }}>
                  {registering ? <Loader size={18} className="animate-spin" /> : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}