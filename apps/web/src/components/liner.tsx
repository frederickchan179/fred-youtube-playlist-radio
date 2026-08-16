import { AnimatePresence, motion } from 'motion/react'
import { fade } from '../lib/motion'
import { formatTime, type QueuedTrack } from '../lib/api'
import { ImportForm } from './import-form'
import { TrackList } from './ui'

type Props = {
  open: boolean
  mode: 'album' | 'acquire'
  onClose: () => void
  tracks: QueuedTrack[]
  currentVideoId: string | null
  playlistTitle: string
  cover: string | null
  onPlayTrack: (index: number) => void
  canEditTracks: boolean
  onRemoveVideo: (videoId: string) => Promise<void>
  onImported: (playlistId: string) => void
  loading: boolean
  error: string | null
  acquiredOn?: string | null
  totalSec?: number
  plays?: number
}

export const Liner = ({
  open,
  mode,
  onClose,
  tracks,
  currentVideoId,
  playlistTitle,
  cover,
  onPlayTrack,
  canEditTracks,
  onRemoveVideo,
  onImported,
  loading,
  error,
  acquiredOn = null,
  totalSec = 0,
  plays = 0,
}: Props) => (
  <aside className="liner" data-open={open ? 'true' : 'false'}>
    <div className="liner-inner">
      <div className="liner-head">
        <div className="liner-art-slot">
          <AnimatePresence mode="wait">
            {mode === 'album' && cover ? (
              <motion.img
                key={cover}
                src={cover}
                alt=""
                className="liner-art"
                {...fade}
              />
            ) : (
              <motion.span
                key="blank"
                className="liner-art liner-art-blank"
                {...fade}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={mode === 'acquire' ? 'acquire' : playlistTitle} {...fade}>
              <p
                className="text-[0.58rem] uppercase text-[var(--muted)]"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
              >
                {mode === 'acquire' ? 'Empty sleeve' : 'Inside the sleeve'}
              </p>
              <p className="mt-1 line-clamp-1 text-lg font-medium">
                {mode === 'acquire' ? 'Bring a pressing in' : playlistTitle}
              </p>
              {mode === 'album' ? (
                <p
                  className="mt-1 text-[0.65rem] text-[var(--muted)]"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
                >
                  {[
                    acquiredOn ? `Acquired ${acquiredOn}` : null,
                    formatTime(totalSec),
                    `${plays} ${plays === 1 ? 'play' : 'plays'}`,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" className="hw-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="liner-cuts">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              mode === 'acquire'
                ? 'acquire'
                : loading
                  ? 'loading'
                  : error
                    ? 'error'
                    : playlistTitle
            }
            {...fade}
          >
            {mode === 'acquire' ? (
              <>
                <p className="mb-4 text-sm text-[var(--muted)]">
                  Paste a YouTube playlist or video URL into the local library.
                </p>
                <ImportForm onImported={onImported} />
              </>
            ) : loading ? (
              <p className="px-4 text-sm text-[var(--muted)]">Loading…</p>
            ) : error ? (
              <p className="px-4 text-sm" style={{ color: 'var(--accent)' }}>
                {error}
              </p>
            ) : (
              <TrackList
                tracks={tracks}
                currentVideoId={currentVideoId}
                onPlayTrack={onPlayTrack}
                canEditTracks={canEditTracks}
                onRemoveVideo={onRemoveVideo}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </aside>
)
