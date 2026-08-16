import { useState } from 'react'
import { startSync, type ImportJob } from '../lib/api'
import { useJobPoll } from '../hooks/use-job-poll'

type Props = {
  playlistId: string | null
  playlistTitle?: string
  canSync?: boolean
  onSynced: (playlistId: string) => void
}

export const SyncPlaylistButton = ({
  playlistId,
  playlistTitle,
  canSync = true,
  onSynced,
}: Props) => {
  const [job, setJob] = useState<ImportJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const running =
    submitting || job?.status === 'queued' || job?.status === 'running'

  useJobPoll({
    job,
    onProgress: setJob,
    onFinished: (finished) => {
      setSubmitting(false)
      if (finished.status === 'done' && finished.summary) {
        onSynced(finished.summary.playlistId)
        return
      }
      if (finished.status === 'error') {
        setError(finished.error ?? 'Sync failed')
      }
    },
    onRequestFailed: (message) => {
      setSubmitting(false)
      setError(message)
    },
  })

  const onClick = async () => {
    if (!playlistId || running || !canSync) return
    setError(null)
    setSubmitting(true)
    setJob(null)

    try {
      setJob(await startSync(playlistId))
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : 'Could not start sync')
    }
  }

  const progressLabel = (() => {
    if (!job?.progress) return null
    const progress = job.progress
    if (progress.phase === 'download' && progress.current && progress.total) {
      return `${progress.current}/${progress.total}`
    }
    return progress.message
  })()

  const label = (() => {
    if (error) return error
    if (running && progressLabel) return `Syncing · ${progressLabel}`
    if (running) return 'Syncing…'
    if (!canSync) return 'Only YouTube playlists can sync'
    if (job?.status === 'done' && job.summary) {
      return `Matched YouTube · +${job.summary.added} · −${job.summary.removedRemote}`
    }
    return playlistTitle ? `Sync “${playlistTitle}”` : 'Sync'
  })()

  if (!canSync) return null

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        void onClick()
      }}
      disabled={!playlistId || running}
      title={label}
      aria-label={label}
      className="pressing-sync grid h-6 w-6 shrink-0 place-items-center disabled:opacity-40"
    >
      <SyncIcon spinning={running} />
    </button>
  )
}

const SyncIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    width={11}
    height={11}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={spinning ? 'animate-spin' : undefined}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
)
