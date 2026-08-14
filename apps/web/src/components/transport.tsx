import type { ReactNode } from 'react'
import { formatTime } from '../lib/api'
import type { PlayerApi } from '../hooks/use-player'

type Props = {
  player: PlayerApi
}

export const Transport = ({ player }: Props) => {
  const { state, current, toggle, next, prev, toggleShuffle } = player

  return (
    <div className="flex flex-wrap items-center gap-2">
      <HwButton label="Previous" onClick={prev} disabled={!current}>
        Prev
      </HwButton>
      <HwButton
        label={state.playing ? 'Pause' : 'Play'}
        onClick={toggle}
        disabled={!current}
        lit={state.playing}
      >
        {state.playing ? 'Pause' : 'Play'}
      </HwButton>
      <HwButton label="Next" onClick={next} disabled={!current}>
        Next
      </HwButton>
      <HwButton label="Shuffle" onClick={toggleShuffle} accent={state.shuffle}>
        Shuffle
      </HwButton>
      {current ? (
        <span
          className="ml-2 text-[0.7rem] tabular-nums text-[var(--muted)]"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
        >
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </span>
      ) : null}
    </div>
  )
}

const HwButton = ({
  children,
  onClick,
  label,
  disabled = false,
  lit = false,
  accent = false,
}: {
  children: ReactNode
  onClick: () => void
  label: string
  disabled?: boolean
  lit?: boolean
  accent?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="hw-btn"
    data-lit={lit ? 'true' : 'false'}
    data-accent={accent ? 'true' : 'false'}
  >
    {children}
  </button>
)
