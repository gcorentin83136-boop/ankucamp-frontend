/* eslint-disable */
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
  peerAvatar: string | null
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
  peerAvatar: null,
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
  const videoRequestRef = useRef<'incoming' | 'sent' | null>(null)
  // Flag : A a demandÃ© la vidÃ©o, il attend la relance vidÃ©o â†’ auto-accept
  const expectingVideoCallRef = useRef<boolean>(false)

  // Sync callState / videoRequest dans refs
  useEffect(() => { callStateRef.current = callState }, [callState])
  useEffect(() => { videoRequestRef.current = videoRequest }, [videoRequest])

  // Connexion socket globale
  useEffect(() => {
    if (!currentUserId) return
    const token = localStorage.getItem('anku_token')
    const socket = io(SOCKET_URL, { withCredentials: true, auth: { token } })
    socketRef.current = socket
    return () => {
      socket.disconnect()
    }
  }, [currentUserId])

  // Cleanup complet
  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null
      pcRef.current.ontrack = null
      pcRef.current.onconnectionstatechange = null
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
    videoRequestRef.current = null
    setCallState(initialCallState)
  }, [])

  // CrÃ©er le PC
  const createPeerConnection = useCallback((peerId: number, callId: string) => {
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
      if (pc.connectionState === 'failed') {
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
  }, [cleanup])

  // RÃ©cupÃ©rer le mÃ©dia local
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // DÃ‰MARRER UN APPEL
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startCall = useCallback(
    async (conversationId: number, toUserId: number, toUserName: string, toUserAvatar: string | null, type: CallType) => {
      try {
        await getLocalMedia(type)
        setCallState({
          status: 'calling',
          callId: null,
          callType: type,
          conversationId,
          peerUserId: toUserId,
          peerName: toUserName,
          peerAvatar: toUserAvatar,
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
      } catch (err: any) {
        toast.error("Impossible d'accÃ©der au micro/camÃ©ra")
        cleanup()
      }
    },
    [getLocalMedia, cleanup]
  )

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ACCEPTER UN APPEL (audio ou vidÃ©o normal)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    } catch (err: any) {
      toast.error("Impossible d'accÃ©der au micro/camÃ©ra")
      cleanup()
    }
  }, [getLocalMedia, createPeerConnection, cleanup])

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // REFUSER UN APPEL
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const rejectCall = useCallback(() => {
    const { callId, peerUserId, conversationId, callType } = callStateRef.current
    if (callId && peerUserId) {
      socketRef.current?.emit('call:reject', {
        callId,
        toUserId: peerUserId,
        reason: 'declined',
        conversationId: conversationId ?? undefined,
        callType,
      })
    }
    cleanup()
  }, [cleanup])

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RACCROCHER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hangup = useCallback(() => {
    const { callId, peerUserId, conversationId, callType, startedAt } = callStateRef.current
    const duration = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
    if (callId && peerUserId) {
      socketRef.current?.emit('call:hangup', {
        callId,
        toUserId: peerUserId,
        conversationId: conversationId ?? undefined,
        callType,
        duration,
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

  // Toggle camÃ©ra
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        setCallState((prev) => ({ ...prev, videoEnabled: track.enabled }))
      }
    }
  }, [])

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // DEMANDER LE PASSAGE EN VIDÃ‰O
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Refuser le passage en vidÃ©o
  const rejectVideoUpgrade = useCallback(() => {
    const { callId, peerUserId } = callStateRef.current
    if (callId && peerUserId) {
      socketRef.current?.emit('call:reject-video', {
        callId,
        toUserId: peerUserId,
      })
    }
    setVideoRequest(null)
    toast('Demande vidÃ©o refusÃ©e', { icon: 'ðŸ“¹' })
  }, [])

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ACCEPTER LE PASSAGE EN VIDÃ‰O
  // StratÃ©gie : B accepte â†’ prÃ©vient A â†’ les 2 raccrochent proprement
  //             A relance appel vidÃ©o â†’ B auto-accepte (flag)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const acceptVideoUpgrade = useCallback(async () => {
    const { callId, peerUserId } = callStateRef.current
    if (!callId || !peerUserId) return

    try {
      setVideoRequest(null)
      // âš¡ FLAG : on attend la relance vidÃ©o de A â†’ on auto-acceptera
      expectingVideoCallRef.current = true

      // 1) PrÃ©venir A qu'on a acceptÃ©
      socketRef.current?.emit('call:accept-video', {
        callId,
        toUserId: peerUserId,
      })

      // 2) A va raccrocher + relancer appel vidÃ©o â†’ on recevra call:incoming
      //    GrÃ¢ce au flag, on auto-acceptera sans intervention
      toast.loading('Connexion vidÃ©o...', { id: 'video-connect', duration: 5000 })
    } catch (err: any) {
      console.error('[CALL] acceptVideoUpgrade error', err)
      expectingVideoCallRef.current = false
      toast.error("Impossible d'activer la camÃ©ra")
    }
  }, [])

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Ã‰COUTE DES EVENTS SOCKET
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const onIncoming = async (data: any) => {
      // âš¡ AUTO-ACCEPT si on attendait la relance vidÃ©o
      if (expectingVideoCallRef.current && data.callType === 'video') {
        expectingVideoCallRef.current = false
        try {
          // 1) Cleanup ANCIEN PC + ANCIEN flux (on repart de zÃ©ro)
          if (pcRef.current) {
            pcRef.current.onicecandidate = null
            pcRef.current.ontrack = null
            pcRef.current.onconnectionstatechange = null
            pcRef.current.close()
            pcRef.current = null
          }
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop())
            localStreamRef.current = null
          }
          setRemoteStream(null)
          pendingCandidatesRef.current = []

          // 2) RÃ©cupÃ©rer flux vidÃ©o + audio tout neufs
          const freshStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          })
          localStreamRef.current = freshStream
          setLocalStream(freshStream)

          // 3) CrÃ©er le nouveau PC AVANT de rÃ©pondre (pour que l'offre de A puisse Ãªtre traitÃ©e)
          createPeerConnection(data.fromUser.id, data.callId)

          // 4) Update state
          setCallState({
            status: 'ongoing',
            callId: data.callId,
            callType: 'video',
            conversationId: data.conversationId,
            peerUserId: data.fromUser.id,
            peerName: data.fromUser.firstName,
            peerAvatar: data.fromUser.avatarUrl ?? null,
            isIncoming: false,
            videoEnabled: true,
            audioEnabled: true,
            startedAt: Date.now(),
          })
          toast.dismiss('video-connect')

          // 5) Accepter APRÃˆS que le PC soit prÃªt
          socket.emit('call:accept', {
            callId: data.callId,
            toUserId: data.fromUser.id,
          })
        } catch (err: any) {
          console.error('[CALL] auto-accept video error', err)
          toast.error("Impossible d'activer la camÃ©ra")
        }
        return
      }

      // Appel classique
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
        peerAvatar: data.fromUser.avatarUrl ?? null,
        isIncoming: true,
        videoEnabled: false,
        audioEnabled: true,
        startedAt: null,
      })
    }

    const onAccepted = async (data: { callId: string; fromUserId: number }) => {
      if (!pcRef.current) createPeerConnection(data.fromUserId, data.callId)
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
      toast.error('Appel refusÃ©')
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
      } catch (err: any) {
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

    const onHangup = (data?: { reason?: string }) => {
      // âš¡ Si on attend la relance vidÃ©o, on ignore le hangup (transition silencieuse)
      if (expectingVideoCallRef.current) {
        toast.loading('Passage en vidÃ©o...', { id: 'video-connect', duration: 5000 })
        return
      }
      if (data?.reason === 'missed') {
        toast('Appel manquÃ© (pas de rÃ©ponse)', { icon: 'ðŸ“ž' })
      } else {
        toast('Appel terminÃ©', { icon: 'ðŸ“´' })
      }
      cleanup()
    }

    const onVideoRequested = () => {
      setVideoRequest('incoming')
    }

    const onVideoRejected = () => {
      setVideoRequest(null)
      toast('Demande vidÃ©o refusÃ©e', { icon: 'ðŸ“¹' })
    }

    // âš¡ A reÃ§oit l'accord de B â†’ A fait hangup + relance vidÃ©o
    const onVideoAccepted = async () => {
      const { callId, peerUserId, peerName, conversationId } = callStateRef.current
      if (!callId || !peerUserId || !conversationId) return

      setVideoRequest(null)
      // Loader pendant la transition
      toast.loading('Passage en vidÃ©o...', { id: 'video-connect', duration: 5000 })

      try {
        // 1) PrÃ©vient B qu'on raccroche (mais B ignore grÃ¢ce Ã  expectingVideoCallRef)
        socket.emit('call:hangup', {
          callId,
          toUserId: peerUserId,
        })

        // 2) Cleanup local COMPLET
        if (pcRef.current) {
          pcRef.current.onicecandidate = null
          pcRef.current.ontrack = null
          pcRef.current.onconnectionstatechange = null
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

        // 3) Petite attente
        await new Promise((resolve) => setTimeout(resolve, 400))

        // 4) Reset state Ã  idle AVANT de relancer (pour Ã©viter "Appel en cours" sur ancien)
        setCallState(initialCallState)

        // 5) Relance appel vidÃ©o
        await startCall(conversationId, peerUserId, peerName, callStateRef.current.peerAvatar, 'video')
      } catch (err: any) {
        console.error('[CALL] onVideoAccepted error', err)
        toast.error('Impossible de relancer en vidÃ©o')
        cleanup()
      }
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
    socket.on('call:video-rejected', onVideoRejected)

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
      socket.off('call:video-rejected', onVideoRejected)
    }
  }, [cleanup, createPeerConnection, getLocalMedia, startCall])

  // âš¡ IMPORTANT : quand B (le receveur initial) voit son `video-accepted` (parce qu'il a demandÃ©)
  // â†’ on n'auto-accept PAS cÃ´tÃ© B (c'est A qui relance, donc B doit accepter)
  // MAIS quand A relance l'appel vidÃ©o, B reÃ§oit call:incoming â†’ il faut que B auto-accepte
  // C'est lÃ  qu'intervient le flag expectingVideoCallRef

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


