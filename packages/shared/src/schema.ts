import { z } from 'zod'

export const trackStatusSchema = z.enum(['ready', 'failed', 'removed_remote'])

export const trackSchema = z.object({
  videoId: z.string().min(1),
  title: z.string(),
  durationSec: z.number().nullable(),
  index: z.number().int().nonnegative(),
  audioRel: z.string(),
  thumbRel: z.string().nullable(),
  status: trackStatusSchema,
  lastSeenAt: z.string(),
  error: z.string().optional(),
})

export const playlistManifestSchema = z.object({
  version: z.literal(1),
  playlistId: z.string().min(1),
  sourceUrl: z.string().url(),
  title: z.string(),
  syncedAt: z.string(),
  tracks: z.array(trackSchema),
})

export type TrackStatus = z.infer<typeof trackStatusSchema>
export type Track = z.infer<typeof trackSchema>
export type PlaylistManifest = z.infer<typeof playlistManifestSchema>
export const MANUAL_PLAYLIST_ID = 'manual_saved_videos'
export const MANUAL_PLAYLIST_TITLE = 'Saved videos'
export const ON_AIR_PLAYLIST_ID = 'on_air'
export const ON_AIR_PLAYLIST_TITLE = 'On Air'

export const playlistUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const u = new URL(url)
        return (
          u.hostname.includes('youtube.com') ||
          u.hostname.includes('youtu.be') ||
          u.hostname.includes('music.youtube.com')
        )
      } catch {
        return false
      }
    },
    { message: 'Must be a YouTube URL' },
  )

export const extractPlaylistId = (rawUrl: string): string => {
  const url = new URL(rawUrl)
  const list = url.searchParams.get('list')
  if (!list) {
    throw new Error('URL must contain a playlist id (?list=...)')
  }
  return list
}

export const extractVideoId = (rawUrl: string): string => {
  const url = new URL(rawUrl)

  if (url.hostname.includes('youtu.be')) {
    const pathId = url.pathname.split('/').filter(Boolean)[0]
    if (!pathId) {
      throw new Error('URL must include a YouTube video id')
    }
    return pathId
  }

  const v = url.searchParams.get('v')
  if (v) return v

  const embedMatch = /^\/(embed|shorts)\/([^/]+)/.exec(url.pathname)
  if (embedMatch?.[2]) return embedMatch[2]

  throw new Error('URL must contain a video id')
}

export type YouTubeInputKind = 'playlist' | 'video'

export const detectYouTubeInputKind = (rawUrl: string): YouTubeInputKind => {
  const url = new URL(rawUrl)
  const playlistId = url.searchParams.get('list')
  if (playlistId) return 'playlist'
  return 'video'
}

export const syncSummarySchema = z.object({
  playlistId: z.string(),
  title: z.string(),
  added: z.number().int(),
  updated: z.number().int(),
  failed: z.number().int(),
  removedRemote: z.number().int(),
  totalReady: z.number().int(),
})

export type SyncSummary = z.infer<typeof syncSummarySchema>

export const syncProgressSchema = z.object({
  phase: z.enum(['meta', 'download', 'done', 'error']),
  message: z.string(),
  current: z.number().optional(),
  total: z.number().optional(),
  trackTitle: z.string().optional(),
})

export type SyncProgress = z.infer<typeof syncProgressSchema>
