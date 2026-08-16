import { useState, type FormEvent } from 'react'
import { startImport, type ImportJob } from '../lib/api'
import { useJobPoll } from '../hooks/use-job-poll'

type Props = {
  onImported: (playlistId: string) => void
}

type PressingCut = {
  title: string
  state: 'ready' | 'saving'
}

export const ImportForm = ({ onImported }: Props) => {
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<ImportJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pressedCuts, setPressedCuts] = useState<PressingCut[]>([])

  const running =
    submitting || job?.status === 'queued' || job?.status === 'running'

  const noteJob = (nextJob: ImportJob) => {
    setJob(nextJob)
    const progress = nextJob.progress
    if (progress?.phase !== 'download' || !progress.trackTitle) return
    const title = progress.trackTitle
    setPressedCuts((cuts) => {
      const ready = cuts
        .filter((cut) => cut.title !== title)
        .map((cut) => ({ title: cut.title, state: 'ready' as const }))
      return [...ready, { title, state: 'saving' }]
    })
  }

  useJobPoll({
    job,
    onProgress: noteJob,
    onFinished: (finished) => {
      setSubmitting(false)
      setPressedCuts((cuts) =>
        cuts.map((cut) => ({ ...cut, state: 'ready' as const })),
      )
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
    setPressedCuts([])

    try {
      setJob(await startImport(url.trim()))
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : 'Could not start import')
    }
  }

  const progress = job?.progress
  const pressCount =
    progress?.phase === 'download' && progress.current && progress.total
      ? `${progress.current}/${progress.total} on the press`
      : progress?.message

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

      {pressCount ? (
        <p
          className="text-xs text-[var(--accent)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {pressCount}
        </p>
      ) : null}

      {pressedCuts.length > 0 ? (
        <div className="rail-scroll">
          {pressedCuts.map((cut, index) => (
            <div
              key={`${cut.title}:${index}`}
              className="liner-row px-1 py-2.5"
              data-active={cut.state === 'saving' ? 'true' : 'false'}
            >
              <div className="grid w-full grid-cols-[2.25rem_1fr] items-center gap-2 text-left">
                <span
                  className="cut-index text-[0.65rem] tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="cut-title line-clamp-1 text-sm">
                  {cut.state === 'saving' ? `Pressing · ${cut.title}` : cut.title}
                </span>
              </div>
            </div>
          ))}
        </div>
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
