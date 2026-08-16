import { AnimatePresence, motion } from 'motion/react'
import type { Track } from '@radio/shared'
import { fade } from '../lib/motion'
import { ImportForm } from './import-form'
import { TrackList } from './ui'

type Props = {
  open: boolean
  mode: 'album' | 'acquire'
  onClose: () => void
  tracks: Track[]
  currentVideoId: string | null
  playlistTitle: string
  cover: string | null
  onPlayTrack: (index: number) => void
  canEditTracks: boolean
  onRemoveVideo: (videoId: string) => Promise<void>
  onImported: (playlistId: string) => void
  loading: boolean
  error: string | null
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
