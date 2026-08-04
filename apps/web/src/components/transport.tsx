import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { formatTime } from '../lib/api'
import type { PlayerApi } from '../hooks/use-player'

type Props = {
  player: PlayerApi
  compact?: boolean
  showTitle?: boolean
}

export const Transport = ({
  player,
  compact = false,
  showTitle = true,
}: Props) => {
  const { state, current, toggle, next, prev, seek, toggleShuffle } = player
  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <div className={`flex w-full flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
      {showTitle ? (
        <div className="min-h-[4.5rem]">
          <p
            className="text-[0.65rem] uppercase text-[var(--muted)]"
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: 'var(--letter-brand)',
            }}
          >
            Now playing
          </p>
          <motion.p
            key={current?.videoId ?? 'empty'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`mt-2 line-clamp-2 leading-[1.05] tracking-[-0.02em] ${
              compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'
            }`}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--track-weight)' as never,
            }}
          >
            {current?.title ?? 'Nothing on air'}
          </motion.p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="relative flex h-4 items-center">
          <input
            type="range"
            min={0}
            max={state.duration || 0}
            step={0.05}
            value={state.currentTime}
            disabled={!current}
            onChange={(e) => seek(Number(e.target.value))}
            className="seek"
            style={{ '--seek-progress': `${progress}%` } as CSSProperties}
            aria-label="Seek"
          />
        </div>
        <div
          className="flex justify-between text-[0.7rem] text-[var(--muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleShuffle}
          title="Shuffle"
          aria-label="Shuffle"
          aria-pressed={state.shuffle}
          className="grid h-11 w-11 place-items-center transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            background: 'color-mix(in oklab, var(--panel) 70%, transparent)',
            backdropFilter: 'blur(10px)',
            color: state.shuffle ? 'var(--accent)' : 'var(--muted)',
          }}
        >
          <ShuffleIcon />
        </button>

        <a
          href={
            current
              ? `https://www.youtube.com/watch?v=${current.videoId}`
              : '#'
          }
          target="_blank"
          rel="noreferrer"
          title="View on YouTube"
          aria-label="View on YouTube"
          aria-disabled={!current}
          tabIndex={current ? 0 : -1}
          className="grid h-11 w-11 place-items-center transition-opacity"
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            background: 'color-mix(in oklab, var(--panel) 70%, transparent)',
            backdropFilter: 'blur(10px)',
            color: 'var(--muted)',
            pointerEvents: current ? 'auto' : 'none',
            opacity: current ? 1 : 0.35,
          }}
          onClick={(e) => {
            if (!current) e.preventDefault()
          }}
        >
          <YouTubeIcon />
        </a>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <GhostButton label="Previous" onClick={prev}>
            <PrevIcon />
          </GhostButton>

          <button
            type="button"
            onClick={toggle}
            disabled={!current}
            className="grid h-14 w-14 place-items-center disabled:opacity-35 md:h-16 md:w-16"
            style={{
              borderRadius: 'var(--radius)',
              background: 'var(--ink)',
              color: 'var(--bg-0)',
              boxShadow: '0 12px 40px var(--glow)',
            }}
            title={state.playing ? 'Pause' : 'Play'}
            aria-label={state.playing ? 'Pause' : 'Play'}
          >
            {state.playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <GhostButton label="Next" onClick={next}>
            <NextIcon />
          </GhostButton>
        </div>
      </div>
    </div>
  )
}

const GhostButton = ({
  children,
  onClick,
  label,
}: {
  children: ReactNode
  onClick: () => void
  label: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="grid h-11 w-11 place-items-center text-[var(--ink)] transition-opacity hover:opacity-70"
    style={{
      borderRadius: 'var(--radius)',
      border: '1px solid var(--line)',
      background: 'color-mix(in oklab, var(--panel) 70%, transparent)',
      backdropFilter: 'blur(10px)',
    }}
  >
    {children}
  </button>
)

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.14v13.72L19 12 8 5.14z" />
  </svg>
)

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
  </svg>
)

const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
  </svg>
)

const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M16 6h2v12h-2V6zM6 18l8.5-6L6 6v12z" />
  </svg>
)

const ShuffleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="M15 15l6 6" />
    <path d="M4 4l5 5" />
  </svg>
)

const YouTubeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)
