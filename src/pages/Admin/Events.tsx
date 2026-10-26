import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Calendar, Loader, MapPin, Users, Clock, ShieldAlert } from 'lucide-react'
import eventsApi from '../../service/api/events.api'
import type { Event } from '../../types/event'


export default function AdminEvents() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await eventsApi.adminListAll()
        setEvents(res.events)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="rounded-3xl p-6 sm:p-8 flex items-center justify-between flex-wrap gap-4 border" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)', borderColor: '#e5e0d8' }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-emerald-100">
              <ShieldAlert size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Tous les événements</h2>
          </div>
          <p className="text-sm text-gray-500 mt-2">{events.length} événements sur la plateforme</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader size={32} className="animate-spin text-emerald-500 mx-auto" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">Aucun événement sur la plateforme.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
              {e.cover_url ? (
                <img src={e.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-300">
                  <Calendar size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-base font-bold text-gray-900 truncate">{e.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(e.start_at).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {e.city || 'Lieu non précisé'}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {e.registered_count || 0} inscrits</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Par {e.organizer?.first_name} {e.organizer?.last_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}