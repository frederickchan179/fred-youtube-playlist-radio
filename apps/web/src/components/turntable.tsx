import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type Props = {
  cover: string | null
  playing: boolean
  progress: number
  duration: number
  onToggle: () => void
  onSeek: (time: number) => void
  disabled?: boolean
  shineAngle: number
}

const INNER = 0.31
const OUTER = 0.92

export const Turntable = ({
  cover,
  playing,
  progress,
  duration,
  onToggle,
  onSeek,
  disabled = false,
  shineAngle,
}: Props) => {
  const wellRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ active: boolean; moved: boolean }>({
    active: false,
    moved: false,
  })
  const [cueing, setCueing] = useState(false)

  const clamped = Math.min(1, Math.max(0, progress))
  const armAngle = playing || cueing ? 8 + clamped * 26 : -28

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
    if (disabled) return
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
    if (!wasDrag && !disabled) onToggle()
  }

  return (
    <div ref={wellRef} className="platter-well relative h-full w-full">
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Vinyl platter. Click to play or pause. Drag toward the label to seek forward."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped * 100)}
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-[2.5%] z-10 cursor-pointer rounded-full touch-none"
      >
        <div
          className="vinyl vinyl-spin h-full w-full"
          data-paused={String(!playing || cueing)}
        >
          <div className="vinyl-label">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="grid h-full w-full place-items-center"
                style={{
                  background:
                    'radial-gradient(circle at 40% 35%, #5a4038, var(--walnut-deep))',
                }}
              >
                <span
                  className="px-3 text-center text-[clamp(0.7rem,1.4vw,1.1rem)] uppercase text-[var(--accent)]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.32em',
                  }}
                >
                  Fred
                </span>
              </div>
            )}
          </div>
          <div className="vinyl-spindle" />
        </div>
        <div
          className="vinyl-shine pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from ${shineAngle}deg, transparent 0 36%, rgba(255,255,255,0.16) 47%, transparent 60%)`,
          }}
        />
      </div>

      <Tonearm angle={armAngle} lowered={playing || cueing} cueing={cueing} />
    </div>
  )
}

const Tonearm = ({
  angle,
  lowered,
  cueing,
}: {
  angle: number
  lowered: boolean
  cueing: boolean
}) => (
  <svg
    className="tonearm pointer-events-none absolute inset-0 z-20 h-full w-full"
    viewBox="0 0 400 400"
    aria-hidden
    style={{
      transform: `rotate(${angle}deg) translateY(${lowered ? 0 : -10}px)`,
      transition: cueing ? 'none' : undefined,
    }}
  >
    <defs>
      <linearGradient id="arm-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f7f8f8" />
        <stop offset="35%" stopColor="#d5d8da" />
        <stop offset="68%" stopColor="#8b9094" />
        <stop offset="100%" stopColor="#eceeee" />
      </linearGradient>
      <linearGradient id="arm-base" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a4540" />
        <stop offset="100%" stopColor="#12100e" />
      </linearGradient>
    </defs>
    <circle cx="342" cy="52" r="26" fill="url(#arm-base)" stroke="#8a8580" strokeWidth="1.4" />
    <circle cx="342" cy="52" r="10" fill="url(#arm-metal)" />
    <circle cx="342" cy="52" r="3" fill="#111" />
    <path
      d="M342 52 C 292 68, 236 118, 152 228"
      fill="none"
      stroke="url(#arm-metal)"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path
      d="M164 214 L 132 248"
      fill="none"
      stroke="url(#arm-metal)"
      strokeWidth="9"
      strokeLinecap="square"
    />
    <rect
      x="122"
      y="242"
      width="20"
      height="12"
      rx="1"
      fill="#1c1c1c"
      stroke="#c4a574"
      strokeWidth="1"
      transform="rotate(48 132 248)"
    />
  </svg>
)
