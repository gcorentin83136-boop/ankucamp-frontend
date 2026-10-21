import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react'
import { useCallContext } from '../../context/CallContext'

export default function CallUI() {
  const {
    callState,
    videoRequest,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    hangup,
    toggleAudio,
    toggleVideo,
    requestVideoUpgrade,
    acceptVideoUpgrade,
    rejectVideoUpgrade,
  } = useCallContext()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream])

  // 🎵 Sonneries d'appel entrant — différenciées audio vs vidéo
  useEffect(() => {
    if (callState.status !== 'incoming') return

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    const audioContext = new AudioCtx()
    const isVideo = callState.callType === 'video'

    const playNote = (freq: number, startTime: number, duration: number, volume = 0.15) => {
      try {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.start(startTime)
        osc.stop(startTime + duration)
      } catch {}
    }

    const playMelody = () => {
      try {
        const now = audioContext.currentTime
        if (isVideo) {
          playNote(523, now + 0.0, 0.35)
          playNote(659, now + 0.2, 0.35)
          playNote(784, now + 0.4, 0.4)
          playNote(1047, now + 0.7, 0.4)
          playNote(784, now + 1.0, 0.5)
        } else {
          playNote(523, now + 0.0, 0.4)
          playNote(659, now + 0.25, 0.4)
          playNote(784, now + 0.5, 0.5)
          playNote(659, now + 0.85, 0.6)
        }
      } catch {}
    }

    playMelody()
    const interval = setInterval(playMelody, isVideo ? 3500 : 3000)

    return () => {
      clearInterval(interval)
      try { audioContext.close() } catch {}
    }
  }, [callState.status, callState.callType])

  // ⏱️ Chrono de durée d'appel
  useEffect(() => {
    if (callState.status !== 'ongoing' || !callState.startedAt) {
      setCallDuration(0)
      return
    }
    const update = () => {
      setCallDuration(Math.floor((Date.now() - callState.startedAt!) / 1000))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [callState.status, callState.startedAt])

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (callState.status === 'idle') return null

  // APPEL ENTRANT
  if (callState.status === 'incoming') {
    return (
      <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white text-4xl font-bold shadow-2xl overflow-hidden">
            {callState.peerAvatar ? (
              <img src={callState.peerAvatar} alt={callState.peerName} className="w-full h-full object-cover" />
            ) : (
              callState.peerName?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <div className="text-center">
            <p className="text-white text-2xl font-bold">{callState.peerName}</p>
            <p className="text-white/70 text-sm mt-1">
              {callState.callType === 'video' ? '📹 Appel vidéo entrant' : '🎙️ Appel vocal entrant'}
            </p>
          </div>
        </div>
        <div className="absolute bottom-12 flex items-center gap-12">
          <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-2xl transition hover:scale-110" title="Refuser">
            <PhoneOff size={26} />
          </button>
          <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-2xl transition hover:scale-110 animate-bounce" title="Accepter">
            {callState.callType === 'video' ? <Video size={26} /> : <Phone size={26} />}
          </button>
        </div>
      </div>
    )
  }

  // APPEL EN COURS
  return (
    <div className="fixed inset-0 z-[10001] bg-black flex flex-col overflow-hidden">
      <div className="relative flex-1 min-h-0 bg-gray-900 flex items-center justify-center">
        {callState.callType === 'video' && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-5xl font-bold shadow-2xl overflow-hidden">
              {callState.peerAvatar ? (
                <img src={callState.peerAvatar} alt={callState.peerName} className="w-full h-full object-cover" />
              ) : (
                callState.peerName?.[0]?.toUpperCase() ?? '?'
              )}
            </div>
            <p className="text-2xl font-bold">{callState.peerName}</p>
            <p className="text-white/60 text-sm">
              {callState.status === 'calling' ? 'Appel en cours...' : 'En communication'}
            </p>
          </div>
        )}

        {callState.callType === 'video' && localStream && (
          <div className="absolute top-4 right-4 w-28 h-40 md:w-32 md:h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black z-10">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          </div>
        )}

        <button onClick={hangup} className="absolute top-4 left-4 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white" title="Raccrocher">
          <X size={20} />
        </button>

        {/* ⏱️ Chrono de durée */}
        {callState.status === 'ongoing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-white text-sm font-mono tabular-nums">
            {formatDuration(callDuration)}
          </div>
        )}
      </div>

      {/* Overlay demande vidéo entrante */}
      {videoRequest === 'incoming' && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Video size={32} className="text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">{callState.peerName}</p>
              <p className="text-sm text-gray-500 mt-1">veut passer en appel vidéo</p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={rejectVideoUpgrade} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition">
                Refuser
              </button>
              <button onClick={acceptVideoUpgrade} className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition shadow-md">
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bandeau "en attente" côté demandeur */}
      {videoRequest === 'sent' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-blue-500 text-white text-sm rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Video size={16} />
          En attente de réponse...
        </div>
      )}

      {/* Barre de contrôles en bas */}
      <div className="shrink-0 px-6 py-4 bg-black/90 backdrop-blur border-t border-white/10 flex items-center justify-center gap-4 flex-wrap z-20">
        <button onClick={toggleAudio} className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${callState.audioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`} title="Micro">
          {callState.audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        {callState.callType === 'video' ? (
          <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${callState.videoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`} title="Caméra">
            {callState.videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        ) : (
          <button onClick={requestVideoUpgrade} className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg transition" title="Passer en vidéo">
            <Video size={22} />
          </button>
        )}
        <button onClick={hangup} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-2xl transition hover:scale-110" title="Raccrocher">
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  )
}