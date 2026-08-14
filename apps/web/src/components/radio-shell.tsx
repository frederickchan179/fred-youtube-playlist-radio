import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MANUAL_PLAYLIST_ID, analogueTheme, type Track } from '@radio/shared'
import { mediaUrl, formatTime, type PlaylistSummary } from '../lib/api'
import type { PlayerApi } from '../hooks/use-player'
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
  const stageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const started = performance.now()
    const period = 72000
    const phase = (5 * Math.PI) / 4

    const tick = (now: number) => {
      const t = ((now - started) / period) * Math.PI * 2 + phase
      const cx = Math.cos(t)
      const cy = Math.sin(t)
      const az = (t * 180) / Math.PI - 90
      const lx = 50 + cx * 38
      const ly = 40 + cy * 28
      const rx = 50 + cx * 30
      const ry = 50 + cy * 28
      const sx = -cx * 22
      const sy = 16 - cy * 14
      const gain = 0.86 - cy * 0.1
      stage.style.setProperty('--light-az', `${az.toFixed(2)}deg`)
      stage.style.setProperty('--light-x', `${lx.toFixed(2)}%`)
      stage.style.setProperty('--light-y', `${ly.toFixed(2)}%`)
      stage.style.setProperty('--ref-x', `${rx.toFixed(2)}%`)
      stage.style.setProperty('--ref-y', `${ry.toFixed(2)}%`)
      stage.style.setProperty('--light-gain', gain.toFixed(3))
      stage.style.setProperty('--shadow-x', `${sx.toFixed(1)}px`)
      stage.style.setProperty('--shadow-y', `${sy.toFixed(1)}px`)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

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

  return (
    <div ref={stageRef} className="stage relative min-h-dvh overflow-hidden">
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
            opacity: 0.08,
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

      <div className="deck-slot">
        <div className="deck">
          <Turntable
            cover={cover}
            playing={state.playing}
            progress={progress}
            duration={state.duration}
            shuffle={state.shuffle}
            hasTrack={Boolean(current)}
            onToggle={toggle}
            onSeek={seek}
            onPrev={prev}
            onNext={next}
            onShuffle={player.toggleShuffle}
            disabled={!current}
          >
            <div className="console-readout">
              <div>
                <p
                  className="text-[0.58rem] uppercase text-[var(--muted)]"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.32em' }}
                >
                  {state.playing ? 'On the platter' : 'Standby'}
                </p>
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={current?.videoId ?? 'empty'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-2 line-clamp-3 text-[clamp(1.2rem,2.05vw,2.15rem)] font-medium leading-[1.08] tracking-[-0.03em]"
                  >
                    {current?.title ?? 'Nothing on the platter'}
                  </motion.h1>
                </AnimatePresence>
                <p
                  className="mt-3 text-[0.72rem] text-[var(--muted)]"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                >
                  {playlistTitle}
                  {current
                    ? `  ·  ${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
                    : '  ·  drag the grooves to cue'}
                </p>
              </div>
              <VuMeters audioRef={player.audioRef} playing={state.playing} />
            </div>
          </Turntable>
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
