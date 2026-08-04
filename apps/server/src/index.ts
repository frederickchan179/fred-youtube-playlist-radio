import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import {
  importFromUrl,
  syncPlaylist,
  type SyncProgress,
} from '@radio/ingest'
import {
  manifestPath,
  playlistDir,
  playlistsRoot,
  resolveRepoRoot,
} from '@radio/shared/paths'
import {
  MANUAL_PLAYLIST_ID,
  playlistManifestSchema,
  playlistUrlSchema,
  type PlaylistManifest,
  type SyncSummary,
} from '@radio/shared'

const repoRoot = resolveRepoRoot(import.meta.url)
const PORT = Number(process.env.PORT ?? 8787)

type ImportJob = {
  id: string
  url: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: SyncProgress | null
  summary: SyncSummary | null
  error: string | null
  createdAt: string
  updatedAt: string
}

const jobs = new Map<string, ImportJob>()
let activeJobId: string | null = null

const readManifest = async (
  playlistId: string,
): Promise<PlaylistManifest | null> => {
  const file = manifestPath(repoRoot, playlistId)
  if (!existsSync(file)) return null
  const raw = JSON.parse(await readFile(file, 'utf8')) as unknown
  return playlistManifestSchema.parse(raw)
}

const listPlaylistIds = async (): Promise<string[]> => {
  const root = playlistsRoot(repoRoot)
  if (!existsSync(root)) return []
  const entries = await readdir(root, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

const contentTypeFor = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.m4a') return 'audio/mp4'
  if (ext === '.mp3') return 'audio/mpeg'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.png') return 'image/png'
  return 'application/octet-stream'
}

const touchJob = (
  job: ImportJob,
  patch: Partial<ImportJob>,
): ImportJob => {
  const next = {
    ...job,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  jobs.set(job.id, next)
  return next
}

const writeManifestAtomic = async (
  playlistId: string,
  manifest: PlaylistManifest,
): Promise<void> => {
  const target = manifestPath(repoRoot, playlistId)
  const tmp = `${target}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await rename(tmp, target)
}

const removeTrackFiles = async (
  playlistId: string,
  videoId: string,
): Promise<void> => {
  const dir = path.join(playlistDir(repoRoot, playlistId), 'tracks')
  if (!existsSync(dir)) return
  const files = await readdir(dir)
  const toDelete = files.filter((name) => name.startsWith(`${videoId}.`))
  await Promise.all(
    toDelete.map(async (name) => {
      await unlink(path.join(dir, name)).catch(() => undefined)
    }),
  )
}

const runImportJob = async (jobId: string): Promise<void> => {
  const job = jobs.get(jobId)
  if (!job) return

  activeJobId = jobId
  touchJob(job, {
    status: 'running',
    progress: { phase: 'meta', message: 'Starting import…' },
    error: null,
  })

  try {
    const summary = await importFromUrl(repoRoot, job.url, {
      quiet: true,
      onProgress: (progress) => {
        const current = jobs.get(jobId)
        if (!current) return
        touchJob(current, { progress })
      },
    })
    const current = jobs.get(jobId)
    if (current) {
      touchJob(current, {
        status: 'done',
        summary,
        progress: {
          phase: 'done',
          message: `Imported “${summary.title}” · ${summary.totalReady} ready`,
        },
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const current = jobs.get(jobId)
    if (current) {
      touchJob(current, {
        status: 'error',
        error: message,
        progress: { phase: 'error', message },
      })
    }
  } finally {
    if (activeJobId === jobId) activeJobId = null
  }
}

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/playlists', async (c) => {
  const ids = await listPlaylistIds()
  const playlists = []
  for (const id of ids) {
    const manifest = await readManifest(id)
    if (!manifest) continue
    const ready = manifest.tracks.filter((t) => t.status === 'ready')
    playlists.push({
      playlistId: manifest.playlistId,
      title: manifest.title,
      sourceUrl: manifest.sourceUrl,
      syncedAt: manifest.syncedAt,
      trackCount: ready.length,
      coverVideoId: ready[0]?.videoId ?? null,
      canSync: manifest.playlistId !== MANUAL_PLAYLIST_ID,
    })
  }
  playlists.sort((a, b) => a.title.localeCompare(b.title))
  return c.json({ playlists })
})

app.get('/api/playlists/:id', async (c) => {
  const manifest = await readManifest(c.req.param('id'))
  if (!manifest) return c.json({ error: 'Playlist not found' }, 404)
  return c.json({
    ...manifest,
    tracks: manifest.tracks.filter(
      (t) => t.status === 'ready' || t.status === 'removed_remote',
    ),
  })
})

app.post('/api/playlists/import', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = z.object({ url: z.string().min(1) }).safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Body must include { url }' }, 400)
  }

  let url: string
  try {
    url = playlistUrlSchema.parse(parsed.data.url.trim())
  } catch {
    return c.json({ error: 'Invalid YouTube URL' }, 400)
  }

  if (activeJobId) {
    const active = jobs.get(activeJobId)
    if (active && (active.status === 'queued' || active.status === 'running')) {
      return c.json(
        {
          error: 'An import is already running',
          jobId: active.id,
        },
        409,
      )
    }
  }

  const job: ImportJob = {
    id: randomUUID(),
    url,
    status: 'queued',
    progress: { phase: 'meta', message: 'Queued…' },
    summary: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  jobs.set(job.id, job)

  // Fire and forget — client polls /api/imports/:id
  void runImportJob(job.id)

  return c.json({ jobId: job.id, job }, 202)
})

app.get('/api/imports/:id', (c) => {
  const job = jobs.get(c.req.param('id'))
  if (!job) return c.json({ error: 'Import job not found' }, 404)
  return c.json({ job })
})

app.get('/api/imports/active', (c) => {
  if (!activeJobId) return c.json({ job: null })
  return c.json({ job: jobs.get(activeJobId) ?? null })
})

app.post('/api/playlists/:id/sync', async (c) => {
  const playlistId = c.req.param('id')
  if (playlistId === MANUAL_PLAYLIST_ID) {
    return c.json({ error: 'Saved videos playlist cannot be synced' }, 400)
  }
  const manifest = await readManifest(playlistId)
  if (!manifest) return c.json({ error: 'Playlist not found' }, 404)

  if (activeJobId) {
    const active = jobs.get(activeJobId)
    if (active && (active.status === 'queued' || active.status === 'running')) {
      return c.json(
        { error: 'An import is already running', jobId: active.id },
        409,
      )
    }
  }

  const job: ImportJob = {
    id: randomUUID(),
    url: manifest.sourceUrl,
    status: 'queued',
    progress: { phase: 'meta', message: 'Queued sync…' },
    summary: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  jobs.set(job.id, job)
  void runImportJob(job.id)
  return c.json({ jobId: job.id, job }, 202)
})

app.delete('/api/playlists/:id/tracks/:videoId', async (c) => {
  const playlistId = c.req.param('id')
  const videoId = c.req.param('videoId')
  if (playlistId !== MANUAL_PLAYLIST_ID) {
    return c.json({ error: 'Only Saved videos playlist is editable' }, 403)
  }

  const manifest = await readManifest(playlistId)
  if (!manifest) return c.json({ error: 'Playlist not found' }, 404)

  const nextTracks = manifest.tracks
    .filter((track) => track.videoId !== videoId)
    .map((track, index) => ({ ...track, index }))

  if (nextTracks.length === manifest.tracks.length) {
    return c.json({ error: 'Track not found' }, 404)
  }

  await removeTrackFiles(playlistId, videoId)
  const nextManifest: PlaylistManifest = {
    ...manifest,
    syncedAt: new Date().toISOString(),
    tracks: nextTracks,
  }
  await writeManifestAtomic(playlistId, nextManifest)

  return c.json({ ok: true, playlistId, removedVideoId: videoId })
})

app.get('/api/playlists/:id/media/:videoId', async (c) => {
  const playlistId = c.req.param('id')
  const videoId = c.req.param('videoId')
  const kind = c.req.query('kind') === 'thumb' ? 'thumb' : 'audio'

  const manifest = await readManifest(playlistId)
  if (!manifest) return c.json({ error: 'Playlist not found' }, 404)

  const track = manifest.tracks.find((t) => t.videoId === videoId)
  if (!track) return c.json({ error: 'Track not found' }, 404)

  const rel = kind === 'thumb' ? track.thumbRel : track.audioRel
  if (!rel) return c.json({ error: 'Media missing' }, 404)

  const absolute = path.join(playlistDir(repoRoot, playlistId), rel)
  if (!existsSync(absolute)) return c.json({ error: 'File missing' }, 404)

  const stat = statSync(absolute)
  const contentType = contentTypeFor(absolute)
  const range = c.req.header('range')

  if (kind === 'audio' && range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range)
    if (!match) return c.body('Invalid Range', 416)

    const start = match[1] ? Number(match[1]) : 0
    const end = match[2] ? Number(match[2]) : stat.size - 1
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      end >= stat.size
    ) {
      return c.body('Invalid Range', 416)
    }

    const chunkSize = end - start + 1
    const nodeStream = createReadStream(absolute, { start, end })

    return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': String(chunkSize),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }

  const nodeStream = createReadStream(absolute)
  return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(stat.size),
      'Cache-Control': 'private, max-age=3600',
    },
  })
})

await mkdir(playlistsRoot(repoRoot), { recursive: true })

console.log(`Radio API → http://127.0.0.1:${PORT}`)
console.log(`Library   → ${playlistsRoot(repoRoot)}`)

serve({ fetch: app.fetch, hostname: '127.0.0.1', port: PORT })
