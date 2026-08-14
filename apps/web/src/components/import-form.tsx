import { useEffect, useState, type FormEvent } from 'react'
import type { ImportJob } from '../lib/api'

type Props = {
  onImported: (playlistId: string) => void
  busy?: boolean
}

export const ImportForm = ({ onImported, busy = false }: Props) => {
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<ImportJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const running =
    submitting ||
    busy ||
    job?.status === 'queued' ||
    job?.status === 'running'

  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'error') return

    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(`/api/imports/${job.id}`)
        const data = (await res.json()) as { job?: ImportJob; error?: string }
        if (!res.ok || !data.job) {
          throw new Error(data.error ?? 'Failed to poll import')
        }
        if (cancelled) return
        setJob(data.job)

        if (data.job.status === 'done' && data.job.summary) {
          setSubmitting(false)
          onImported(data.job.summary.playlistId)
          setUrl('')
        }
        if (data.job.status === 'error') {
          setSubmitting(false)
          setError(data.job.error ?? 'Import failed')
        }
      } catch (err) {
        if (!cancelled) {
          setSubmitting(false)
          setError(err instanceof Error ? err.message : 'Import failed')
        }
      }
    }

    const id = window.setInterval(() => {
      void tick()
    }, 1200)
    void tick()

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [job, onImported])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    setJob(null)

    try {
      const res = await fetch('/api/playlists/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = (await res.json()) as {
        jobId?: string
        job?: ImportJob
        error?: string
      }
      if (!res.ok || !data.job) {
        throw new Error(data.error ?? 'Could not start import')
      }
      setJob(data.job)
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : 'Could not start import')
    }
  }

  const progressLabel = (() => {
    if (!job?.progress) return null
    const p = job.progress
    if (p.phase === 'download' && p.current && p.total) {
      return `${p.current}/${p.total} · ${p.trackTitle ?? 'Downloading…'}`
    }
    return p.message
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
            onChange={(e) => setUrl(e.target.value)}
            placeholder="youtube.com/playlist?list=… or a single video"
            className="min-w-0 flex-1 px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)] disabled:opacity-50"
            style={{
              borderRadius: 'var(--radius-box)',
              border: '1px solid var(--line)',
              background: 'color-mix(in oklab, var(--bg-0) 55%, transparent)',
              color: 'var(--ink)',
            }}
          />
          <button
            type="submit"
            disabled={running || !url.trim()}
            className="shrink-0 px-5 py-3 text-sm font-medium disabled:opacity-40"
            style={{
              borderRadius: 'var(--radius)',
              background: 'var(--ink)',
              color: 'var(--bg-0)',
            }}
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
