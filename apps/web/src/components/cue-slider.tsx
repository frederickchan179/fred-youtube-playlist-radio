import { formatTime } from '../lib/api'

type Props = {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  disabled?: boolean
}

export const CueSlider = ({
  currentTime,
  duration,
  onSeek,
  disabled = false,
}: Props) => {
  const max = duration > 0 ? duration : 1
  const fillPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const isIdle = disabled || duration <= 0

  return (
    <div className="cue-rail" data-disabled={isIdle ? 'true' : 'false'}>
      <div className="cue-rail-well" aria-hidden>
        <span className="cue-rail-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      <input
        type="range"
        className="cue-slider"
        min={0}
        max={max}
        step={0.05}
        value={Math.min(currentTime, max)}
        disabled={isIdle}
        aria-label="Seek"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        onChange={(event) => onSeek(Number(event.currentTarget.value))}
      />
    </div>
  )
}
