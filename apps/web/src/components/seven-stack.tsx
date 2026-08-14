import { mediaUrl } from '../lib/api'
import type { Track } from '@radio/shared'

type Props = {
  playlistId: string
  tracks: Track[]
  currentIndex: number
  onPlay: (index: number) => void
}

export const SevenStack = ({
  playlistId,
  tracks,
  currentIndex,
  onPlay,
}: Props) => {
  if (tracks.length < 2) return null

  const upcoming = [1, 2, 3]
    .map((offset) => {
      const index = (currentIndex + offset) % tracks.length
      if (index === currentIndex) return null
      return { track: tracks[index], index }
    })
    .filter((item): item is { track: Track; index: number } => item !== null)
    .filter(
      (item, pos, list) => list.findIndex((row) => row.index === item.index) === pos,
    )
    .slice(0, 3)

  if (upcoming.length === 0) return null

  return (
    <div className="seven-stack" aria-label="Coming up on this pressing">
      {upcoming.map(({ track, index }, depth) => {
        const art = mediaUrl(playlistId, track.videoId, 'thumb')
        return (
          <button
            key={`${track.videoId}-${index}`}
            type="button"
            className="seven-inch"
            style={{
              zIndex: upcoming.length - depth,
              translate: `${depth * 7}px ${depth * 9}px`,
            }}
            title={track.title}
            aria-label={`Play ${track.title}`}
            onClick={() => onPlay(index)}
          >
            <span className="seven-disc">
              <img src={art} alt="" className="seven-label" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
