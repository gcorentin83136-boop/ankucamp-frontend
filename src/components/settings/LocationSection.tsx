import { useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Loader, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import usersApi from '../../service/api/users.api'
import shopsApi from '../../service/api/shops.api'

const ANKU_GREEN = '#6aa84f'

/**
 * Bloc réutilisable "Ma position" — même source de vérité partout
 * (settings buyer, seller, admin, profil réseau social).
 * Sauvegarde dans users.latitude/longitude + propage aux boutiques du owner.
 */
export default function LocationSection({
  showDelete = true,
  compact = false,
}: {
  showDelete?: boolean
  compact?: boolean
}) {
  const user = useAuthStore((s: any) => s.user)
  const mergeUser = useAuthStore((s: any) => s.mergeUser)
  const [loading, setLoading] = useState(false)

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n’est pas supportée par ton navigateur')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords

          // Reverse geocoding → ville + CP
          let city: string | undefined
          let postal_code: string | undefined
          try {
            const res = await fetch(
              `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}&limit=1`
            )
            if (res.ok) {
              const data = await res.json()
              const props = data.features?.[0]?.properties
              if (props) {
                city = props.city
                postal_code = props.postcode
              }
            }
          } catch {
            // silencieux
          }

          const payload: any = { latitude, longitude }
          if (city) payload.city = city
          if (postal_code) payload.postal_code = postal_code

          // 1. Update user
          await usersApi.updateMe(payload)

          // 2. Propager aux boutiques du user (si pro)
          try {
            const shopsRes = await shopsApi.listMine()
            const mine = shopsRes.shops ?? []
            for (const s of mine) {
              await shopsApi.updateLocation(s.id, {
                latitude,
                longitude,
                ...(city ? { city } : {}),
                ...(postal_code ? { postal_code } : {}),
              })
            }
            if (mine.length > 0) {
              console.log(`✅ Position propagée à ${mine.length} boutique(s)`)
            }
          } catch (err) {
            console.warn('⚠️ Propagation aux shops échouée:', err)
          }

          mergeUser({
            latitude: String(latitude),
            longitude: String(longitude),
            ...(city ? { city } : {}),
            ...(postal_code ? { postal_code } : {}),
          } as any)

          toast.success(
            city ? `Position enregistrée : ${city} 📍` : 'Position enregistrée 📍'
          )
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Erreur')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error(err)
        setLoading(false)
        toast.error(
          'Accès refusé. Autorise la géolocalisation dans ton navigateur.'
        )
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  const handleClearLocation = async () => {
    if (!confirm('Effacer ta position ?')) return
    setLoading(true)
    try {
      await usersApi.updateMe({ latitude: null, longitude: null } as any)
      mergeUser({ latitude: null, longitude: null } as any)
      toast.success('Position effacée')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const hasLocation = user?.latitude && user?.longitude

  return (
    <div className="space-y-3">
      {hasLocation ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              Position enregistrée
            </p>
            <p className="text-xs text-emerald-700">
              {user?.city ? `${user.city}, ` : ''}
              <span className="font-mono">
                {Number(user.latitude).toFixed(4)},{' '}
                {Number(user.longitude).toFixed(4)}
              </span>
            </p>
          </div>
          {showDelete && (
            <button
              type="button"
              onClick={handleClearLocation}
              disabled={loading}
              className="rounded-full p-2 text-red-500 hover:bg-red-50 transition disabled:opacity-50 shrink-0"
              title="Effacer ma position"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {compact
            ? 'Aucune position enregistrée.'
            : 'Aucune position enregistrée. Active la géolocalisation pour améliorer tes recherches (boutiques et produits proches de toi).'}
        </p>
      )}

      <button
        type="button"
        onClick={handleUseLocation}
        disabled={loading}
        className="w-full rounded-full py-2.5 text-sm font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: ANKU_GREEN }}
      >
        {loading ? (
          <Loader size={14} className="animate-spin" />
        ) : (
          <MapPin size={14} />
        )}
        {loading
          ? 'Détection en cours…'
          : hasLocation
          ? 'Mettre à jour ma position'
          : '📍 Utiliser ma position actuelle'}
      </button>
    </div>
  )
}