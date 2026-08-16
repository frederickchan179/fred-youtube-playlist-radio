import type { Track } from '@radio/shared'
import { formatTime } from '../lib/api'

type TrackListProps = {
  tracks: Track[]
  currentVideoId: string | null
  onPlayTrack: (index: number) => void
  canEditTracks?: boolean
  onRemoveVideo?: (videoId: string) => Promise<void>
}

export const TrackList = ({
  tracks,
  currentVideoId,
  onPlayTrack,
  canEditTracks = false,
  onRemoveVideo,
}: TrackListProps) => {
  if (tracks.length === 0) {
    return (
      <p
        className="py-6 text-sm text-[var(--muted)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Nothing on the platter.
      </p>
    )
  }

  return (
    <div className="rail-scroll">
      <div
        className="mb-1 grid grid-cols-[2.25rem_1fr_3.25rem] gap-2 px-1 text-[0.58rem] uppercase text-[var(--muted)]"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}
      >
        <span>#</span>
        <span>Title</span>
        <span className="text-right">Time</span>
      </div>
      {tracks.map((track, index) => {
        const isPlaying = track.videoId === currentVideoId
        return (
          <div
            key={track.videoId}
            className="liner-row px-1 py-2.5"
            data-active={isPlaying ? 'true' : 'false'}
          >
            <button
              type="button"
              onClick={() => onPlayTrack(index)}
              className="grid w-full grid-cols-[2.25rem_1fr_3.25rem] items-center gap-2 text-left"
            >
              <span
                className="cut-index text-[0.65rem] tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {isPlaying ? '♪' : String(index + 1).padStart(2, '0')}
              </span>
              <span className="cut-title line-clamp-1 text-sm">
                {track.title}
              </span>
              <span
                className="text-right text-[0.65rem] tabular-nums text-[var(--muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {formatTime(track.durationSec ?? 0)}
              </span>
            </button>
            {canEditTracks && onRemoveVideo ? (
              <button
                type="button"
                onClick={() => void onRemoveVideo(track.videoId)}
                className="liner-remove"
                aria-label={`Remove ${track.title}`}
              >
                Remove
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
