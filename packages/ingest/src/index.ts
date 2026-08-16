import { mkdir, readFile, rename, writeFile, access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { constants } from 'node:fs'
import { execa } from 'execa'
import {
  archivePath,
  manifestPath,
  playlistDir,
  playlistsRoot,
  tracksDir,
} from '@radio/shared/paths'
import {
  MANUAL_PLAYLIST_ID,
  MANUAL_PLAYLIST_TITLE,
  detectYouTubeInputKind,
  extractVideoId,
  extractPlaylistId,
  playlistManifestSchema,
  playlistUrlSchema,
  type PlaylistManifest,
  type SyncProgress,
  type SyncSummary,
  type Track,
} from '@radio/shared'

export type { SyncProgress }

export type SyncOptions = {
  download?: boolean
  onProgress?: (progress: SyncProgress) => void
  quiet?: boolean
}

type FlatEntry = {
  id?: string
  title?: string
  duration?: number | null
}

type PlaylistDump = {
  id?: string
  title?: string
  entries?: FlatEntry[]
}

type VideoDump = {
  id?: string
  title?: string
  duration?: number | null
}

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

const ensureBins = async (): Promise<void> => {
  // ffmpeg accepts `-version` (single dash). `--version` prints banner then exits non-zero.
  const checks: Array<{ bin: string; args: string[] }> = [
    { bin: 'yt-dlp', args: ['--version'] },
    { bin: 'ffmpeg', args: ['-version'] },
  ]

  for (const { bin, args } of checks) {
    try {
      await execa(bin, args)
    } catch {
      throw new Error(
        `Missing required binary: ${bin}. Install it and ensure it is on PATH. (checked: \`${bin} ${args.join(' ')}\`)`,
      )
    }
  }
}

export const readManifest = async (
  repoRoot: string,
  playlistId: string,
): Promise<PlaylistManifest | null> => {
  const file = manifestPath(repoRoot, playlistId)
  if (!(await fileExists(file))) return null
  const raw = JSON.parse(await readFile(file, 'utf8')) as unknown
  return playlistManifestSchema.parse(raw)
}

export const writeManifestAtomic = async (
  repoRoot: string,
  playlistId: string,
  manifest: PlaylistManifest,
): Promise<void> => {
  const dir = playlistDir(repoRoot, playlistId)
  await mkdir(dir, { recursive: true })
  const target = manifestPath(repoRoot, playlistId)
  const tmp = `${target}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await rename(tmp, target)
}

const dumpPlaylist = async (url: string): Promise<PlaylistDump> => {
  const { stdout } = await execa('yt-dlp', [
    '--flat-playlist',
    '--dump-single-json',
    '--no-warnings',
    url,
  ])
  return JSON.parse(stdout) as PlaylistDump
}

const dumpVideo = async (url: string): Promise<VideoDump> => {
  const { stdout } = await execa('yt-dlp', [
    '--dump-single-json',
    '--no-warnings',
    url,
  ])
  return JSON.parse(stdout) as VideoDump
}

const downloadTrack = async (
  repoRoot: string,
  playlistId: string,
  videoId: string,
  quiet: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const outDir = tracksDir(repoRoot, playlistId)
  await mkdir(outDir, { recursive: true })
  const archive = archivePath(repoRoot, playlistId)

  try {
    await execa(
      'yt-dlp',
      [
        '-f',
        'bestaudio/best',
        '-x',
        '--audio-format',
        'm4a',
        '--audio-quality',
        '0',
        '--write-thumbnail',
        '--convert-thumbnails',
        'jpg',
        '--download-archive',
        archive,
        '--no-warnings',
        '-o',
        path.join(outDir, '%(id)s.%(ext)s'),
        '--',
        `https://www.youtube.com/watch?v=${videoId}`,
      ],
      quiet
        ? { stdout: 'pipe', stderr: 'pipe' }
        : { stdout: 'inherit', stderr: 'inherit' },
    )
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}

const resolveThumbRel = async (
  repoRoot: string,
  playlistId: string,
  videoId: string,
): Promise<string | null> => {
  const jpg = path.join(tracksDir(repoRoot, playlistId), `${videoId}.jpg`)
  if (await fileExists(jpg)) return `tracks/${videoId}.jpg`
  const webp = path.join(tracksDir(repoRoot, playlistId), `${videoId}.webp`)
  if (await fileExists(webp)) return `tracks/${videoId}.webp`
  return null
}

const resolveAudioRel = async (
  repoRoot: string,
  playlistId: string,
  videoId: string,
): Promise<string | null> => {
  const m4a = path.join(tracksDir(repoRoot, playlistId), `${videoId}.m4a`)
  if (await fileExists(m4a)) return `tracks/${videoId}.m4a`
  return null
}

export const syncPlaylist = async (
  repoRoot: string,
  sourceUrl: string,
  options?: SyncOptions,
): Promise<SyncSummary> => {
  const report = (progress: SyncProgress) => {
    options?.onProgress?.(progress)
    if (!options?.quiet) {
      if (progress.phase === 'download' && progress.current && progress.total) {
        console.log(
          `\n↓ ${progress.current}/${progress.total}  ${progress.trackTitle ?? ''}`,
        )
      } else if (progress.message) {
        console.log(progress.message)
      }
    }
  }

  await ensureBins()
  const url = playlistUrlSchema.parse(sourceUrl)
  const playlistId = extractPlaylistId(url)
  const shouldDownload = options?.download !== false
  const quiet = options?.quiet === true

  await mkdir(tracksDir(repoRoot, playlistId), { recursive: true })

  report({ phase: 'meta', message: 'Fetching playlist metadata…' })
  const dump = await dumpPlaylist(url)
  const title = dump.title?.trim() || playlistId
  const entries = (dump.entries ?? []).filter((e) => Boolean(e.id))

  const existing = await readManifest(repoRoot, playlistId)
  const byId = new Map((existing?.tracks ?? []).map((t) => [t.videoId, t]))
  const now = new Date().toISOString()

  let added = 0
  let updated = 0
  let removedRemote = 0

  const nextTracks: Track[] = []

  for (const [index, entry] of entries.entries()) {
    const videoId = entry.id as string
    const prev = byId.get(videoId)
    let track: Track =
      prev ??
      ({
        videoId,
        title: entry.title ?? videoId,
        durationSec:
          typeof entry.duration === 'number' ? entry.duration : null,
        index,
        audioRel: `tracks/${videoId}.m4a`,
        thumbRel: null,
        status: 'failed',
        lastSeenAt: now,
      } satisfies Track)

    const metaChanged =
      track.title !== (entry.title ?? track.title) || track.index !== index

    track = {
      ...track,
      title: entry.title ?? track.title,
      durationSec:
        typeof entry.duration === 'number' ? entry.duration : track.durationSec,
      index,
      lastSeenAt: now,
    }

    if (!prev) added += 1
    else if (metaChanged) updated += 1

    const audioReady = Boolean(
      await resolveAudioRel(repoRoot, playlistId, videoId),
    )
    const needsDownload =
      shouldDownload &&
      (!audioReady ||
        track.status === 'failed' ||
        track.status === 'removed_remote')

    if (needsDownload && !audioReady) {
      report({
        phase: 'download',
        message: `Downloading ${index + 1}/${entries.length}`,
        current: index + 1,
        total: entries.length,
        trackTitle: track.title,
      })
      const result = await downloadTrack(repoRoot, playlistId, videoId, quiet)
      if (!result.ok) {
        track = {
          ...track,
          status: 'failed',
          error: result.error,
        }
      }
    }

    const audioRel = await resolveAudioRel(repoRoot, playlistId, videoId)
    const thumbRel = await resolveThumbRel(repoRoot, playlistId, videoId)

    if (audioRel) {
      track = {
        ...track,
        audioRel,
        thumbRel,
        status: 'ready',
        error: undefined,
      }
    } else if (track.status !== 'failed') {
      track = {
        ...track,
        thumbRel,
        status: 'failed',
        error: track.error ?? 'Audio file missing',
      }
    }

    nextTracks.push(track)
    byId.delete(videoId)
  }

  for (const leftover of byId.values()) {
    removedRemote += 1
    nextTracks.push({
      ...leftover,
      status: leftover.status === 'ready' ? 'removed_remote' : leftover.status,
      lastSeenAt: now,
    })
  }

  nextTracks.sort((a, b) => a.index - b.index)

  const manifest: PlaylistManifest = {
    version: 1,
    playlistId,
    sourceUrl: url,
    title,
    syncedAt: now,
    tracks: nextTracks,
  }

  await writeManifestAtomic(repoRoot, playlistId, manifest)

  const summary: SyncSummary = {
    playlistId,
    title,
    added,
    updated,
    failed: nextTracks.filter((t) => t.status === 'failed').length,
    removedRemote,
    totalReady: nextTracks.filter((t) => t.status === 'ready').length,
  }

  report({
    phase: 'done',
    message: `Ready: ${summary.totalReady} tracks · +${summary.added} new`,
  })

  if (!quiet) {
    console.log(`\n✓ ${summary.title}`)
    console.log(
      `  +${summary.added} new · ~${summary.updated} meta · ${summary.failed} failed · ${summary.removedRemote} removed-remote · ${summary.totalReady} ready`,
    )
  }

  return summary
}

export const importVideoToManualPlaylist = async (
  repoRoot: string,
  sourceUrl: string,
  options?: SyncOptions,
): Promise<SyncSummary> => {
  const report = (progress: SyncProgress) => {
    options?.onProgress?.(progress)
    if (!options?.quiet && progress.message) {
      console.log(progress.message)
    }
  }

  await ensureBins()
  const url = playlistUrlSchema.parse(sourceUrl)
  const videoId = extractVideoId(url)
  const quiet = options?.quiet === true

  report({ phase: 'meta', message: 'Fetching video metadata…' })
  const video = await dumpVideo(url)
  const title = video.title?.trim() || videoId
  const now = new Date().toISOString()

  const existing = await readManifest(repoRoot, MANUAL_PLAYLIST_ID)
  const existingTracks = [...(existing?.tracks ?? [])]
  const existingIndex = existingTracks.findIndex((t) => t.videoId === videoId)
  const prev = existingIndex >= 0 ? existingTracks[existingIndex] : null

  let added = 0
  let updated = 0
  if (prev) updated = 1
  else added = 1

  report({ phase: 'download', message: `Downloading ${title}`, current: 1, total: 1, trackTitle: title })
  const result = await downloadTrack(repoRoot, MANUAL_PLAYLIST_ID, videoId, quiet)

  const audioRel = await resolveAudioRel(repoRoot, MANUAL_PLAYLIST_ID, videoId)
  const thumbRel = await resolveThumbRel(repoRoot, MANUAL_PLAYLIST_ID, videoId)

  let track: Track = {
    videoId,
    title,
    durationSec: typeof video.duration === 'number' ? video.duration : null,
    index: prev?.index ?? existingTracks.length,
    audioRel: audioRel ?? `tracks/${videoId}.m4a`,
    thumbRel,
    status: result.ok && audioRel ? 'ready' : 'failed',
    lastSeenAt: now,
    error: result.ok ? undefined : result.error,
  }

  if (prev) {
    track = {
      ...prev,
      ...track,
      index: prev.index,
    }
    existingTracks[existingIndex] = track
  } else {
    existingTracks.push(track)
  }

  const manifest: PlaylistManifest = {
    version: 1,
    playlistId: MANUAL_PLAYLIST_ID,
    sourceUrl: 'https://youtube.com',
    title: MANUAL_PLAYLIST_TITLE,
    syncedAt: now,
    tracks: existingTracks.sort((a, b) => a.index - b.index),
  }

  await writeManifestAtomic(repoRoot, MANUAL_PLAYLIST_ID, manifest)

  const summary: SyncSummary = {
    playlistId: MANUAL_PLAYLIST_ID,
    title: MANUAL_PLAYLIST_TITLE,
    added,
    updated,
    failed: manifest.tracks.filter((t) => t.status === 'failed').length,
    removedRemote: 0,
    totalReady: manifest.tracks.filter((t) => t.status === 'ready').length,
  }

  report({
    phase: 'done',
    message: `Saved in ${MANUAL_PLAYLIST_TITLE} · ${summary.totalReady} ready`,
  })
  return summary
}

export const importFromUrl = async (
  repoRoot: string,
  sourceUrl: string,
  options?: SyncOptions,
): Promise<SyncSummary> => {
  const url = playlistUrlSchema.parse(sourceUrl)
  const kind = detectYouTubeInputKind(url)
  if (kind === 'playlist') {
    return syncPlaylist(repoRoot, url, options)
  }
  return importVideoToManualPlaylist(repoRoot, url, options)
}

export const syncExisting = async (
  repoRoot: string,
  playlistId?: string,
  options?: SyncOptions,
): Promise<void> => {
  await ensureBins()
  const root = playlistsRoot(repoRoot)
  await mkdir(root, { recursive: true })

  if (playlistId) {
    const manifest = await readManifest(repoRoot, playlistId)
    if (!manifest) {
      throw new Error(`No local playlist found: ${playlistId}`)
    }
    await syncPlaylist(repoRoot, manifest.sourceUrl, options)
    return
  }

  const dirs = await readdir(root, { withFileTypes: true })
  const ids = dirs.filter((d) => d.isDirectory()).map((d) => d.name)
  if (ids.length === 0) {
    console.log('No playlists in library yet. Import from the UI or CLI.')
    return
  }

  for (const id of ids) {
    if (id === MANUAL_PLAYLIST_ID) continue
    const manifest = await readManifest(repoRoot, id)
    if (!manifest) continue
    console.log(`\n── Sync ${manifest.title} (${id})`)
    await syncPlaylist(repoRoot, manifest.sourceUrl, options)
  }
}
