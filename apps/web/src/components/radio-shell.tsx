import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { MANUAL_PLAYLIST_ID, analogueTheme, ON_AIR_PLAYLIST_ID, ON_AIR_PLAYLIST_TITLE } from '@radio/shared'
import { mediaUrl, formatTime, type PlaylistSummary, type QueuedTrack } from '../lib/api'
import { unlockDeckFoley } from '../lib/deck-foley'
import { fade, fadeLift, roomTransition } from '../lib/motion'
import type { PlayerApi } from '../hooks/use-player'
import { usePlaceOnPlatter } from '../hooks/use-place-on-platter'
import { useRoomLight } from '../hooks/use-room-light'
import { ImportFlow } from './import-flow'
import { Liner } from './liner'
import { OnAirJacket } from './on-air-jacket'
import { CueSlider } from './cue-slider'
import { PressingBin } from './pressing-bin'
import { Turntable } from './turntable'
import { VuMeters } from './vu-meter'
import { VinylFlyer } from './vinyl-flyer'

type Sleeve = 'album' | 'acquire' | null

type Props = {
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  tracks: QueuedTrack[]
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
  const { currentTrack, state, playTrackAt, togglePlayPause, next, prev, seek, pause } =
    player
  const [sleeve, setSleeve] = useState<Sleeve>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  useRoomLight(stageRef)

  const closeSleeve = useCallback(() => setSleeve(null), [])
  const openAlbumSleeve = useCallback(() => setSleeve('album'), [])

  const { flyingDisc, isDiscFlying, placeAlbumOnPlatter, noteDiscLanded } =
    usePlaceOnPlatter({
      playlists,
      isPlaying: state.playing,
      pausePlayback: pause,
      selectPlaylist: onSelectPlaylist,
      selectedPlaylistId: activePlaylistId,
      queuedPlaylistId: state.playlistId,
      playlistFailedToLoad: Boolean(error),
      closeSleeve,
      openAlbumSleeve,
    })

  const sleeveOpen = sleeve !== null
  const albumSleeveOpen = sleeve === 'album'
  const isTypingInField = (target: EventTarget | null) =>
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement

  const playingCover = currentTrack
    ? mediaUrl(currentTrack.sourcePlaylistId, currentTrack.videoId, 'thumb')
    : null

  const isOnAir = activePlaylistId === ON_AIR_PLAYLIST_ID
  const playlist = playlists.find((item) => item.playlistId === activePlaylistId)
  const playlistTitle = isOnAir
    ? ON_AIR_PLAYLIST_TITLE
    : (playlist?.title ?? 'Library')
  const linerArt = isOnAir
    ? playingCover
    : activePlaylistId && playlist?.coverVideoId
      ? mediaUrl(activePlaylistId, playlist.coverVideoId, 'thumb')
      : playingCover

  const canEditSavedVideos = activePlaylistId === MANUAL_PLAYLIST_ID
  const playhead =
    state.duration > 0 ? state.currentTime / state.duration : 0

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingInField(event.target)) return
      if (event.code === 'Space') {
        event.preventDefault()
        if (!isDiscFlying) togglePlayPause()
      }
      if (event.code === 'ArrowRight') next()
      if (event.code === 'ArrowLeft') prev()
      if (event.code === 'KeyC' && activePlaylistId && !isDiscFlying) {
        setSleeve((previousSleeve) => (previousSleeve === 'album' ? null : 'album'))
      }
      if (event.code === 'Escape') closeSleeve()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlayPause, next, prev, activePlaylistId, isDiscFlying, closeSleeve])

  const pickJacket = (playlistId: string, jacket: HTMLElement) => {
    if (isDiscFlying) return
    if (playlistId === activePlaylistId) {
      setSleeve((previousSleeve) => (previousSleeve === 'album' ? null : 'album'))
      return
    }
    placeAlbumOnPlatter(playlistId, jacket)
  }

  return (
    <MotionConfig reducedMotion="user" transition={roomTransition}>
      <div
        ref={stageRef}
        className="stage relative min-h-dvh overflow-hidden"
        onPointerDown={unlockDeckFoley}
      >
        <audio ref={player.audioRef} preload="metadata" crossOrigin="anonymous" />

        {playingCover ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${playingCover})`,
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
          <div className="deck">
            <Turntable
              cover={playingCover}
              playing={state.playing}
              progress={playhead}
              duration={state.duration}
              shuffle={state.shuffle}
              hasTrack={Boolean(currentTrack)}
              onPlayPause={togglePlayPause}
              onSeek={seek}
              onPrev={prev}
              onNext={next}
              onShuffle={player.toggleShuffle}
              disabled={!currentTrack}
              isPlacingDisc={isDiscFlying}
              discId={activePlaylistId}
            >
              <div className="console-readout">
                <div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={state.playing ? 'playing' : 'standby'}
                      {...fade}
                      className="text-[0.58rem] uppercase text-[var(--muted)]"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.32em' }}
                    >
                      {state.playing ? 'On the platter' : 'Standby'}
                    </motion.p>
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.h1
                      key={currentTrack?.videoId ?? 'empty'}
                      {...fadeLift}
                      className="mt-2 line-clamp-3 text-[clamp(1.2rem,2.05vw,2.15rem)] font-medium leading-[1.08] tracking-[-0.03em]"
                    >
                      {currentTrack?.title ?? 'Nothing on the platter'}
                    </motion.h1>
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${playlistTitle}-${currentTrack ? 'on' : 'off'}`}
                      {...fade}
                      className="mt-3 text-[0.72rem] text-[var(--muted)]"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                    >
                      {playlistTitle}
                      {currentTrack
                        ? `  ·  ${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
                        : '  ·  drag the grooves to cue'}
                    </motion.p>
                  </AnimatePresence>
                  <CueSlider
                    currentTime={state.currentTime}
                    duration={state.duration}
                    onSeek={seek}
                    disabled={!currentTrack}
                  />
                </div>
                <VuMeters audioRef={player.audioRef} playing={state.playing} />
              </div>
            </Turntable>
          </div>
        </div>

        {flyingDisc ? (
          <VinylFlyer
            key={flyingDisc.key}
            flight={flyingDisc}
            onLanded={noteDiscLanded}
          />
        ) : null}

        <button
          type="button"
          aria-label="Close sleeve"
          aria-hidden={!sleeveOpen}
          tabIndex={sleeveOpen ? 0 : -1}
          className="sleeve-dismiss"
          data-open={sleeveOpen ? 'true' : 'false'}
          onClick={closeSleeve}
        />

        <PressingBin
          playlists={playlists}
          activePlaylistId={activePlaylistId}
          sleeveOpen={albumSleeveOpen}
          pauseAutoScroll={isDiscFlying}
          onSelect={pickJacket}
          onSynced={onSynced}
          error={error}
          station={
            <OnAirJacket
              active={isOnAir}
              sleeveOpen={albumSleeveOpen && isOnAir}
              cutCount={isOnAir ? tracks.length : playlists.reduce((sum, album) => sum + album.trackCount, 0)}
              onSelect={pickJacket}
            />
          }
          acquire={
            <ImportFlow
              open={sleeve === 'acquire'}
              onOpen={() => {
                if (isDiscFlying) return
                setSleeve((previousSleeve) =>
                  previousSleeve === 'acquire' ? null : 'acquire',
                )
              }}
            />
          }
        >
          <Liner
            open={sleeveOpen}
            mode={sleeve === 'acquire' ? 'acquire' : 'album'}
            onClose={closeSleeve}
            tracks={tracks}
            currentVideoId={currentTrack?.videoId ?? null}
            playlistTitle={playlistTitle}
            cover={linerArt}
            onPlayTrack={(index) => {
              if (isDiscFlying) return
              playTrackAt(index)
            }}
            canEditTracks={canEditSavedVideos}
            onRemoveVideo={onRemoveVideo}
            onImported={(playlistId) => {
              onImported(playlistId)
              openAlbumSleeve()
            }}
            loading={loading}
            error={error}
          />
        </PressingBin>
      </div>
    </MotionConfig>
  )
}
