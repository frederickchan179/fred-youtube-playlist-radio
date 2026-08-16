import { useState, type FormEvent } from 'react'
import { startImport, type ImportJob } from '../lib/api'
import { useJobPoll } from '../hooks/use-job-poll'

type Props = {
  onImported: (playlistId: string) => void
}

export const ImportForm = ({ onImported }: Props) => {
  const [url, setUrl] = useState('')
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
        onImported(finished.summary.playlistId)
        setUrl('')
        return
      }
      if (finished.status === 'error') {
        setError(finished.error ?? 'Import failed')
      }
    },
    onRequestFailed: (message) => {
      setSubmitting(false)
      setError(message)
    },
  })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    setJob(null)

    try {
      setJob(await startImport(url.trim()))
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : 'Could not start import')
    }
  }

  const progressLabel = (() => {
    if (!job?.progress) return null
    const progress = job.progress
    if (progress.phase === 'download' && progress.current && progress.total) {
      return `${progress.current}/${progress.total} · ${progress.trackTitle ?? 'Downloading…'}`
    }
    return progress.message
  })()

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="sr-only">YouTube URL</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            required
            autoFocus
            value={url}
            disabled={running}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="youtube.com/playlist?list=… or a single video"
            className="field"
          />
          <button
            type="submit"
            disabled={running || !url.trim()}
            className="hw-btn shrink-0"
            data-lit="true"
          >
            {running ? 'Saving…' : 'Acquire'}
          </button>
        </div>
      </label>

      {progressLabel ? (
        <p
          className="text-xs text-[var(--accent)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {progressLabel}
        </p>
      ) : null}

      {job?.status === 'done' && job.summary ? (
        <p className="text-xs text-[var(--muted)]">
          Saved · {job.summary.title} · {job.summary.totalReady} ready
          {job.summary.failed > 0 ? ` · ${job.summary.failed} failed` : ''}
        </p>
      ) : null}

      {error ? (
        <p className="text-xs" style={{ color: 'var(--accent-2)' }}>
          {error}
        </p>
      ) : null}
    </form>
  )
}
