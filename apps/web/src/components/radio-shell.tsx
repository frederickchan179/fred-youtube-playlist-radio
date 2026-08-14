import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MANUAL_PLAYLIST_ID, analogueTheme, type Track } from '@radio/shared'
import { mediaUrl, formatTime, type PlaylistSummary } from '../lib/api'
import type { PlayerApi } from '../hooks/use-player'
import { ImportFlow } from './import-flow'
import { ImportForm } from './import-form'
import { TrackList } from './ui'
import { CueSlider } from './cue-slider'
import { PressingBin } from './pressing-bin'
import { SevenStack } from './seven-stack'
import { VuMeters } from './vu-meter'

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
  const [sleeve, setSleeve] = useState<'album' | 'acquire' | null>(null)
  const sleeveOpen = sleeve !== null
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

  const playlist = playlists.find((p) => p.playlistId === activePlaylistId)
  const playlistTitle = playlist?.title ?? 'Library'
  const linerArt =
    activePlaylistId && playlist?.coverVideoId
      ? mediaUrl(activePlaylistId, playlist.coverVideoId, 'thumb')
      : cover

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
      if (event.code === 'KeyC' && activePlaylistId) {
        setSleeve((current) => (current === 'album' ? null : 'album'))
      }
      if (event.code === 'Escape') setSleeve(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, next, prev, activePlaylistId])

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
      </header>

      <div className="deck-slot">
        {playlist ? (
          <button
            type="button"
            className="desk-pressing"
            onClick={() => setSleeve((current) => (current === 'album' ? null : 'album'))}
            aria-expanded={sleeve === 'album'}
            aria-label={`${playlistTitle}, ${sleeve === 'album' ? 'close sleeve' : 'open sleeve'}`}
          >
            <span className="pressing-vinyl" aria-hidden />
            <span className="pressing-jacket">
              {linerArt ? (
                <img src={linerArt} alt="" className="pressing-art" />
              ) : (
                <span className="pressing-blank">{playlistTitle}</span>
              )}
              <span className="pressing-board" aria-hidden />
              <span className="pressing-sticker">
                <span className="pressing-title">{playlistTitle}</span>
                <span className="pressing-meta">
                  {sleeve === 'album' ? 'Inside the sleeve' : 'On the desk'}
                </span>
              </span>
            </span>
          </button>
        ) : null}
        {activePlaylistId ? (
          <SevenStack
            playlistId={activePlaylistId}
            tracks={tracks}
            currentIndex={state.index}
            onPlay={playAt}
          />
        ) : null}
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
                <CueSlider
                  currentTime={state.currentTime}
                  duration={state.duration}
                  onSeek={seek}
                  disabled={!current}
                />
              </div>
              <VuMeters audioRef={player.audioRef} playing={state.playing} />
            </div>
          </Turntable>
        </div>
      </div>

      <AnimatePresence>
        {sleeveOpen ? (
          <motion.button
            type="button"
            aria-label="Close sleeve"
            className="fixed inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSleeve(null)}
          />
        ) : null}
      </AnimatePresence>

      <PressingBin
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        sleeveOpen={sleeveOpen}
        onSelect={(id) => {
          onSelectPlaylist(id)
          setSleeve('album')
        }}
        onSynced={onSynced}
        error={error}
        acquire={
          <ImportFlow
            open={sleeve === 'acquire'}
            onOpen={() =>
              setSleeve((current) => (current === 'acquire' ? null : 'acquire'))
            }
          />
        }
      >
        <Liner
          open={sleeveOpen}
          mode={sleeve === 'acquire' ? 'acquire' : 'album'}
          onClose={() => setSleeve(null)}
          tracks={tracks}
          currentId={current?.videoId ?? null}
          playlistTitle={playlistTitle}
          cover={linerArt}
          onPlayTrack={playAt}
          canEditTracks={canEditTracks}
          onRemoveVideo={onRemoveVideo}
          onImported={(id) => {
            onImported(id)
            setSleeve('album')
          }}
          loading={loading}
          error={error}
        />
      </PressingBin>
    </div>
  )
}

const Liner = ({
  open,
  mode,
  onClose,
  tracks,
  currentId,
  playlistTitle,
  cover,
  onPlayTrack,
  canEditTracks,
  onRemoveVideo,
  onImported,
  loading,
  error,
}: {
  open: boolean
  mode: 'album' | 'acquire'
  onClose: () => void
  tracks: Track[]
  currentId: string | null
  playlistTitle: string
  cover: string | null
  onPlayTrack: (index: number) => void
  canEditTracks: boolean
  onRemoveVideo: (videoId: string) => Promise<void>
  onImported: (playlistId: string) => void
  loading: boolean
  error: string | null
}) => (
    <aside className="liner" data-open={open ? 'true' : 'false'}>
      <div className="liner-inner">
        <div className="liner-head">
          {mode === 'album' && cover ? (
            <img src={cover} alt="" className="liner-art" />
          ) : (
            <span className="liner-art liner-art-blank" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.58rem] uppercase text-[var(--muted)]"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              {mode === 'acquire' ? 'Empty sleeve' : 'Inside the sleeve'}
            </p>
            <p className="mt-1 line-clamp-1 text-lg font-medium">
              {mode === 'acquire' ? 'Bring a pressing in' : playlistTitle}
            </p>
          </div>
          <button type="button" className="hw-btn" onClick={onClose}>
            Close
          </button>
        </div>
        {mode === 'acquire' ? (
          <div className="liner-cuts">
            <p className="mb-4 text-sm text-[var(--muted)]">
              Paste a YouTube playlist or video URL into the local library.
            </p>
            <ImportForm onImported={onImported} />
          </div>
        ) : loading ? (
          <p className="px-4 text-sm text-[var(--muted)]">Loading…</p>
        ) : error ? (
          <p className="px-4 text-sm" style={{ color: 'var(--accent)' }}>
            {error}
          </p>
        ) : (
          <TrackList
            tracks={tracks}
            currentId={currentId}
            onPlayTrack={onPlayTrack}
            canEditTracks={canEditTracks}
            onRemoveVideo={onRemoveVideo}
            className="liner-cuts"
          />
        )}
      </div>
    </aside>
  )
