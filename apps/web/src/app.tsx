import { useCallback, useEffect, useState } from 'react'
import type { Track } from '@radio/shared'
import { usePlayer } from './hooks/use-player'
import {
  fetchPlaylist,
  fetchPlaylists,
  removeTrackFromPlaylist,
  type PlaylistSummary,
} from './lib/api'
import { RadioShell } from './components/radio-shell'

export const App = () => {
  return <RadioApp />
}

const RadioApp = () => {
  const player = usePlayer()
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [libraryVersion, setLibraryVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        // Don't flash a red error during brief API restarts (HMR)
        const list = await fetchPlaylists()
        if (cancelled) return
        setPlaylists(list)
        setActivePlaylistId((current) => {
          if (current && list.some((p) => p.playlistId === current)) return current
          return list[0]?.playlistId ?? null
        })
        setError(null)
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load playlists'
          // Keep prior playlists visible if we already have them
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [libraryVersion])

  useEffect(() => {
    if (!activePlaylistId) {
      setTracks([])
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const manifest = await fetchPlaylist(activePlaylistId)
        if (cancelled) return
        const ready = manifest.tracks.filter((t) => t.status === 'ready')
        setTracks(ready)
        player.loadQueue(activePlaylistId, ready, 0, { autoplay: false })
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load playlist')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaylistId, libraryVersion])

  const onSelectPlaylist = (id: string) => {
    setActivePlaylistId(id)
  }

  const onImported = useCallback((playlistId: string) => {
    setActivePlaylistId(playlistId)
    setLibraryVersion((v) => v + 1)
  }, [])

  const onSynced = useCallback((playlistId: string) => {
    setActivePlaylistId(playlistId)
    setLibraryVersion((v) => v + 1)
  }, [])

  const onRemoveVideo = useCallback(
    async (videoId: string) => {
      if (!activePlaylistId) return
      await removeTrackFromPlaylist(activePlaylistId, videoId)
      setLibraryVersion((v) => v + 1)
    },
    [activePlaylistId],
  )

  return (
    <RadioShell
      playlists={playlists}
      activePlaylistId={activePlaylistId}
      tracks={tracks}
      onSelectPlaylist={onSelectPlaylist}
      onImported={onImported}
      onSynced={onSynced}
      onRemoveVideo={onRemoveVideo}
      player={player}
      error={error}
      loading={loading}
    />
  )
}
