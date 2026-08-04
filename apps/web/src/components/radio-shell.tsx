import { AnimatePresence, motion } from 'motion/react'
import { MANUAL_PLAYLIST_ID, type Track } from '@radio/shared'
import { mediaUrl, formatTime, type PlaylistSummary } from '../lib/api'
import type { PlayerApi } from '../hooks/use-player'
import { useTheme } from '../hooks/use-theme'
import { Visualizer } from './visualizer'
import { Transport } from './transport'
import { ThemeSwitcher } from './theme-switcher'
import { ImportFlow } from './import-flow'
import { PlaylistPicker } from './playlist-picker'
import { CoverArt, Panel, SectionLabel, TrackList } from './ui'


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
  const { theme } = useTheme()
  const { current, state, playAt } = player

  const cover =
    current && activePlaylistId
      ? mediaUrl(activePlaylistId, current.videoId, 'thumb')
      : null

  const playlistTitle =
    playlists.find((p) => p.playlistId === activePlaylistId)?.title ?? 'Library'

  const emptyLibrary = playlists.length === 0
  const canEditTracks = activePlaylistId === MANUAL_PLAYLIST_ID

  return (
    <div className="relative min-h-screen overflow-hidden">
      <audio ref={player.audioRef} preload="metadata" crossOrigin="anonymous" />

      {/* Living backdrop from cover */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cover ?? `${theme.id}-empty`}
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: cover
              ? `
                linear-gradient(180deg, rgba(0,0,0,0.2), var(--bg-0) 78%),
                radial-gradient(900px 500px at 70% 20%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%),
                url(${cover}) center / cover no-repeat
              `
              : `
                radial-gradient(1100px 640px at 18% -10%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 58%),
                radial-gradient(900px 520px at 92% 12%, color-mix(in oklab, var(--accent-2) 20%, transparent), transparent 52%),
                radial-gradient(700px 420px at 50% 80%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 60%),
                linear-gradient(165deg, var(--bg-0), var(--bg-1) 48%, var(--bg-2))
              `,
          }}
        />
      </AnimatePresence>

      {cover ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(48px) saturate(1.35) brightness(0.55)',
            transform: 'scale(1.15)',
            opacity: 0.85,
          }}
        />
      ) : null}

      <div className="vignette" style={{ opacity: emptyLibrary ? 0.55 : 1 }} />
      <div className="grain" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-5 pb-8 pt-5 md:px-8 md:pt-6">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className="text-[0.65rem] uppercase text-[var(--muted)]"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: 'var(--letter-brand)',
              }}
            >
              Fred Radio
            </p>
            <AnimatePresence mode="wait">
              <motion.h1
                key={theme.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mt-1.5 truncate text-[clamp(1.65rem,3.2vw,2.4rem)] leading-none tracking-[-0.03em]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'var(--track-weight)' as never,
                }}
              >
                {theme.headline}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeSwitcher />
            <ImportFlow onImported={onImported} />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={theme.layout}
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-1 flex-col"
          >
            {theme.layout === 'orbit' && (
              <OrbitLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'stack' && (
              <StackLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'grid' && (
              <GridLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'lounge' && (
              <LoungeLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'folio' && (
              <FolioLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'slab' && (
              <SlabLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'reader' && (
              <ReaderLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
            {theme.layout === 'seminar' && (
              <SeminarLayout
                cover={cover}
                player={player}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                tracks={tracks}
                playlistTitle={playlistTitle}
                onSelectPlaylist={onSelectPlaylist}
                onSynced={onSynced}
                onPlayTrack={playAt}
                onRemoveVideo={onRemoveVideo}
                canEditTracks={canEditTracks}
                loading={loading}
                error={error}
              />
            )}
          </motion.main>
        </AnimatePresence>

        <footer
          className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-[var(--muted)]"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}
        >
          <span className="uppercase">Fred Radio</span>
          <span className="uppercase">
            {state.playing ? '● live' : '○ standby'} · {theme.genre} · {theme.label}
          </span>
        </footer>
      </div>
    </div>
  )
}

type LayoutProps = {
  cover: string | null
  player: PlayerApi
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  tracks: Track[]
  playlistTitle: string
  onSelectPlaylist: (id: string) => void
  onSynced: (playlistId: string) => void
  onPlayTrack: (index: number) => void
  onRemoveVideo: (videoId: string) => Promise<void>
  canEditTracks: boolean
  loading: boolean
  error: string | null
}

const LibraryRail = ({
  playlists,
  activePlaylistId,
  tracks,
  currentId,
  playlistTitle,
  onSelectPlaylist,
  onSynced,
  onPlayTrack,
  onRemoveVideo,
  canEditTracks,
  loading,
  error,
}: {
  playlists: PlaylistSummary[]
  activePlaylistId: string | null
  tracks: Track[]
  currentId: string | null
  playlistTitle: string
  onSelectPlaylist: (id: string) => void
  onSynced: (playlistId: string) => void
  onPlayTrack: (index: number) => void
  onRemoveVideo: (videoId: string) => Promise<void>
  canEditTracks: boolean
  loading: boolean
  error: string | null
}) => (
  <div className="flex h-full min-h-0 flex-col gap-6 p-5 md:p-6">
    <div>
      <SectionLabel>Playlists</SectionLabel>
      {playlists.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">Nothing here yet.</p>
      ) : (
        <div className="mt-3">
          <p
            className="mb-1 text-[0.65rem] text-[var(--muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {playlists.length} playlist{playlists.length === 1 ? '' : 's'}
          </p>
          <PlaylistPicker
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelect={onSelectPlaylist}
            onSynced={onSynced}
            showCount
            empty={null}
            titleClassName="group flex min-w-0 flex-1 items-baseline gap-3 py-2 text-left transition-colors"
            titleStyle={(active) => ({
              color: active ? 'var(--ink)' : 'var(--muted)',
              fontFamily: active ? 'var(--font-display)' : 'var(--font-body)',
              fontStyle: active ? 'italic' : 'normal',
            })}
          />
        </div>
      )}
    </div>

    <div className="min-h-0 flex-1 border-t border-[var(--line)] pt-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <SectionLabel>Queue</SectionLabel>
        <p
          className="line-clamp-1 text-right text-xs text-[var(--muted)]"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          {playlistTitle}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : error ? (
        <p className="text-sm" style={{ color: 'var(--accent-2)' }}>
          {error}
        </p>
      ) : (
        <TrackList
          tracks={tracks}
          currentId={currentId}
          onPlayTrack={onPlayTrack}
          canEditTracks={canEditTracks}
          onRemoveVideo={onRemoveVideo}
          className="max-h-[min(52vh,28rem)] overflow-y-auto pr-1"
        />
      )}
    </div>
  </div>
)

/** Nocturne — vinyl orbit, editorial calm */
const OrbitLayout = (props: LayoutProps) => {
  const currentId = props.player.current?.videoId ?? null
  const { theme } = useTheme()

  return (
    <div className="grid flex-1 gap-6 lg:grid-cols-[1.25fr_0.85fr] lg:gap-8">
      <div className="relative flex min-h-[32rem] flex-col justify-end">
        <Visualizer
          audioRef={props.player.audioRef}
          mode={theme.visualizer}
          playing={props.player.state.playing}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <CoverArt
            cover={props.cover}
            spinning
            playing={props.player.state.playing}
            sizeClass="aspect-square w-[min(72%,26rem)]"
          />
        </div>
        <Panel className="relative z-10 mt-auto p-5 md:p-7">
          <Transport player={props.player} />
        </Panel>
      </div>

      <Panel className="min-h-[28rem]">
        <LibraryRail
          {...props}
          currentId={currentId}
        />
      </Panel>
    </div>
  )
}

/** Cassette — stacked editorial, warm tape deck */
const StackLayout = (props: LayoutProps) => {
  const currentId = props.player.current?.videoId ?? null
  const { theme } = useTheme()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Panel className="relative overflow-hidden p-5 md:p-8">
        <div className="grid items-end gap-8 md:grid-cols-[18rem_1fr]">
          <CoverArt
            cover={props.cover}
            playing={props.player.state.playing}
            sizeClass="aspect-square w-full"
          />
          <div className="flex min-w-0 flex-col gap-6">
            <Transport player={props.player} />
            <Visualizer
              audioRef={props.player.audioRef}
              mode={theme.visualizer}
              playing={props.player.state.playing}
              className="h-24 w-full opacity-80"
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <LibraryRail {...props} currentId={currentId} />
      </Panel>
    </div>
  )
}

/** Voltage — brutal signal board */
const GridLayout = (props: LayoutProps) => {
  const currentId = props.player.current?.videoId ?? null
  const { theme } = useTheme()

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-12">
      <Panel className="relative min-h-[22rem] overflow-hidden p-5 md:p-6 lg:col-span-8">
        <Visualizer
          audioRef={props.player.audioRef}
          mode={theme.visualizer}
          playing={props.player.state.playing}
          className="absolute inset-0 h-full w-full opacity-70"
        />
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div className="flex items-start justify-between gap-4">
            <p
              className="text-[0.7rem] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.28em',
                color: 'var(--accent)',
              }}
            >
              Feed // 01
            </p>
            <CoverArt
              cover={props.cover}
              playing={props.player.state.playing}
              sizeClass="aspect-square w-24 md:w-28"
            />
          </div>
          <Transport player={props.player} showTitle compact />
        </div>
      </Panel>

      <Panel className="lg:col-span-4">
        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <SectionLabel>Sources</SectionLabel>
            <div className="mt-4">
              <PlaylistPicker
                playlists={props.playlists}
                activePlaylistId={props.activePlaylistId}
                onSelect={props.onSelectPlaylist}
                onSynced={props.onSynced}
                itemClassName="flex items-center gap-1 border-b border-[var(--line)]"
                titleClassName="min-w-0 flex-1 py-3 text-left uppercase"
                titleStyle={(active) => ({
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                })}
              />
            </div>
          </div>
        </div>
      </Panel>

      <div className="lg:col-span-12">
        <SectionLabel className="mb-3">Track matrix</SectionLabel>
        {props.loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : props.error ? (
          <p className="text-sm" style={{ color: 'var(--accent-2)' }}>
            {props.error}
          </p>
        ) : (
          <TrackList
            tracks={props.tracks}
            currentId={currentId}
            onPlayTrack={props.onPlayTrack}
            canEditTracks={props.canEditTracks}
            onRemoveVideo={props.onRemoveVideo}
            variant="matrix"
          />
        )}
      </div>
    </div>
  )
}

/** Jazz — cinematic lounge banner + ribbon viz + elegant setlist */
const LoungeLayout = (props: LayoutProps) => {
  const { theme } = useTheme()
  const currentId = props.player.current?.videoId ?? null
  const title = props.player.current?.title ?? 'Nothing on the bandstand'

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Panel className="relative min-h-[22rem] overflow-hidden">
        {props.cover ? (
          <img
            src={props.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.72) 10%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <Visualizer
          audioRef={props.player.audioRef}
          mode={theme.visualizer}
          playing={props.player.state.playing}
          className="absolute inset-x-0 bottom-0 h-36 w-full opacity-70"
        />
        <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-between p-6 md:p-8">
          <p
            className="text-[0.65rem] uppercase text-[var(--accent)]"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.28em' }}
          >
            Jazz · After hours
          </p>
          <div className="max-w-3xl">
            <motion.h2
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[clamp(2.4rem,6vw,4.5rem)] italic leading-[0.95] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </motion.h2>
          </div>
          <Transport player={props.player} showTitle={false} compact />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-5 md:p-6">
          <SectionLabel>Residencies</SectionLabel>
          <div className="mt-3">
            <PlaylistPicker
              playlists={props.playlists}
              activePlaylistId={props.activePlaylistId}
              onSelect={props.onSelectPlaylist}
              onSynced={props.onSynced}
              empty={null}
              titleClassName="min-w-0 flex-1 py-2 text-left italic"
              titleStyle={(active) => ({
                fontFamily: 'var(--font-display)',
                color: active ? 'var(--accent)' : 'var(--muted)',
              })}
            />
          </div>
        </Panel>
        <Panel className="p-5 md:p-6">
          <SectionLabel className="mb-3">
            Setlist · {props.playlistTitle}
          </SectionLabel>
          <TrackList
            tracks={props.tracks}
            currentId={currentId}
            onPlayTrack={props.onPlayTrack}
            canEditTracks={props.canEditTracks}
            onRemoveVideo={props.onRemoveVideo}
            variant="setlist"
            className="max-h-[20rem] overflow-y-auto"
          />
        </Panel>
      </div>
    </div>
  )
}

/** Indie — magazine folio, typography-first + tilted cover + pulse orbs */
const FolioLayout = (props: LayoutProps) => {
  const { theme } = useTheme()
  const currentId = props.player.current?.videoId ?? null
  const title = props.player.current?.title ?? 'Untitled note'

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[18rem]">
          <Visualizer
            audioRef={props.player.audioRef}
            mode={theme.visualizer}
            playing={props.player.state.playing}
            className="absolute inset-0 h-full w-full opacity-60"
          />
          <div className="relative z-10 py-4">
            <SectionLabel>Indie diary</SectionLabel>
            <motion.h2
              key={title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 max-w-xl text-[clamp(2.6rem,7vw,5rem)] leading-[0.92] tracking-[-0.04em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </motion.h2>
            <p
              className="mt-4 text-sm italic text-[var(--muted)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {props.playlistTitle}
            </p>
            <div className="mt-8 max-w-md">
              <Transport player={props.player} showTitle={false} compact />
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <motion.div
            key={props.cover ?? 'empty'}
            initial={{ rotate: -4, opacity: 0 }}
            animate={{ rotate: 3, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(100%,20rem)]"
            style={{
              borderRadius: 'var(--cover-radius)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
              border: '1px solid var(--line)',
              overflow: 'hidden',
              background: 'var(--panel)',
            }}
          >
            {props.cover ? (
              <img src={props.cover} alt="" className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/5] place-items-center text-[var(--muted)]">
                No polaroid
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Panel className="p-5 md:p-6">
        <SectionLabel className="mb-3">Side A</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {props.tracks.map((track, index) => {
            const active = track.videoId === currentId
            return (
              <button
                key={track.videoId}
                type="button"
                onClick={() => props.onPlayTrack(index)}
                className="max-w-full px-3 py-2 text-left text-sm"
                style={{
                  borderRadius: '999px',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                  background: active
                    ? 'color-mix(in oklab, var(--accent) 14%, transparent)'
                    : 'transparent',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                }}
              >
                <span className="text-[var(--muted)]">
                  {String(index + 1).padStart(2, '0')} ·{' '}
                </span>
                <span className="line-clamp-1">{track.title}</span>
              </button>
            )
          })}
        </div>
        {props.playlists.length > 0 ? (
          <div className="mt-5">
            <PlaylistPicker
              playlists={props.playlists}
              activePlaylistId={props.activePlaylistId}
              onSelect={props.onSelectPlaylist}
              onSynced={props.onSynced}
              empty={null}
              className="flex flex-wrap gap-2"
              itemClassName="flex items-center gap-1"
              titleClassName="px-1 py-1 text-left text-xs uppercase"
              titleStyle={(active) => ({
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.14em',
                color: active ? 'var(--accent)' : 'var(--muted)',
              })}
            />
          </div>
        ) : null}
      </Panel>
    </div>
  )
}

/** Industrial — slab table, stamp cover, spike visualizer strip */
const SlabLayout = (props: LayoutProps) => {
  const { theme } = useTheme()
  const currentId = props.player.current?.videoId ?? null

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div
        className="relative h-28 overflow-hidden border border-[var(--line)]"
        style={{ background: 'var(--bg-1)' }}
      >
        <Visualizer
          audioRef={props.player.audioRef}
          mode={theme.visualizer}
          playing={props.player.state.playing}
          className="absolute inset-0 h-full w-full"
        />
        <div className="relative z-10 flex h-full items-center justify-between px-4">
          <p
            className="text-[0.7rem] uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.24em',
              color: 'var(--accent)',
            }}
          >
            INDUSTRIAL FEED // SPIKE
          </p>
          <CoverArt
            cover={props.cover}
            playing={props.player.state.playing}
            sizeClass="aspect-square w-16"
          />
        </div>
      </div>

      <div
        className="border border-[var(--line)] p-4 md:p-5"
        style={{ background: 'var(--panel)' }}
      >
        <Transport player={props.player} />
      </div>

      <div
        className="border border-[var(--line)]"
        style={{ background: 'var(--bg-0)' }}
      >
        <div
          className="grid grid-cols-[3rem_1fr_5rem] border-b border-[var(--line)] px-3 py-2 text-[0.65rem] uppercase text-[var(--muted)]"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}
        >
          <span>#</span>
          <span>Title</span>
          <span className="text-right">Len</span>
        </div>
        <div className="rail-scroll max-h-[min(48vh,26rem)] overflow-y-auto">
          {props.loading ? (
            <p className="p-4 text-sm text-[var(--muted)]">Loading…</p>
          ) : props.error ? (
            <p className="p-4 text-sm" style={{ color: 'var(--accent-2)' }}>
              {props.error}
            </p>
          ) : (
            props.tracks.map((track, index) => {
              const active = track.videoId === currentId
              return (
                <button
                  key={track.videoId}
                  type="button"
                  onClick={() => props.onPlayTrack(index)}
                  className="grid w-full grid-cols-[3rem_1fr_5rem] items-center border-b border-[var(--line)] px-3 py-3 text-left text-sm"
                  style={{
                    background: active
                      ? 'color-mix(in oklab, var(--accent) 12%, transparent)'
                      : 'transparent',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="line-clamp-1 uppercase tracking-wide"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: active ? 'var(--ink)' : 'var(--muted)',
                    }}
                  >
                    {track.title}
                  </span>
                  <span className="text-right text-[var(--muted)]">
                    {formatTime(track.durationSec ?? 0)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {props.playlists.length > 0 ? (
        <PlaylistPicker
          playlists={props.playlists}
          activePlaylistId={props.activePlaylistId}
          onSelect={props.onSelectPlaylist}
          onSynced={props.onSynced}
          empty={null}
          className="flex flex-wrap gap-2"
          itemClassName="flex items-center gap-1 border border-[var(--line)] pr-1"
          titleClassName="px-3 py-2 text-left text-[0.65rem] uppercase"
          titleStyle={(active) => ({
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.14em',
            color: active ? 'var(--accent)' : 'var(--muted)',
          })}
        />
      ) : null}
    </div>
  )
}

/** Audiobook — open book: chapters rail + page of text + calm softline */
const ReaderLayout = (props: LayoutProps) => {
  const { theme } = useTheme()
  const currentId = props.player.current?.videoId ?? null
  const title = props.player.current?.title ?? 'Untitled chapter'
  const chapterIndex = Math.max(
    0,
    props.tracks.findIndex((t) => t.videoId === currentId),
  )

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="grid flex-1 gap-4 lg:grid-cols-[15rem_1fr_14rem]">
        {/* Spine / chapters */}
        <Panel className="flex min-h-[28rem] flex-col p-4 md:p-5">
          <SectionLabel>Table of contents</SectionLabel>
          <p
            className="mt-2 line-clamp-2 text-sm italic text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {props.playlistTitle}
          </p>
          <TrackList
            tracks={props.tracks}
            currentId={currentId}
            onPlayTrack={props.onPlayTrack}
            canEditTracks={props.canEditTracks}
            onRemoveVideo={props.onRemoveVideo}
            className="mt-4 min-h-0 flex-1 overflow-y-auto"
          />
        </Panel>

        {/* Open page */}
        <Panel className="relative flex min-h-[28rem] flex-col overflow-hidden p-6 md:p-8">
          <Visualizer
            audioRef={props.player.audioRef}
            mode={theme.visualizer}
            playing={props.player.state.playing}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-50"
          />
          <p
            className="text-[0.65rem] uppercase text-[var(--accent)]"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.28em' }}
          >
            Audiobook · Ch. {String(chapterIndex + 1).padStart(2, '0')}
          </p>
          <motion.h2
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-2xl text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {title}
          </motion.h2>
          <div className="relative z-10 mt-auto pt-8">
            <Transport player={props.player} showTitle={false} compact />
          </div>
        </Panel>

        {/* Cover + shelves */}
        <div className="flex flex-col gap-4">
          <CoverArt
            cover={props.cover}
            playing={props.player.state.playing}
            sizeClass="aspect-[3/4] w-full"
          />
          <Panel className="p-4">
            <SectionLabel>Shelf</SectionLabel>
            <div className="mt-3">
              <PlaylistPicker
                playlists={props.playlists}
                activePlaylistId={props.activePlaylistId}
                onSelect={props.onSelectPlaylist}
                onSynced={props.onSynced}
                titleClassName="min-w-0 flex-1 py-1.5 text-left text-sm"
                titleStyle={(active) => ({
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                })}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/** Knowledge — seminar focus: agenda + lecture stage + quiet meters */
const SeminarLayout = (props: LayoutProps) => {
  const { theme } = useTheme()
  const currentId = props.player.current?.videoId ?? null
  const title = props.player.current?.title ?? 'Untitled session'
  const sessionIndex = Math.max(
    0,
    props.tracks.findIndex((t) => t.videoId === currentId),
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Panel className="relative overflow-hidden p-5 md:p-7">
        <Visualizer
          audioRef={props.player.audioRef}
          mode={theme.visualizer}
          playing={props.player.state.playing}
          className="pointer-events-none absolute right-0 top-0 h-full w-40 opacity-40"
        />
        <div className="relative z-10 grid gap-6 md:grid-cols-[7rem_1fr]">
          <CoverArt
            cover={props.cover}
            playing={props.player.state.playing}
            sizeClass="aspect-square w-full"
          />
          <div className="min-w-0">
            <p
              className="text-[0.65rem] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.22em',
                color: 'var(--accent-2)',
              }}
            >
              Knowledge · Session {String(sessionIndex + 1).padStart(2, '0')}
            </p>
            <motion.h2
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-[clamp(1.6rem,3.5vw,2.6rem)] leading-tight tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              {title}
            </motion.h2>
            <p
              className="mt-2 text-sm text-[var(--muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {props.playlistTitle}
            </p>
            <div className="mt-6">
              <Transport player={props.player} showTitle={false} compact />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Panel className="p-4 md:p-5">
          <SectionLabel>Series</SectionLabel>
          <div className="mt-3">
            <PlaylistPicker
              playlists={props.playlists}
              activePlaylistId={props.activePlaylistId}
              onSelect={props.onSelectPlaylist}
              onSynced={props.onSynced}
              itemClassName="flex items-center gap-1 border-b border-[var(--line)]"
              titleClassName="min-w-0 flex-1 py-2.5 text-left text-sm"
              titleStyle={(active) => ({
                color: active ? 'var(--accent)' : 'var(--muted)',
              })}
              meta={(p) => (
                <span
                  className="mt-1 block text-[0.65rem] text-[var(--muted)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {p.trackCount} sessions
                </span>
              )}
            />
          </div>
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionLabel className="mb-3">Agenda</SectionLabel>
          {props.loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : props.error ? (
            <p className="text-sm" style={{ color: 'var(--accent-2)' }}>
              {props.error}
            </p>
          ) : (
            <TrackList
              tracks={props.tracks}
              currentId={currentId}
              onPlayTrack={props.onPlayTrack}
              canEditTracks={props.canEditTracks}
              onRemoveVideo={props.onRemoveVideo}
              className="max-h-[min(46vh,24rem)] overflow-y-auto"
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
