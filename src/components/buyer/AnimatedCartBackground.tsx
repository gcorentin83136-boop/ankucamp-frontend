import {
  ShoppingCart,
  Package,
  Heart,
  Tag,
  Store,
  Truck,
  Star,
  Gift,
} from 'lucide-react'

const ANKU = {
  green: '#4a7a35', // vert foncé ANKU (plus prononcé)
}

// Icônes vertes qui traversent la page — plus grosses
const FLOATING_ICONS = [
  { Icon: ShoppingCart, top: '8%',  size: 90, delay: 0,  duration: 32, direction: 'right' },
  { Icon: Package,      top: '25%', size: 76, delay: 10, duration: 38, direction: 'left' },
  { Icon: Heart,        top: '42%', size: 66, delay: 4,  duration: 30, direction: 'right' },
  { Icon: Tag,          top: '58%', size: 72, delay: 16, duration: 34, direction: 'left' },
  { Icon: Store,        top: '72%', size: 70, delay: 8,  duration: 42, direction: 'right' },
  { Icon: Truck,        top: '15%', size: 82, delay: 20, duration: 40, direction: 'left' },
  { Icon: Star,         top: '85%', size: 60, delay: 12, duration: 28, direction: 'right' },
  { Icon: Gift,         top: '55%', size: 64, delay: 24, duration: 36, direction: 'left' },
  // Deuxième vague pour densifier
  { Icon: ShoppingCart, top: '35%', size: 58, delay: 14, duration: 45, direction: 'left' },
  { Icon: Package,      top: '65%', size: 60, delay: 22, duration: 50, direction: 'right' },
  { Icon: Heart,        top: '12%', size: 54, delay: 6,  duration: 44, direction: 'left' },
  { Icon: Store,        top: '90%', size: 62, delay: 18, duration: 48, direction: 'left' },
]

export default function AnimatedCartBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white">
      <style>{`
        @keyframes driftRight {
          0%   { transform: translateX(-20vw) translateY(0) rotate(-18deg); opacity: 0; }
          8%   { opacity: 0.35; }
          50%  { transform: translateX(40vw) translateY(-30px) rotate(0deg); opacity: 0.45; }
          92%  { opacity: 0.35; }
          100% { transform: translateX(120vw) translateY(0) rotate(18deg); opacity: 0; }
        }
        @keyframes driftLeft {
          0%   { transform: translateX(120vw) translateY(0) rotate(18deg); opacity: 0; }
          8%   { opacity: 0.35; }
          50%  { transform: translateX(40vw) translateY(-30px) rotate(0deg); opacity: 0.45; }
          92%  { opacity: 0.35; }
          100% { transform: translateX(-20vw) translateY(0) rotate(-18deg); opacity: 0; }
        }
      `}</style>

      {/* Halos verts subtils */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(139,195,74,0.10) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 -left-24 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(106,168,79,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Icônes vertes qui traversent */}
      {FLOATING_ICONS.map((item, i) => {
        const Icon = item.Icon
        return (
          <div
            key={i}
            className="absolute"
            style={{
              top: item.top,
              left: 0,
              color: ANKU.green,
              animation: `${
                item.direction === 'right' ? 'driftRight' : 'driftLeft'
              } ${item.duration}s linear infinite`,
              animationDelay: `-${item.delay}s`,
            }}
          >
            <Icon size={item.size} strokeWidth={1.6} />
          </div>
        )
      })}
    </div>
  )
}
