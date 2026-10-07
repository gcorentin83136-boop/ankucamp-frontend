import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Calendar, Loader, MapPin, Users, Clock, Plus } from 'lucide-react'
import eventsApi from '../../service/api/events.api'
import type { Event } from '../../types/event'

const ANKU = { green: '#6aa84f', greenDark: '#4a7a35', greenPale: '#f0f9e8' }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const TYPE_LABELS: Record<string, string> = {
  marche: 'Marché', atelier: 'Atelier', salon: 'Salon',
  porte_ouverte: 'Porte ouverte', degustation: 'Dégustation', autre: 'Autre',
}

export default function BuyerEvents() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await eventsApi.listMine()
        setEvents(res.events)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)', border: '1px solid rgba(106,168,79,0.13)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={20} style={{ color: ANKU.greenDark }} />
              <h2 className="text-lg font-bold text-gray-900">Mes événements</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {events.length} événement{events.length > 1 ? 's' : ''} que tu organises
            </p>
          </div>
          <Link to="/events" className="rounded-full px-4 py-2 text-sm font-bold text-white flex items-center gap-2" style={{ background: ANKU.green }}>
            <Plus size={14} /> Explorer les événements
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">Aucun événement</p>
          <p className="text-xs text-gray-500 mt-1">Tu n’organises encore aucun événement</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {events.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
              {e.cover_url ? (
                <img src={e.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: ANKU.greenPale, color: ANKU.greenDark }}>
                  <Calendar size={20} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 truncate">{e.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{TYPE_LABELS[e.type] ?? e.type}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <Clock size={10} /> {formatDate(e.start_at)} · {formatTime(e.start_at)}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                  {e.city && <span className="flex items-center gap-1"><MapPin size={10} />{e.city}</span>}
                  <span className="flex items-center gap-1"><Users size={10} />{e.registered_count ?? 0}{e.capacity ? '/' + e.capacity : ''}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
