import { useCallback, useEffect, useRef, useState } from 'react'
import { ON_AIR_PLAYLIST_ID } from '@radio/shared'
import { usePlayer } from './hooks/use-player'
import {
  fetchOnAir,
  fetchPlaylist,
  fetchPlaylists,
  removeTrackFromPlaylist,
  type PlaylistSummary,
  type QueuedTrack,
} from './lib/api'
import { RadioShell } from './components/radio-shell'
import { readPlatterQuery } from './lib/platter-query'

export const App = () => {
  const player = usePlayer()
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<QueuedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [libraryVersion, setLibraryVersion] = useState(0)
  const lastLoadedPlaylistId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await fetchPlaylists()
        if (cancelled) return
        setPlaylists(list)
        setActivePlaylistId((selectedId) => {
          if (selectedId === ON_AIR_PLAYLIST_ID) return selectedId
          if (selectedId && list.some((playlist) => playlist.playlistId === selectedId)) {
            return selectedId
          }
          const remembered = readPlatterQuery()
          if (
            remembered?.playlistId === ON_AIR_PLAYLIST_ID ||
            (remembered &&
              list.some((playlist) => playlist.playlistId === remembered.playlistId))
          ) {
            return remembered.playlistId
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
      lastLoadedPlaylistId.current = null
      return
    }

    const switchedPlaylist = lastLoadedPlaylistId.current !== activePlaylistId
    lastLoadedPlaylistId.current = activePlaylistId
    const isOnAir = activePlaylistId === ON_AIR_PLAYLIST_ID

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const readyTracks = isOnAir
          ? await fetchOnAir()
          : (await fetchPlaylist(activePlaylistId)).tracks
              .filter((track) => track.status === 'ready')
              .map((track) => ({ ...track, sourcePlaylistId: activePlaylistId }))
        if (cancelled) return
        const remembered = readPlatterQuery()
        const restoreIndex =
          remembered && remembered.playlistId === activePlaylistId
            ? readyTracks.findIndex((track) => track.videoId === remembered.videoId)
            : -1
        const shouldRestore = Boolean(remembered) && restoreIndex >= 0
        setTracks(readyTracks)
        player.loadQueue(activePlaylistId, readyTracks, shouldRestore ? restoreIndex : 0, {
          autoplay: false,
          shuffle:
            shouldRestore && remembered
              ? remembered.shuffle
              : switchedPlaylist && isOnAir
                ? true
                : undefined,
          startTime: shouldRestore && remembered ? remembered.currentTime : 0,
        })
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

  useEffect(() => {
    const onPopState = () => {
      const remembered = readPlatterQuery()
      if (!remembered) return
      setActivePlaylistId((selectedId) =>
        selectedId === remembered.playlistId ? selectedId : remembered.playlistId,
      )
      if (remembered.playlistId !== lastLoadedPlaylistId.current) return
      const index = tracks.findIndex((track) => track.videoId === remembered.videoId)
      if (index < 0) return
      player.loadQueue(remembered.playlistId, tracks, index, {
        autoplay: player.state.playing,
        shuffle: remembered.shuffle,
        startTime: remembered.currentTime,
      })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [player.loadQueue, player.state.playing, tracks])

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
