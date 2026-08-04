import { useEffect, useState } from 'react'
import type { ImportJob } from '../lib/api'

type Props = {
  playlistId: string | null
  playlistTitle?: string
  canSync?: boolean
  disabled?: boolean
  onSynced: (playlistId: string) => void
  size?: 'sm' | 'md'
}

export const SyncPlaylistButton = ({
  playlistId,
  playlistTitle,
  canSync = true,
  disabled = false,
  onSynced,
  size = 'sm',
}: Props) => {
  const [job, setJob] = useState<ImportJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const running =
    submitting || job?.status === 'queued' || job?.status === 'running'
  const blocked = !canSync

  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'error') return

    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(`/api/imports/${job.id}`)
        const data = (await res.json()) as { job?: ImportJob; error?: string }
        if (!res.ok || !data.job) {
          throw new Error(data.error ?? 'Failed to poll sync')
        }
        if (cancelled) return
        setJob(data.job)

        if (data.job.status === 'done' && data.job.summary) {
          setSubmitting(false)
          onSynced(data.job.summary.playlistId)
        }
        if (data.job.status === 'error') {
          setSubmitting(false)
          setError(data.job.error ?? 'Sync failed')
        }
      } catch (err) {
        if (!cancelled) {
          setSubmitting(false)
          setError(err instanceof Error ? err.message : 'Sync failed')
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
  }, [job, onSynced])

  const onClick = async () => {
    if (!playlistId || running || blocked) return
    setError(null)
    setSubmitting(true)
    setJob(null)

    try {
      const res = await fetch(`/api/playlists/${playlistId}/sync`, {
        method: 'POST',
      })
      const data = (await res.json()) as {
        job?: ImportJob
        error?: string
      }
      if (!res.ok || !data.job) {
        throw new Error(data.error ?? 'Could not start sync')
      }
      setJob(data.job)
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : 'Could not start sync')
    }
  }

  const progressLabel = (() => {
    if (!job?.progress) return null
    const p = job.progress
    if (p.phase === 'download' && p.current && p.total) {
      return `${p.current}/${p.total}`
    }
    return p.message
  })()

  const label = (() => {
    if (error) return error
    if (running && progressLabel) return `Syncing · ${progressLabel}`
    if (running) return 'Syncing…'
    if (blocked) return 'Only YouTube playlists can sync'
    if (job?.status === 'done' && job.summary) {
      return `Updated · ${job.summary.added} new`
    }
    return playlistTitle ? `Sync “${playlistTitle}”` : 'Sync'
  })()

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  const icon = size === 'sm' ? 14 : 16

  if (!canSync) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void onClick()
      }}
      disabled={!playlistId || disabled || running || blocked}
      title={label}
      aria-label={label}
      className={`grid ${dim} shrink-0 place-items-center disabled:opacity-40`}
      style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--line)',
        color: running || error ? 'var(--accent)' : 'var(--muted)',
        background: 'color-mix(in oklab, var(--panel) 70%, transparent)',
      }}
    >
      <SyncIcon size={icon} spinning={running} />
    </button>
  )
}

const SyncIcon = ({
  size,
  spinning,
}: {
  size: number
  spinning: boolean
}) => (
  <svg
    width={size}
    height={size}
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
