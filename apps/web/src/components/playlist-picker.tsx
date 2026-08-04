import type { CSSProperties, ReactNode } from 'react'
import type { PlaylistSummary } from '../lib/api'
import { SyncPlaylistButton } from './sync-playlist-button'

type Props = {
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  onSelect: (playlistId: string) => void
  onSynced: (playlistId: string) => void
  empty?: ReactNode
  showCount?: boolean
  className?: string
  itemClassName?: string
  titleClassName?: string
  titleStyle?: (active: boolean) => CSSProperties | undefined
  meta?: (playlist: PlaylistSummary, active: boolean) => ReactNode
}

export const PlaylistPicker = ({
  playlists,
  activePlaylistId,
  onSelect,
  onSynced,
  empty = <p className="text-sm text-[var(--muted)]">Nothing here yet.</p>,
  showCount = false,
  className = 'flex flex-col gap-1',
  itemClassName = 'flex items-center gap-1',
  titleClassName = 'min-w-0 flex-1 py-2 text-left',
  titleStyle,
  meta,
}: Props) => {
  if (playlists.length === 0) return <>{empty}</>

  return (
    <div className={className}>
      {playlists.map((p) => {
        const active = p.playlistId === activePlaylistId
        return (
          <div key={p.playlistId} className={itemClassName}>
            <button
              type="button"
              onClick={() => onSelect(p.playlistId)}
              className={titleClassName}
              style={{
                color: active ? 'var(--ink)' : 'var(--muted)',
                ...titleStyle?.(active),
              }}
            >
              <span className="line-clamp-1">{p.title}</span>
              {meta?.(p, active)}
            </button>
            {showCount ? (
              <span
                className="shrink-0 text-[0.65rem] tabular-nums text-[var(--muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {p.trackCount}
              </span>
            ) : null}
            <SyncPlaylistButton
              playlistId={p.playlistId}
              playlistTitle={p.title}
              canSync={p.canSync}
              onSynced={onSynced}
            />
          </div>
        )
      })}
    </div>
  )
}
