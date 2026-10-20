import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream])

  if (callState.status === 'idle') return null

  // APPEL ENTRANT
  if (callState.status === 'incoming') {
    return (
      <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
            {callState.peerName?.[0]?.toUpperCase() ?? '?'}
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
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-5xl font-bold shadow-2xl">
              {callState.peerName?.[0]?.toUpperCase() ?? '?'}
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