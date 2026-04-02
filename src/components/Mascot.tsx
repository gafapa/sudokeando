import { motion } from 'framer-motion'
import type { MascotStatus } from '../types'

const MESSAGES: Record<MascotStatus, string> = {
  idle: "Let's play!",
  happy: 'Correct!',
  thinking: 'Thinking...',
  oops: 'That one does not fit.',
  win: 'You solved it!',
}

interface MascotProps {
  status: MascotStatus
  className?: string
}

export function Mascot({ status, className = '' }: MascotProps) {
  const isSmall = className.includes('mascot-small')
  const armColor = status === 'oops' ? '#ef4444' : status === 'win' ? '#f472b6' : 'var(--secondary)'
  const size = isSmall ? 80 : 180

  function renderScreen() {
    const screenBackground = {
      idle: 'rgba(45, 212, 191, 0.15)',
      happy: 'rgba(16, 185, 129, 0.2)',
      thinking: 'rgba(139, 92, 246, 0.2)',
      oops: 'rgba(239, 68, 68, 0.2)',
      win: 'rgba(244, 114, 182, 0.25)',
    }[status]

    return (
      <>
        <rect x="28" y="28" width="64" height="50" rx="10" fill={screenBackground} />
        <rect
          x="28"
          y="28"
          width="64"
          height="50"
          rx="10"
          fill="none"
          stroke={
            status === 'oops'
              ? 'rgba(239,68,68,0.5)'
              : status === 'win'
                ? 'rgba(244,114,182,0.6)'
                : 'rgba(45,212,191,0.3)'
          }
          strokeWidth="1.5"
        />
        {[35, 42, 49, 56, 63, 70].map((y) => (
          <line key={y} x1="30" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
      </>
    )
  }

  function renderEyes() {
    switch (status) {
      case 'happy':
        return (
          <>
            <path d="M36 46 Q42 38 48 46" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M72 46 Q78 38 84 46" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="43" r="1.5" fill="rgba(255,255,255,0.8)" />
            <circle cx="76" cy="43" r="1.5" fill="rgba(255,255,255,0.8)" />
          </>
        )
      case 'thinking':
        return (
          <>
            <circle cx="42" cy="46" r="6" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
            <circle cx="42" cy="46" r="3" fill="#8b5cf6" opacity="0.8" />
            <rect x="72" y="43" width="12" height="5" rx="2.5" fill="#8b5cf6" opacity="0.8" />
            <circle cx="78" cy="35" r="1.5" fill="#8b5cf6" opacity="0.6" />
            <circle cx="83" cy="31" r="2" fill="#8b5cf6" opacity="0.8" />
            <circle cx="89" cy="26" r="2.5" fill="#8b5cf6" />
          </>
        )
      case 'oops':
        return (
          <>
            <path d="M36 40 L46 50 M46 40 L36 50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M72 40 L82 50 M82 40 L72 50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M88 38 Q90 32 92 38 Q92 43 90 44 Q88 43 88 38Z" fill="#93c5fd" />
          </>
        )
      case 'win':
        return (
          <>
            <circle cx="42" cy="45" r="7" fill="none" stroke="#f472b6" strokeWidth="2" />
            <circle cx="42" cy="45" r="4" fill="#f472b6" />
            <circle cx="42" cy="45" r="2" fill="#fff" />
            <circle cx="78" cy="45" r="7" fill="none" stroke="#f472b6" strokeWidth="2" />
            <circle cx="78" cy="45" r="4" fill="#f472b6" />
            <circle cx="78" cy="45" r="2" fill="#fff" />
            <path d="M30 32 L31 28 L32 32 L36 33 L32 34 L31 38 L30 34 L26 33Z" fill="#fde047" />
            <path d="M85 28 L86 25 L87 28 L90 29 L87 30 L86 33 L85 30 L82 29Z" fill="#fde047" />
          </>
        )
      default:
        return (
          <>
            <circle cx="42" cy="45" r="7" fill="rgba(45,212,191,0.2)" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="42" cy="45" r="4" fill="#2dd4bf" />
            <circle cx="44" cy="43" r="1.5" fill="rgba(255,255,255,0.7)" />
            <circle cx="78" cy="45" r="7" fill="rgba(45,212,191,0.2)" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="78" cy="45" r="4" fill="#2dd4bf" />
            <circle cx="80" cy="43" r="1.5" fill="rgba(255,255,255,0.7)" />
          </>
        )
    }
  }

  function renderMouth() {
    switch (status) {
      case 'happy':
      case 'win':
        return (
          <path
            d="M44 62 Q60 74 76 62"
            stroke="#2dd4bf"
            strokeWidth="3"
            fill="rgba(45,212,191,0.15)"
            strokeLinecap="round"
          />
        )
      case 'oops':
        return <path d="M48 68 Q60 60 72 68" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      case 'thinking':
        return <path d="M50 64 Q55 68 62 64 Q68 61 74 64" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
      default:
        return <path d="M50 65 Q60 70 70 65" stroke="#2dd4bf" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    }
  }

  return (
    <div className={`mascot-wrapper ${className}`} style={{ position: 'relative', width: size, height: size + 28 }}>
      <div className="mascot-bubble" role="status" aria-live="polite">
        {MESSAGES[status]}
      </div>

      <svg
        viewBox="0 0 120 110"
        width={size}
        height={size}
        style={{ marginTop: 28 }}
        className="mascot-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`bodyGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={status === 'oops' ? '#7f1d1d' : status === 'win' ? '#581c87' : '#1e1b4b'} />
            <stop offset="100%" stopColor={status === 'oops' ? '#450a0a' : status === 'win' ? '#2e1065' : '#0f172a'} />
          </linearGradient>
          <linearGradient id={`faceGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={status === 'oops' ? '#ef4444' : status === 'win' ? '#a855f7' : '#8b5cf6'} />
            <stop offset="100%" stopColor={status === 'oops' ? '#dc2626' : status === 'win' ? '#f472b6' : '#2dd4bf'} />
          </linearGradient>
          <filter id={`glow-${status}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="60" cy="108" rx="28" ry="4" fill="rgba(0,0,0,0.25)" />
        <rect x="38" y="90" width="14" height="14" rx="5" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <rect x="68" y="90" width="14" height="14" rx="5" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <rect x="39" y="100" width="12" height="5" rx="3" fill={`url(#faceGrad-${status})`} />
        <rect x="69" y="100" width="12" height="5" rx="3" fill={`url(#faceGrad-${status})`} />
        <rect x="22" y="22" width="76" height="72" rx="16" fill={`url(#bodyGrad-${status})`} />
        <rect x="22" y="22" width="76" height="72" rx="16" fill="none" stroke={`url(#faceGrad-${status})`} strokeWidth="2" opacity="0.6" />
        <rect x="24" y="24" width="72" height="12" rx="12" fill="rgba(255,255,255,0.04)" />
        <rect x="30" y="82" width="8" height="5" rx="2" fill={`url(#faceGrad-${status})`} opacity="0.6" />
        <rect x="42" y="82" width="8" height="5" rx="2" fill={`url(#faceGrad-${status})`} opacity="0.4" />
        <rect x="54" y="82" width="8" height="5" rx="2" fill={`url(#faceGrad-${status})`} opacity="0.6" />
        <rect x="56" y="16" width="8" height="8" rx="3" fill={`url(#faceGrad-${status})`} />
        <rect x="59" y="4" width="2" height="14" rx="1" fill="rgba(255,255,255,0.3)" />

        <motion.circle
          cx="60"
          cy="4"
          r="4"
          fill={status === 'oops' ? '#ef4444' : status === 'win' ? '#f472b6' : '#2dd4bf'}
          filter={`url(#glow-${status})`}
          animate={{ r: [3.5, 5, 3.5], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: 'easeInOut' }}
        />

        <motion.g
          style={{ transformOrigin: '22px 62px' }}
          animate={{ rotate: status === 'win' ? [-25, 0, -25] : status === 'oops' ? [5, -5, 5] : 0 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: status === 'win' ? 0.4 : 1.2 }}
        >
          <rect x="8" y="48" width="14" height="28" rx="7" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="9" y="48" width="12" height="14" rx="6" fill="rgba(255,255,255,0.05)" />
          <rect x="10" y="72" width="10" height="5" rx="3" fill={armColor} opacity="0.8" />
        </motion.g>
        <motion.g
          style={{ transformOrigin: '98px 62px' }}
          animate={{ rotate: status === 'win' ? [25, 0, 25] : status === 'oops' ? [-5, 5, -5] : 0 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: status === 'win' ? 0.4 : 1.2 }}
        >
          <rect x="98" y="48" width="14" height="28" rx="7" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="99" y="48" width="12" height="14" rx="6" fill="rgba(255,255,255,0.05)" />
          <rect x="100" y="72" width="10" height="5" rx="3" fill={armColor} opacity="0.8" />
        </motion.g>

        {renderScreen()}
        {renderEyes()}
        {renderMouth()}
        {(status === 'happy' || status === 'win') && (
          <>
            <ellipse cx="33" cy="57" rx="5" ry="3" fill="rgba(244,114,182,0.35)" />
            <ellipse cx="87" cy="57" rx="5" ry="3" fill="rgba(244,114,182,0.35)" />
          </>
        )}
      </svg>
    </div>
  )
}
