import { useCallback, useEffect, useRef, useState } from 'react'
import { mediaUrl, type PlaylistSummary } from '../lib/api'
import { playFoley, unlockDeckFoley } from '../lib/deck-foley'
import {
  measureDiscFlight,
  prefersReducedMotion,
  type DiscFlight,
} from '../lib/place-disc'

/** If the playlist request hangs, still reveal the platter so the UI cannot stick. */
const GIVE_UP_WAITING_FOR_QUEUE_MS = 1600

type Options = {
  playlists: PlaylistSummary[]
  isPlaying: boolean
  pausePlayback: () => void
  selectPlaylist: (playlistId: string) => void
  selectedPlaylistId: string | null
  queuedPlaylistId: string | null
  playlistFailedToLoad: boolean
  closeSleeve: () => void
  openAlbumSleeve: () => void
}

export const usePlaceOnPlatter = ({
  playlists,
  isPlaying,
  pausePlayback,
  selectPlaylist,
  selectedPlaylistId,
  queuedPlaylistId,
  playlistFailedToLoad,
  closeSleeve,
  openAlbumSleeve,
}: Options) => {
  const [flyingDisc, setFlyingDisc] = useState<DiscFlight | null>(null)
  const [hasTouchedPlatter, setHasTouchedPlatter] = useState(false)
  const nextFlightId = useRef(0)
  const openSleeveAfterLanding = useRef(false)
  const openAlbumSleeveRef = useRef(openAlbumSleeve)
  openAlbumSleeveRef.current = openAlbumSleeve

  const isDiscFlying = flyingDisc !== null

  const coverUrlFor = (playlistId: string): string | null => {
    const playlist = playlists.find((item) => item.playlistId === playlistId)
    if (!playlist?.coverVideoId) return null
    return mediaUrl(playlistId, playlist.coverVideoId, 'thumb')
  }

  const liftNeedleIfPlaying = () => {
    unlockDeckFoley()
    if (isPlaying) {
      playFoley('needleUp')
      pausePlayback()
    }
    playFoley('sleeve')
  }

  const putAlbumOnWithoutFlight = (playlistId: string) => {
    openSleeveAfterLanding.current = false
    selectPlaylist(playlistId)
    playFoley('drop')
    openAlbumSleeve()
  }

  const placeAlbumOnPlatter = (playlistId: string, jacket: HTMLElement) => {
    liftNeedleIfPlaying()

    if (prefersReducedMotion()) {
      putAlbumOnWithoutFlight(playlistId)
      return
    }

    const path = measureDiscFlight(jacket)
    if (!path) {
      putAlbumOnWithoutFlight(playlistId)
      return
    }

    openSleeveAfterLanding.current = true
    closeSleeve()
    nextFlightId.current += 1
    setHasTouchedPlatter(false)
    setFlyingDisc({
      key: nextFlightId.current,
      cover: coverUrlFor(playlistId),
      ...path,
    })
    selectPlaylist(playlistId)
  }

  const noteDiscLanded = useCallback(() => {
    playFoley('drop')
    setHasTouchedPlatter(true)
  }, [])

  useEffect(() => {
    if (!hasTouchedPlatter || !flyingDisc) return

    const queueIsReady =
      playlistFailedToLoad ||
      !selectedPlaylistId ||
      queuedPlaylistId === selectedPlaylistId

    const settleOnPlatter = () => {
      setFlyingDisc(null)
      setHasTouchedPlatter(false)
      if (openSleeveAfterLanding.current) {
        openSleeveAfterLanding.current = false
        openAlbumSleeveRef.current()
      }
    }

    if (queueIsReady) {
      settleOnPlatter()
      return
    }

    const timeout = window.setTimeout(settleOnPlatter, GIVE_UP_WAITING_FOR_QUEUE_MS)
    return () => window.clearTimeout(timeout)
  }, [
    hasTouchedPlatter,
    flyingDisc,
    selectedPlaylistId,
    queuedPlaylistId,
    playlistFailedToLoad,
  ])

  return {
    flyingDisc,
    isDiscFlying,
    placeAlbumOnPlatter,
    noteDiscLanded,
  }
}
