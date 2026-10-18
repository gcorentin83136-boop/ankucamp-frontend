import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

const SOCKET_URL = 'http://localhost:3001'
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export type CallType = 'audio' | 'video'
export type CallStatus = 'idle' | 'calling' | 'incoming' | 'ongoing' | 'ended'

export interface CallState {
  status: CallStatus
  callId: string | null
  callType: CallType
  conversationId: number | null
  peerUserId: number | null
  peerName: string
  isIncoming: boolean
  videoEnabled: boolean
  audioEnabled: boolean
  startedAt: number | null
}

const initialCallState: CallState = {
  status: 'idle',
  callId: null,
  callType: 'audio',
  conversationId: null,
  peerUserId: null,
  peerName: '',
  isIncoming: false,
  videoEnabled: false,
  audioEnabled: true,
  startedAt: null,
}

export function useCall(currentUserId: number | null) {
  const [callState, setCallState] = useState<CallState>(initialCallState)
  const [videoRequest, setVideoRequest] = useState<'incoming' | 'sent' | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const callStateRef = useRef<CallState>(initialCallState)

  // Garde callState à jour dans une ref (pour handlers socket stables)
  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  // Connexion socket
  useEffect(() => {
    if (!currentUserId) return
    const token = localStorage.getItem('anku_token')
    const socket = io(SOCKET_URL, { withCredentials: true, auth: { token } })
    socketRef.current = socket
    return () => {
      socket.disconnect()
    }
  }, [currentUserId])

  // Cleanup
  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    setRemoteStream(null)
    setLocalStream(null)
    pendingCandidatesRef.current = []
    setVideoRequest(null)
    setCallState(initialCallState)
  }, [])

  // Création PC
  const createPeerConnection = useCallback(
    (peerId: number, callId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('call:ice-candidate', {
            callId,
            toUserId: peerId,
            candidate: event.candidate.toJSON(),
          })
        }
      }

      pc.ontrack = (event) => {
        const [stream] = event.streams
        if (stream) setRemoteStream(stream)
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          toast.error('Connexion perdue')
          cleanup()
        }
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      return pc
    },
    [cleanup]
  )

  // Récup media local
  const getLocalMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }, [])

  // Démarrer appel
  const startCall = useCallback(
    async (conversationId: number, toUserId: number, toUserName: string, type: CallType) => {
      try {
        await getLocalMedia(type)
        setCallState({
          status: 'calling',
          callId: null,
          callType: type,
          conversationId,
          peerUserId: toUserId,
          peerName: toUserName,
          isIncoming: false,
          videoEnabled: type === 'video',
          audioEnabled: true,
          startedAt: null,
        })
        socketRef.current?.emit('call:initiate', {
          conversationId,
          toUserId,
          callType: type,
        })
      } catch (err) {
        toast.error("Impossible d'accéder au micro/caméra")
        cleanup()
      }
    },
    [getLocalMedia, cleanup]
  )

  // Accepter appel
  const acceptCall = useCallback(async () => {
    const { callId, callType, peerUserId } = callStateRef.current
    if (!callId || !peerUserId) return
    try {
      await getLocalMedia(callType)
      createPeerConnection(peerUserId, callId)
      setCallState((prev) => ({
        ...prev,
        status: 'ongoing',
        videoEnabled: callType === 'video',
        startedAt: Date.now(),
      }))
      socketRef.current?.emit('call:accept', {
        callId,
        toUserId: peerUserId,
      })
    } catch (err) {
      toast.error("Impossible d'accéder au micro/caméra")
      cleanup()
    }
  }, [getLocalMedia, createPeerConnection, cleanup])

  // Refuser appel
  const rejectCall = useCallback(() => {
    const { callId, peerUserId } = callStateRef.current
    if (callId && peerUserId) {
      socketRef.current?.emit('call:reject', {
        callId,
        toUserId: peerUserId,
        reason: 'declined',
      })
    }
    cleanup()
  }, [cleanup])

  // Raccrocher
  const hangup = useCallback(() => {
    const { callId, peerUserId } = callStateRef.current
    if (callId && peerUserId) {
      socketRef.current?.emit('call:hangup', {
        callId,
        toUserId: peerUserId,
      })
    }
    cleanup()
  }, [cleanup])

  // Toggle micro
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        setCallState((prev) => ({ ...prev, audioEnabled: track.enabled }))
      }
    }
  }, [])

  // Toggle caméra
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        setCallState((prev) => ({ ...prev, videoEnabled: track.enabled }))
      }
    }
  }, [])

  // Demander la vidéo
  const requestVideoUpgrade = useCallback(() => {
    const { callId, peerUserId } = callStateRef.current
    if (callId && peerUserId) {
      socketRef.current?.emit('call:request-video', {
        callId,
        toUserId: peerUserId,
      })
      setVideoRequest('sent')
    }
  }, [])

  // Refuser la demande vidéo
  const rejectVideoUpgrade = useCallback(() => {
    setVideoRequest(null)
    toast('Demande vidéo refusée', { icon: '📹' })
  }, [])

  // Accepter la vidéo (côté B) : on notifie juste A, c'est A qui relancera
  const acceptVideoUpgrade = useCallback(async () => {
    const { callId, peerUserId } = callStateRef.current
    if (!callId || !peerUserId) return

    try {
      setVideoRequest(null)
      socketRef.current?.emit('call:accept-video', {
        callId,
        toUserId: peerUserId,
      })
      // On met l'UI en attente, l'appel vidéo va arriver côté A
      setCallState((prev) => ({ ...prev, callType: 'video' }))
      toast.loading('Connexion vidéo en cours...', { id: 'video-connect', duration: 3000 })
    } catch (err) {
      console.error('[CALL] acceptVideoUpgrade error', err)
      toast.error("Impossible d'activer la caméra")
    }
  }, [])

  // Écoute des events socket
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const onIncoming = async (data: any) => {
      // ⚡ AUTO-ACCEPT : B vient de cliquer "Accepter" et A a relancé en vidéo
      // (videoRequest est encore 'incoming' côté B à ce moment-là)
      if (videoRequest === 'incoming' && data.callType === 'video') {
        try {
          // 1) Répondre IMMÉDIATEMENT à l'appel
          socket.emit('call:accept', {
            callId: data.callId,
            toUserId: data.fromUser.id,
          })

          // 2) Update state
          setVideoRequest(null)
          setCallState({
            status: 'ongoing',
            callId: data.callId,
            callType: 'video',
            conversationId: data.conversationId,
            peerUserId: data.fromUser.id,
            peerName: data.fromUser.firstName,
            isIncoming: false,
            videoEnabled: true,
            audioEnabled: true,
            startedAt: Date.now(),
          })
          toast.dismiss('video-connect')

          // 3) Caméra + PC
          await getLocalMedia('video')
          createPeerConnection(data.fromUser.id, data.callId)
        } catch (err) {
          console.error('[CALL] auto-accept video error', err)
          toast.error("Impossible d'activer la caméra")
        }
        return
      }

      // CAS NORMAL : appel classique
      if (callStateRef.current.status !== 'idle') {
        socket.emit('call:reject', {
          callId: data.callId,
          toUserId: data.fromUser.id,
          reason: 'busy',
        })
        return
      }
      setCallState({
        status: 'incoming',
        callId: data.callId,
        callType: data.callType,
        conversationId: data.conversationId,
        peerUserId: data.fromUser.id,
        peerName: data.fromUser.firstName,
        isIncoming: true,
        videoEnabled: false,
        audioEnabled: true,
        startedAt: null,
      })
    }

    const onAccepted = async (data: { callId: string; fromUserId: number }) => {
      if (!pcRef.current) {
        createPeerConnection(data.fromUserId, data.callId)
      }
      const pc = pcRef.current!
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('call:offer', {
        callId: data.callId,
        toUserId: data.fromUserId,
        sdp: offer,
      })
      setCallState((prev) => ({
        ...prev,
        status: 'ongoing',
        startedAt: Date.now(),
        callId: data.callId,
      }))
    }

    const onRejected = () => {
      toast.error('Appel refusé')
      cleanup()
    }

    const onOffer = async (data: { callId: string; sdp: any; fromUserId: number }) => {
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('call:answer', {
          callId: data.callId,
          toUserId: data.fromUserId,
          sdp: answer,
        })
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c))
        }
        pendingCandidatesRef.current = []
      } catch (err) {
        console.error('[CALL] error on call:offer', err)
      }
    }

    const onAnswer = async (data: { sdp: any }) => {
      const pc = pcRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c))
      }
      pendingCandidatesRef.current = []
    }

    const onIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current
      if (!pc) return
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      } else {
        pendingCandidatesRef.current.push(data.candidate)
      }
    }

    const onHangup = () => {
      toast('Appel terminé', { icon: '📴' })
      cleanup()
    }

    const onVideoRequested = () => {
      setVideoRequest('incoming')
    }

    const onVideoAccepted = async () => {
      // A reçoit l'accord de B → c'est A qui relance proprement en vidéo
      const { callId, peerUserId, peerName, conversationId } = callStateRef.current
      if (!callId || !peerUserId || !conversationId) {
        console.warn('[CALL] onVideoAccepted: infos manquantes', callStateRef.current)
        return
      }

      try {
        setVideoRequest(null)

        // 1. Prévenir B qu'on coupe (pour qu'il se prépare)
        socket.emit('call:hangup', {
          callId,
          toUserId: peerUserId,
        })

        // 2. Cleanup local
        cleanup()

        // 3. Attendre un peu que les 2 cleanup soient faits
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 4. Relancer appel vidéo (A redevient appelant)
        await startCall(conversationId, peerUserId, peerName, 'video')
      } catch (err) {
        console.error('[CALL] onVideoAccepted error', err)
        toast.error("Impossible de relancer en vidéo")
      }
    }

    const onError = (data: { message: string }) => {
      toast.error(data.message)
    }

    socket.on('call:incoming', onIncoming)
    socket.on('call:accepted', onAccepted)
    socket.on('call:rejected', onRejected)
    socket.on('call:offer', onOffer)
    socket.on('call:answer', onAnswer)
    socket.on('call:ice-candidate', onIceCandidate)
    socket.on('call:hangup', onHangup)
    socket.on('call:video-requested', onVideoRequested)
    socket.on('call:video-accepted', onVideoAccepted)
    socket.on('call:error', onError)

    return () => {
      socket.off('call:incoming', onIncoming)
      socket.off('call:accepted', onAccepted)
      socket.off('call:rejected', onRejected)
      socket.off('call:offer', onOffer)
      socket.off('call:answer', onAnswer)
      socket.off('call:ice-candidate', onIceCandidate)
      socket.off('call:hangup', onHangup)
      socket.off('call:video-requested', onVideoRequested)
      socket.off('call:video-accepted', onVideoAccepted)
      socket.off('call:error', onError)
    }
  }, [createPeerConnection, cleanup])

  return {
    callState,
    videoRequest,
    remoteStream,
    localStream,
    startCall,
    acceptCall,
    rejectCall,
    hangup,
    toggleAudio,
    toggleVideo,
    requestVideoUpgrade,
    acceptVideoUpgrade,
    rejectVideoUpgrade,
  }
}