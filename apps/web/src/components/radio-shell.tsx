import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MANUAL_PLAYLIST_ID, analogueTheme, type Track } from '@radio/shared'
import { mediaUrl, formatTime, type PlaylistSummary } from '../lib/api'
import type { PlayerApi } from '../hooks/use-player'
import { Transport } from './transport'
import { ImportFlow } from './import-flow'
import { TrackList } from './ui'
import { Turntable } from './turntable'
import { VuMeters } from './vu-meter'
import { SyncPlaylistButton } from './sync-playlist-button'

type Props = {
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  tracks: Track[]
  onSelectPlaylist: (id: string) => void
  onImported: (playlistId: string) => void
  onSynced: (playlistId: string) => void
  onRemoveVideo: (videoId: string) => Promise<void>
  player: PlayerApi
  error: string | null
  loading: boolean
}

export const RadioShell = ({
  playlists,
  activePlaylistId,
  tracks,
  onSelectPlaylist,
  onImported,
  onSynced,
  onRemoveVideo,
  player,
  error,
  loading,
}: Props) => {
  const { current, state, playAt, toggle, next, prev, seek } = player
  const [crateOpen, setCrateOpen] = useState(false)
  const [tilt, setTilt] = useState({ x: 8, y: -6 })
  const [shineAngle, setShineAngle] = useState(210)

  const cover =
    current && activePlaylistId
      ? mediaUrl(activePlaylistId, current.videoId, 'thumb')
      : null

  const playlistTitle =
    playlists.find((p) => p.playlistId === activePlaylistId)?.title ?? 'Library'

  const canEditTracks = activePlaylistId === MANUAL_PLAYLIST_ID
  const progress =
    state.duration > 0 ? state.currentTime / state.duration : 0

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        toggle()
      }
      if (event.code === 'ArrowRight') next()
      if (event.code === 'ArrowLeft') prev()
      if (event.code === 'KeyC') setCrateOpen((open) => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, next, prev])

  const onStageMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = (event.clientX - rect.left) / rect.width - 0.5
    const ny = (event.clientY - rect.top) / rect.height - 0.5
    setTilt({
      x: 8 + ny * -7,
      y: -6 + nx * 10,
    })
    setShineAngle(200 + nx * 70)
  }

  return (
    <div
      className="stage relative min-h-dvh overflow-hidden"
      onPointerMove={onStageMove}
    >
      <audio ref={player.audioRef} preload="metadata" crossOrigin="anonymous" />

      {cover ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(64px) saturate(0.75) brightness(0.22)',
            transform: 'scale(1.2)',
            opacity: 0.7,
          }}
        />
      ) : null}

      <div className="vignette" />
      <div className="grain" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between px-5 pt-5 md:px-8 md:pt-6">
        <div className="pointer-events-auto">
          <p
            className="text-[0.62rem] uppercase text-[var(--muted)]"
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: 'var(--letter-brand)',
            }}
          >
            Fred Radio
          </p>
          <p
            className="mt-1 text-[0.58rem] uppercase text-[var(--accent)]"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.28em' }}
          >
            {analogueTheme.tagline}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className="hw-btn"
            data-lit={crateOpen ? 'true' : 'false'}
            onClick={() => setCrateOpen((open) => !open)}
            aria-expanded={crateOpen}
          >
            Crate
          </button>
          <ImportFlow onImported={onImported} />
        </div>
      </header>

      <div
        className="deck"
        style={{
          transform: `translateY(-50%) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <Turntable
          cover={cover}
          playing={state.playing}
          progress={progress}
          duration={state.duration}
          onToggle={toggle}
          onSeek={seek}
          disabled={!current}
          shineAngle={shineAngle}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute bottom-[22%] left-[min(52%,calc(100%-22rem))] right-6 max-w-xl md:right-10 lg:left-[54%]">
          <p
            className="text-[0.58rem] uppercase text-[var(--muted)]"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.32em' }}
          >
            {state.playing ? 'On the platter' : 'Standby'}
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={current?.videoId ?? 'empty'}
              initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 line-clamp-3 text-[clamp(2.4rem,6.2vw,6.4rem)] font-medium leading-[0.88] tracking-[-0.045em]"
            >
              {current?.title ?? 'Nothing on the platter'}
            </motion.h1>
          </AnimatePresence>
          <p
            className="mt-4 text-[0.72rem] text-[var(--muted)]"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
          >
            {playlistTitle}
            {current
              ? `  ·  ${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
              : '  ·  drag the grooves to cue'}
          </p>
          <div className="pointer-events-auto mt-6">
            <Transport player={player} />
          </div>
        </div>

        <div className="pointer-events-auto absolute right-6 top-24 w-40 md:right-10">
          <VuMeters audioRef={player.audioRef} playing={state.playing} />
        </div>
      </div>

      <Crate
        open={crateOpen}
        onClose={() => setCrateOpen(false)}
        tracks={tracks}
        currentId={current?.videoId ?? null}
        playlistTitle={playlistTitle}
        onPlayTrack={playAt}
        canEditTracks={canEditTracks}
        onRemoveVideo={onRemoveVideo}
        loading={loading}
        error={error}
      />

      <SleeveRail
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelect={onSelectPlaylist}
        onSynced={onSynced}
        error={error}
      />
    </div>
  )
}

const SleeveRail = ({
  playlists,
  activePlaylistId,
  onSelect,
  onSynced,
  error,
}: {
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  onSelect: (id: string) => void
  onSynced: (id: string) => void
  error: string | null
}) => (
  <div className="sleeve-rail z-40">
    {playlists.length === 0 ? (
      <p
        className="px-1 py-6 text-[0.68rem] uppercase"
        style={{
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em',
          color: error ? 'var(--accent)' : 'var(--muted)',
        }}
      >
        {error ?? 'Acquire a pressing to fill the crate'}
      </p>
    ) : (
      playlists.map((playlist, index) => {
        const active = playlist.playlistId === activePlaylistId
        const art = playlist.coverVideoId
          ? mediaUrl(playlist.playlistId, playlist.coverVideoId, 'thumb')
          : null
        return (
          <div key={playlist.playlistId} className="relative shrink-0">
            <button
              type="button"
              onClick={() => onSelect(playlist.playlistId)}
              className="sleeve"
              data-active={active ? 'true' : 'false'}
              style={{ rotate: `${(index % 5) * 2 - 4}deg` }}
              title={playlist.title}
            >
              {art ? (
                <img src={art} alt="" className="h-full w-full object-cover" />
              ) : (
                <span
                  className="grid h-full w-full place-items-center px-2 text-center text-[0.55rem] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}
                >
                  {playlist.title}
                </span>
              )}
            </button>
            <div className="absolute -right-1 -top-1">
              <SyncPlaylistButton
                playlistId={playlist.playlistId}
                playlistTitle={playlist.title}
                canSync={playlist.canSync}
                onSynced={onSynced}
              />
            </div>
          </div>
        )
      })
    )}
  </div>
)

const Crate = ({
  open,
  onClose,
  tracks,
  currentId,
  playlistTitle,
  onPlayTrack,
  canEditTracks,
  onRemoveVideo,
  loading,
  error,
}: {
  open: boolean
  onClose: () => void
  tracks: Track[]
  currentId: string | null
  playlistTitle: string
  onPlayTrack: (index: number) => void
  canEditTracks: boolean
  onRemoveVideo: (videoId: string) => Promise<void>
  loading: boolean
  error: string | null
}) => (
  <>
    <AnimatePresence>
      {open ? (
        <motion.button
          type="button"
          aria-label="Close crate"
          className="fixed inset-0 z-40 bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      ) : null}
    </AnimatePresence>
    <aside className="crate z-50" data-open={open ? 'true' : 'false'}>
      <div className="flex h-full flex-col p-5 md:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p
              className="text-[0.58rem] uppercase text-[var(--muted)]"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              Crate
            </p>
            <p className="mt-1 line-clamp-1 text-lg font-medium">{playlistTitle}</p>
          </div>
          <button type="button" className="hw-btn" onClick={onClose}>
            Close
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : error ? (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {error}
          </p>
        ) : (
          <TrackList
            tracks={tracks}
            currentId={currentId}
            onPlayTrack={(index) => {
              onPlayTrack(index)
              onClose()
            }}
            canEditTracks={canEditTracks}
            onRemoveVideo={onRemoveVideo}
            className="min-h-0 flex-1 overflow-y-auto pr-1"
          />
        )}
      </div>
    </aside>
  </>
)
