import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldOff, Ban, Loader, UserMinus } from 'lucide-react'
import blocksApi, { type BlockedUser } from '../../service/api/blocks.api'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

type Tab = 'blocked' | 'restricted'

function UserRow({
  user,
  tab,
  onRemove,
}: {
  user: BlockedUser
  tab: Tab
  onRemove: (id: number) => void
}) {
  const [busy, setBusy] = useState(false)

  const handleRemove = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (tab === 'blocked') await blocksApi.unblock(user.user_id)
      else await blocksApi.unrestrict(user.user_id)
      toast.success(tab === 'blocked' ? 'Utilisateur débloqué' : 'Restriction levée')
      onRemove(user.user_id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
      <Link
        to={`/u/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="w-11 h-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: ANKU.greenDark }}
          >
            {(user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        className="rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
        style={{
          background: ANKU.greenPale,
          color: ANKU.greenDark,
          border: `1px solid ${ANKU.green}33`,
        }}
      >
        {busy ? (
          <Loader size={12} className="animate-spin" />
        ) : (
          <UserMinus size={12} />
        )}
        {tab === 'blocked' ? 'Débloquer' : 'Retirer'}
      </button>
    </div>
  )
}

export default function BlockedUsers() {
  const [tab, setTab] = useState<Tab>('blocked')
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState<BlockedUser[]>([])
  const [restricted, setRestricted] = useState<BlockedUser[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [b, r] = await Promise.all([
        blocksApi.listBlocked(),
        blocksApi.listRestricted(),
      ])
      setBlocked(b.blocked)
      setRestricted(r.restricted)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const list = tab === 'blocked' ? blocked : restricted

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%)',
          border: '1px solid rgba(106,168,79,0.13)',
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldOff size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Comptes bloqués et restreints
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Gère les personnes que tu ne veux plus voir ou qui ne peuvent plus
          interagir avec toi.
        </p>
      </div>

      <div className="rounded-2xl p-4 border border-gray-200 bg-white flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('blocked')}
          className={
            'text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 ' +
            (tab === 'blocked' ? 'text-white' : 'text-gray-600 hover:bg-gray-100')
          }
          style={{ background: tab === 'blocked' ? ANKU.green : '#f3f4f6' }}
        >
          <Ban size={12} />
          Bloqués ({blocked.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('restricted')}
          className={
            'text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 ' +
            (tab === 'restricted' ? 'text-white' : 'text-gray-600 hover:bg-gray-100')
          }
          style={{ background: tab === 'restricted' ? ANKU.green : '#f3f4f6' }}
        >
          <ShieldOff size={12} />
          Restreints ({restricted.length})
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center border border-gray-200">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center border border-gray-200">
          {tab === 'blocked' ? (
            <Ban size={40} className="mx-auto text-gray-300 mb-3" />
          ) : (
            <ShieldOff size={40} className="mx-auto text-gray-300 mb-3" />
          )}
          <p className="text-sm font-bold text-gray-800">
            {tab === 'blocked'
              ? 'Aucun utilisateur bloqué'
              : 'Aucun utilisateur restreint'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {tab === 'blocked'
              ? 'Les utilisateurs que tu bloques apparaîtront ici.'
              : 'Les utilisateurs que tu restreins apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {list.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              tab={tab}
              onRemove={(id) => {
                if (tab === 'blocked')
                  setBlocked((prev) => prev.filter((x) => x.user_id !== id))
                else
                  setRestricted((prev) => prev.filter((x) => x.user_id !== id))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}