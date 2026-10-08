// ============================================================
// ANKU — Fond animé pour les pages Boutiques
// ============================================================
import {
  Store, Sprout, Carrot, Wheat, Milk, Wine,
  Flower2, ShoppingBasket, Apple, Coffee, Cake, Beef,
} from 'lucide-react'

const ANKU = { green: '#3d6b28' }

const FLOATING_ICONS = [
  { Icon: Store,          top: '8%',  size: 82, delay: 0,  duration: 34, dir: 'right' },
  { Icon: Sprout,         top: '22%', size: 70, delay: 12, duration: 40, dir: 'left'  },
  { Icon: Carrot,         top: '40%', size: 64, delay: 4,  duration: 32, dir: 'right' },
  { Icon: Wheat,          top: '58%', size: 76, delay: 18, duration: 38, dir: 'left'  },
  { Icon: Milk,           top: '74%', size: 66, delay: 8,  duration: 44, dir: 'right' },
  { Icon: Wine,           top: '15%', size: 60, delay: 22, duration: 42, dir: 'left'  },
  { Icon: Flower2,        top: '88%', size: 58, delay: 14, duration: 30, dir: 'right' },
  { Icon: ShoppingBasket, top: '50%', size: 78, delay: 26, duration: 36, dir: 'left'  },
  { Icon: Apple,          top: '35%', size: 54, delay: 10, duration: 46, dir: 'left'  },
  { Icon: Coffee,         top: '68%', size: 56, delay: 20, duration: 48, dir: 'right' },
  { Icon: Cake,           top: '5%',  size: 52, delay: 6,  duration: 44, dir: 'left'  },
  { Icon: Beef,           top: '92%', size: 62, delay: 16, duration: 50, dir: 'right' },
] as const

export default function AnimatedShopsBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white">
      <style>{`
        @keyframes shopDriftRight {
          0%   { transform: translateX(-20vw) rotate(-18deg); opacity: 0; }
          8%   { opacity: 0.22; }
          50%  { transform: translateX(40vw) rotate(0deg); opacity: 0.30; }
          92%  { opacity: 0.22; }
          100% { transform: translateX(120vw) rotate(18deg); opacity: 0; }
        }
        @keyframes shopDriftLeft {
          0%   { transform: translateX(120vw) rotate(18deg); opacity: 0; }
          8%   { opacity: 0.22; }
          50%  { transform: translateX(40vw) rotate(0deg); opacity: 0.30; }
          92%  { opacity: 0.22; }
          100% { transform: translateX(-20vw) rotate(-18deg); opacity: 0; }
        }
      `}</style>

      {/* Halos verts */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,195,74,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 -left-24 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(106,168,79,0.10) 0%, transparent 70%)' }}
      />

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
              animation: `${item.dir === 'right' ? 'shopDriftRight' : 'shopDriftLeft'} ${item.duration}s linear infinite`,
              animationDelay: `-${item.delay}s`,
            }}
          >
            <Icon size={item.size} strokeWidth={1.5} />
          </div>
        )
      })}
    </div>
  )
}
