import type { PlaylistManifest, SyncProgress, SyncSummary } from '@radio/shared'

export type PlaylistSummary = {
  playlistId: string
  title: string
  sourceUrl: string
  syncedAt: string
  trackCount: number
  coverVideoId: string | null
  canSync: boolean
}

export type ImportProgress = SyncProgress

export type ImportJob = {
  id: string
  url: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: ImportProgress | null
  summary: SyncSummary | null
  error: string | null
  createdAt: string
  updatedAt: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const readErrorMessage = async (res: Response): Promise<string> => {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  if (body?.error) return body.error
  // Vite proxy returns 500 while API restarts during HMR
  if (res.status === 500 || res.status === 502 || res.status === 503) {
    return 'API is restarting — retrying…'
  }
  return `Request failed (${res.status})`
}

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json() as Promise<T>
}

const fetchJson = async <T>(
  input: string,
  init?: RequestInit,
  retries = 4,
): Promise<T> => {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(input, init)
      // Transient: API process bouncing under tsx watch / Vite proxy
      if (
        (res.status === 500 || res.status === 502 || res.status === 503) &&
        attempt < retries
      ) {
        await sleep(250 * (attempt + 1))
        continue
      }
      return await json<T>(res)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        await sleep(250 * (attempt + 1))
        continue
      }
    }
  }
  throw lastError ?? new Error('Request failed')
}

export const fetchPlaylists = async (): Promise<PlaylistSummary[]> => {
  const data = await fetchJson<{ playlists: PlaylistSummary[] }>('/api/playlists')
  return data.playlists
}

export const fetchPlaylist = async (
  playlistId: string,
): Promise<PlaylistManifest> => {
  return fetchJson<PlaylistManifest>(`/api/playlists/${playlistId}`)
}

export const removeTrackFromPlaylist = async (
  playlistId: string,
  videoId: string,
): Promise<void> => {
  await fetchJson(`/api/playlists/${playlistId}/tracks/${videoId}`, {
    method: 'DELETE',
  })
}

export const fetchImportJob = async (id: string): Promise<ImportJob> => {
  const data = await fetchJson<{ job: ImportJob }>(`/api/imports/${id}`)
  return data.job
}

export const startImport = async (url: string): Promise<ImportJob> => {
  const data = await fetchJson<{ job: ImportJob }>('/api/playlists/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return data.job
}

export const startSync = async (playlistId: string): Promise<ImportJob> => {
  const data = await fetchJson<{ job: ImportJob }>(
    `/api/playlists/${playlistId}/sync`,
    { method: 'POST' },
  )
  return data.job
}


export const mediaUrl = (
  playlistId: string,
  videoId: string,
  kind: 'audio' | 'thumb',
): string =>
  `/api/playlists/${playlistId}/media/${videoId}?kind=${kind}`

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}
