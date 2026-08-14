import { useEffect, useRef, type ReactNode } from 'react'
import { mediaUrl, type PlaylistSummary } from '../lib/api'
import { SyncPlaylistButton } from './sync-playlist-button'

type Props = {
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  sleeveOpen?: boolean
  onSelect: (id: string) => void
  onSynced: (id: string) => void
  error: string | null
  acquire?: ReactNode
  children?: ReactNode
}

const SPINE_AT = 8

export const PressingBin = ({
  playlists,
  activePlaylistId,
  onSelect,
  onSynced,
  error,
  acquire,
  children,
}: Props) => {
  const railRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const slot = rail.querySelector<HTMLElement>(
      '.pressing-slot:has([data-active="true"])',
    )
    if (!slot) return
    const railBox = rail.getBoundingClientRect()
    const slotBox = slot.getBoundingClientRect()
    const delta =
      slotBox.left + slotBox.width / 2 - (railBox.left + railBox.width / 2)
    if (Math.abs(delta) < 8) return
    rail.scrollBy({ left: delta, behavior: 'smooth' })
  }, [activePlaylistId, playlists.length])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      if (rail.scrollWidth <= rail.clientWidth) return
      event.preventDefault()
      rail.scrollLeft += event.deltaY
    }
    rail.addEventListener('wheel', onWheel, { passive: false })
    return () => rail.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div className="bin" data-spines={playlists.length >= SPINE_AT ? 'true' : 'false'}>
      {children}
      <div className="bin-shelf" aria-hidden />
      <div ref={railRef} className="sleeve-rail">
        {playlists.length === 0 && error ? (
          <p
            className="self-center px-1 text-[0.68rem] uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.18em',
              color: 'var(--accent)',
            }}
          >
            {error}
          </p>
        ) : null}
        {playlists.map((playlist) => {
          const active = playlist.playlistId === activePlaylistId
          const art = playlist.coverVideoId
            ? mediaUrl(playlist.playlistId, playlist.coverVideoId, 'thumb')
            : null
          const cuts =
            playlist.trackCount === 1
              ? '1 cut'
              : `${playlist.trackCount} cuts`

          if (active) {
            return (
              <div
                key={playlist.playlistId}
                className="pressing-slot"
                aria-hidden
              >
                <div className="pressing-ghost" title={`${playlist.title} is on the desk`} />
              </div>
            )
          }

          return (
            <div key={playlist.playlistId} className="pressing-slot">
              <button
                type="button"
                onClick={() => onSelect(playlist.playlistId)}
                className="pressing"
                aria-label={`${playlist.title}, ${cuts}`}
              >
                <span className="pressing-vinyl" aria-hidden />
                <span className="pressing-jacket">
                  {art ? (
                    <img src={art} alt="" className="pressing-art" />
                  ) : (
                    <span className="pressing-blank">{playlist.title}</span>
                  )}
                  <span className="pressing-board" aria-hidden />
                  <span className="pressing-spine-title">{playlist.title}</span>
                  <span className="pressing-sticker">
                    <span className="pressing-title">{playlist.title}</span>
                    <span className="pressing-meta">{cuts}</span>
                  </span>
                </span>
              </button>
              <div className="pressing-pin">
                <SyncPlaylistButton
                  playlistId={playlist.playlistId}
                  playlistTitle={playlist.title}
                  canSync={playlist.canSync}
                  onSynced={onSynced}
                  variant="pin"
                />
              </div>
            </div>
          )
        })}
        {acquire}
      </div>
    </div>
  )
}
