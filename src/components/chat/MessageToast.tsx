import { MessageSquare } from 'lucide-react'

interface MessageToastProps {
  senderName: string
  senderAvatar?: string | null
  content: string
  onClick: () => void
}

export default function MessageToast({ senderName, senderAvatar, content, onClick }: MessageToastProps) {
  return (
    <div
      onClick={onClick}
      className="max-w-sm w-full pointer-events-auto flex cursor-pointer transform transition-all hover:scale-105"
      style={{
        zIndex: 9999999,
        background: 'linear-gradient(135deg, #6aa84f 0%, #4a7a35 100%)',
        boxShadow: '0 10px 30px rgba(74, 122, 53, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px 8px 24px 8px', // Forme de feuille
        padding: '16px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex-1 w-0">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {senderAvatar ? (
              <img src={senderAvatar} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                {senderName?.[0]?.toUpperCase() || '💬'}
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white truncate drop-shadow-sm">
                {senderName}
              </p>
              <MessageSquare size={14} className="text-white/60" />
            </div>
            <p className="mt-1 text-sm text-white/90 truncate">
              {content || '📷 Média'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}