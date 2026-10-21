import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from './AuthContext'
import { useCall } from '../hooks/useCall'
import type { CallState } from '../hooks/useCall'

interface CallContextValue {
  callState: CallState
  videoRequest: 'incoming' | 'sent' | null
  remoteStream: MediaStream | null
  localStream: MediaStream | null
  startCall: (conversationId: number, toUserId: number, toUserName: string, toUserAvatar: string | null, type: 'audio' | 'video') => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  hangup: () => void
  toggleAudio: () => void
  toggleVideo: () => void
  requestVideoUpgrade: () => void
  acceptVideoUpgrade: () => Promise<void>
  rejectVideoUpgrade: () => void
}

const CallContext = createContext<CallContextValue | null>(null)

export function CallProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore()
  const currentUser = (auth as any)?.user

  const call = useCall(currentUser?.id ?? null)

  return <CallContext.Provider value={call}>{children}</CallContext.Provider>
}

export function useCallContext() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCallContext must be used within CallProvider')
  return ctx
}