import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fade } from '../lib/motion'

type Props = {
  cover: string | null
  playing: boolean
  progress: number
  duration: number
  shuffle: boolean
  hasTrack: boolean
  onToggle: () => void
  onSeek: (time: number) => void
  onPrev: () => void
  onNext: () => void
  onShuffle: () => void
  disabled?: boolean
  awaitingDisc?: boolean
  discId?: string | null
  children?: ReactNode
}

const INNER = 0.31
const OUTER = 0.92

export const Turntable = ({
  cover,
  playing,
  progress,
  duration,
  shuffle,
  hasTrack,
  onToggle,
  onSeek,
  onPrev,
  onNext,
  onShuffle,
  disabled = false,
  awaitingDisc = false,
  discId = null,
  children,
}: Props) => {
  const wellRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ active: boolean; moved: boolean }>({
    active: false,
    moved: false,
  })
  const [cueing, setCueing] = useState(false)

  const clamped = Math.min(1, Math.max(0, progress))
  const armAngle = playing || cueing ? 6 + clamped * 24 : -22

  const seekFromPoint = (clientX: number, clientY: number) => {
    const well = wellRef.current
    if (!well || duration <= 0) return
    const rect = well.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    const dist = Math.hypot(dx, dy)
    const radius = rect.width / 2
    const inner = radius * INNER
    const outer = radius * OUTER
    const t = 1 - (dist - inner) / (outer - inner)
    onSeek(Math.min(duration, Math.max(0, t * duration)))
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || awaitingDisc) return
    dragRef.current = { active: true, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    if (Math.hypot(event.movementX, event.movementY) > 1) {
      dragRef.current.moved = true
      setCueing(true)
      seekFromPoint(event.clientX, event.clientY)
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const wasDrag = dragRef.current.moved
    dragRef.current = { active: false, moved: false }
    setCueing(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    if (!wasDrag && !disabled && !awaitingDisc) onToggle()
  }

  return (
    <div className="machine">
      <div className="machine-wood">
        <span className="wood-screw wood-screw-tl" />
        <span className="wood-screw wood-screw-tr" />
        <span className="wood-screw wood-screw-bl" />
        <span className="wood-screw wood-screw-br" />

        <div className="machine-plinth">
          <div ref={wellRef} className="platter-well">
            <div className="platter" aria-hidden>
              <div className="platter-rim" />
              <div className="platter-felt" />
            </div>

            <div
              role="slider"
              tabIndex={disabled || awaitingDisc ? -1 : 0}
              aria-label="Vinyl platter. Click to play or pause. Drag toward the label to seek."
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(clamped * 100)}
              aria-disabled={disabled || awaitingDisc}
              data-platter=""
              data-awaiting={awaitingDisc ? 'true' : 'false'}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="vinyl-hit z-10 cursor-pointer touch-none"
            >
              <div
                key={discId ?? 'empty'}
                className="vinyl vinyl-spin h-full w-full"
                data-paused={String(!playing || cueing)}
              >
                <AnimatePresence initial={false}>
                  {cover ? (
                    <motion.img
                      key={cover}
                      src={cover}
                      alt=""
                      className="vinyl-press"
                      {...fade}
                    />
                  ) : null}
                </AnimatePresence>
                <div className="vinyl-grooves" />
                <div className="vinyl-label">
                  <AnimatePresence mode="wait" initial={false}>
                    {cover ? (
                      <motion.img
                        key={cover}
                        src={cover}
                        alt=""
                        className="vinyl-label-art"
                        {...fade}
                      />
                    ) : (
                      <motion.div key="blank" className="vinyl-label-blank" {...fade}>
                        <span>Fred</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="vinyl-label-paper" />
                </div>
              </div>
              <div className="vinyl-fill pointer-events-none" />
              <div className="vinyl-spark pointer-events-none" />
              <div className="vinyl-edge pointer-events-none" />
            </div>

            <div className="spindle" aria-hidden>
              <span className="spindle-washer" />
              <span className="spindle-shaft" />
            </div>

            <Tonearm angle={armAngle} lowered={playing || cueing} cueing={cueing} />
          </div>

          <div className="deck-console">
            <div className="console-main">{children}</div>
            <div className="deck-panel">
              <div className="deck-keys">
                <DeckKey label="Prev" onClick={onPrev} disabled={!hasTrack || awaitingDisc}>
                  <SkipIcon dir="prev" />
                </DeckKey>
                <DeckKey
                  label={playing ? 'Pause' : 'Play'}
                  onClick={onToggle}
                  disabled={!hasTrack || awaitingDisc}
                  lit={playing}
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </DeckKey>
                <DeckKey label="Next" onClick={onNext} disabled={!hasTrack || awaitingDisc}>
                  <SkipIcon dir="next" />
                </DeckKey>
                <DeckKey label="Shuffle" onClick={onShuffle} lit={shuffle}>
                  <ShuffleIcon />
                </DeckKey>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DeckKey = ({
  children,
  onClick,
  label,
  disabled = false,
  lit = false,
}: {
  children: ReactNode
  onClick: () => void
  label: string
  disabled?: boolean
  lit?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="deck-key"
    data-lit={lit ? 'true' : 'false'}
  >
    {children}
  </button>
)

const PIVOT = { x: 418, y: 78 }

const Tonearm = ({
  angle,
  cueing,
}: {
  angle: number
  lowered: boolean
  cueing: boolean
}) => (
  <svg
    className="tonearm pointer-events-none absolute inset-0 z-20 h-full w-full"
    viewBox="0 0 500 500"
    aria-hidden
  >
    <defs>
      <linearGradient id="arm-chrome" x1="0.12" y1="0" x2="0.88" y2="1">
        <stop offset="0%" stopColor="#f4f6f7" />
        <stop offset="14%" stopColor="#b8bec4" />
        <stop offset="32%" stopColor="#6e747a" />
        <stop offset="48%" stopColor="#2a2e32" />
        <stop offset="63%" stopColor="#9aa1a8" />
        <stop offset="82%" stopColor="#dce0e4" />
        <stop offset="100%" stopColor="#8d9399" />
      </linearGradient>
      <linearGradient id="arm-spec" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="40%" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="gimbal-top" cx="42%" cy="34%" r="68%">
        <stop offset="0%" stopColor="#d0d4d8" />
        <stop offset="38%" stopColor="#8b9197" />
        <stop offset="100%" stopColor="#2c3034" />
      </radialGradient>
      <radialGradient id="weight-top" cx="40%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#3a3e42" />
        <stop offset="55%" stopColor="#1a1c1e" />
        <stop offset="100%" stopColor="#0b0c0d" />
      </radialGradient>
      <filter id="arm-shadow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" />
        <feOffset dx="5" dy="9" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.32" />
        </feComponentTransfer>
      </filter>
    </defs>

    <g
      className="tonearm-swing"
      style={{
        transform: `rotate(${angle}deg)`,
        transition: cueing ? 'none' : undefined,
      }}
    >
      <g filter="url(#arm-shadow)" opacity="0.9">
        <path
          d="M418 78 C 368 90, 312 132, 258 198 S 186 292, 164 326"
          fill="none"
          stroke="#000"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="458" cy="56" r="15" fill="#000" />
      </g>

      <circle cx="458" cy="56" r="17.5" fill="#121416" />
      <circle cx="458" cy="56" r="15.2" fill="url(#weight-top)" />
      <circle cx="458" cy="56" r="15.2" fill="none" stroke="#4a5056" strokeWidth="0.55" />
      <circle cx="458" cy="56" r="11.4" fill="none" stroke="#2a2e32" strokeWidth="0.4" />
      <circle cx="458" cy="56" r="8.2" fill="none" stroke="#5a6066" strokeWidth="0.35" opacity="0.7" />
      <g stroke="#6a7076" strokeWidth="0.45" opacity="0.55">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          const x1 = 458 + Math.cos(a) * 12.2
          const y1 = 56 + Math.sin(a) * 12.2
          const x2 = 458 + Math.cos(a) * 14.6
          const y2 = 56 + Math.sin(a) * 14.6
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
      </g>
      <circle cx="454" cy="52" r="3.2" fill="rgba(255,255,255,0.08)" />

      <path
        d="M442 64 L 428 74"
        stroke="url(#arm-chrome)"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M442 64 L 428 74"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
        strokeLinecap="round"
        transform="translate(-0.7 -0.9)"
      />

      <path
        d="M418 78 C 368 90, 312 132, 258 198 S 186 292, 164 326"
        fill="none"
        stroke="#0c0d0e"
        strokeWidth="8.2"
        strokeLinecap="round"
      />
      <path
        d="M418 78 C 368 90, 312 132, 258 198 S 186 292, 164 326"
        fill="none"
        stroke="url(#arm-chrome)"
        strokeWidth="6.1"
        strokeLinecap="round"
      />
      <path
        d="M418 78 C 368 90, 312 132, 258 198 S 186 292, 164 326"
        fill="none"
        stroke="url(#arm-spec)"
        strokeWidth="1.35"
        strokeLinecap="round"
        transform="translate(-1.15 -1.55)"
      />
      <path
        d="M418 78 C 368 90, 312 132, 258 198 S 186 292, 164 326"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.7"
        strokeLinecap="round"
        transform="translate(1.1 1.4)"
      />

      <g transform="rotate(38 164 326)">
        <path d="M168 326 L 176 322" stroke="url(#arm-chrome)" strokeWidth="4.2" strokeLinecap="round" />
        <rect x="136" y="316.5" width="34" height="14.5" rx="0.8" fill="#16181a" />
        <rect x="136" y="316.5" width="34" height="14.5" rx="0.8" fill="none" stroke="#3a3e42" strokeWidth="0.5" />
        <rect x="139" y="319.2" width="20" height="0.7" fill="#4a5056" />
        <rect x="139" y="322.2" width="20" height="0.7" fill="#4a5056" />
        <rect x="139" y="325.2" width="20" height="0.7" fill="#4a5056" />
        <circle cx="162" cy="320.4" r="1.15" fill="#8a9096" />
        <circle cx="162" cy="327.2" r="1.15" fill="#8a9096" />
        <rect x="124" y="318.2" width="13" height="11.2" rx="0.6" fill="#0d0e10" />
        <rect x="124" y="318.2" width="13" height="11.2" rx="0.6" fill="none" stroke="#3a3e42" strokeWidth="0.4" />
        <rect x="126" y="320.4" width="4.2" height="1.1" fill="#c9a46a" />
        <rect x="126" y="325.6" width="4.2" height="1.1" fill="#c9a46a" />
        <path d="M148 316.5 C 148 310, 158 310, 158 316.5" fill="none" stroke="#c5c9ce" strokeWidth="1.05" />
        <line x1="124" y1="329" x2="114.5" y2="333.6" stroke="#b08a4a" strokeWidth="0.85" />
        <circle cx="114.1" cy="333.9" r="0.85" fill="#e8dcc8" />
      </g>
    </g>

    {/* Gimbal stays bolted to the deck */}
    <circle cx={PIVOT.x} cy={PIVOT.y} r="26" fill="#101214" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="23.5" fill="#2a2e32" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="23.5" fill="none" stroke="#6a7076" strokeWidth="0.7" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="19.2" fill="url(#gimbal-top)" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="19.2" fill="none" stroke="#c5c9ce" strokeWidth="0.45" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="12.4" fill="#1c1e22" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="12.4" fill="none" stroke="#8a9096" strokeWidth="0.5" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="5.6" fill="#cfd3d6" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="5.6" fill="none" stroke="#5a6066" strokeWidth="0.4" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r="2.1" fill="#111214" />
    <circle cx="411.2" cy="71.4" r="1.55" fill="#9aa0a6" />
    <circle cx="424.8" cy="71.2" r="1.55" fill="#9aa0a6" />
    <circle cx="418" cy="86.6" r="1.55" fill="#9aa0a6" />
    <line x1="411.2" y1="70.4" x2="411.2" y2="72.4" stroke="#1a1c1e" strokeWidth="0.35" />
    <line x1="424.8" y1="70.2" x2="424.8" y2="72.2" stroke="#1a1c1e" strokeWidth="0.35" />

    <path
      d="M438 72 L 462 82"
      stroke="#b8bec4"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M438 72 L 462 82"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.6"
      strokeLinecap="round"
      transform="translate(-0.4 -0.5)"
    />
    <circle cx="464" cy="83" r="4.1" fill="#141618" stroke="#6a7076" strokeWidth="0.55" />
    <circle cx="463.2" cy="81.8" r="1.3" fill="rgba(255,255,255,0.12)" />

    <circle cx="436" cy="96" r="5.4" fill="#1a1c1e" />
    <circle cx="436" cy="96" r="4.2" fill="#8a9096" />
    <circle cx="436" cy="96" r="2.4" fill="#2a2e32" />
    <line x1="436" y1="92.4" x2="436" y2="94.2" stroke="#eee" strokeWidth="0.7" />
  </svg>
)

const iconProps = {
  viewBox: '0 0 16 16',
  fill: 'currentColor',
  'aria-hidden': true as const,
  className: 'h-[9px] w-[9px] opacity-80',
}

const PlayIcon = () => (
  <svg {...iconProps}>
    <path d="M4.2 2.4v11.2L13.4 8 4.2 2.4Z" />
  </svg>
)

const PauseIcon = () => (
  <svg {...iconProps}>
    <rect x="3.2" y="2.6" width="3.2" height="10.8" rx="0.4" />
    <rect x="9.6" y="2.6" width="3.2" height="10.8" rx="0.4" />
  </svg>
)

const SkipIcon = ({ dir }: { dir: 'prev' | 'next' }) => (
  <svg {...iconProps} style={{ transform: dir === 'prev' ? 'scaleX(-1)' : undefined }}>
    <path d="M3 2.5v11h2.1V9.4L12.8 14V2L5.1 6.6V2.5H3Z" />
  </svg>
)

const ShuffleIcon = () => (
  <svg {...iconProps}>
    <path d="M10.2 2.2h3.4v3.4h-1.4V4.7L9.6 7.3 8.6 6.3l2.6-2.6H10.2V2.2Zm-7.6.6h3.2l2.4 3.1-1.1 1.1L4.8 4.2H2.6V2.8Zm11 7.6v1.5h-1.6l-2.4-3.1 1.1-1.1 2.3 2.9h.6V10.4H13.6Zm-11 2.8V11.8h2.2l2.4-3.1 1.1 1.1-2.3 2.9H2.6Z" />
  </svg>
)
