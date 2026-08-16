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
        const list = await fetchPlaylists()
        if (cancelled) return
        setPlaylists(list)
        setActivePlaylistId((selectedId) => {
          if (selectedId && list.some((playlist) => playlist.playlistId === selectedId)) {
            return selectedId
          }
          return list[0]?.playlistId ?? null
        })
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load playlists')
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
        const readyTracks = manifest.tracks.filter((track) => track.status === 'ready')
        setTracks(readyTracks)
        player.loadQueue(activePlaylistId, readyTracks, 0, { autoplay: false })
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
    // loadQueue is stable; player object is not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaylistId, libraryVersion])

  const refreshLibrary = useCallback((playlistId: string) => {
    setActivePlaylistId(playlistId)
    setLibraryVersion((version) => version + 1)
  }, [])

  const onRemoveVideo = useCallback(
    async (videoId: string) => {
      if (!activePlaylistId) return
      await removeTrackFromPlaylist(activePlaylistId, videoId)
      setLibraryVersion((version) => version + 1)
    },
    [activePlaylistId],
  )

  return (
    <RadioShell
      playlists={playlists}
      activePlaylistId={activePlaylistId}
      tracks={tracks}
      onSelectPlaylist={setActivePlaylistId}
      onImported={refreshLibrary}
      onSynced={refreshLibrary}
      onRemoveVideo={onRemoveVideo}
      player={player}
      error={error}
      loading={loading}
    />
  )
}
