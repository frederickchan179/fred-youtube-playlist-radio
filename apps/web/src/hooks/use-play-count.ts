import { useEffect, useRef, useState } from 'react'
import { bumpPlayCount, readPlayCount } from '../lib/play-counts'

export const usePlayCount = (
  playlistId: string | null,
  trackKey: string | null,
  isPlaying: boolean,
): number => {
  const [plays, setPlays] = useState(0)
  const lastCountedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!playlistId) {
      setPlays(0)
      return
    }
    setPlays(readPlayCount(playlistId))
  }, [playlistId])

  useEffect(() => {
    if (!playlistId || !trackKey || !isPlaying) return
    const countedKey = `${playlistId}:${trackKey}`
    if (lastCountedKey.current === countedKey) return
    lastCountedKey.current = countedKey
    setPlays(bumpPlayCount(playlistId))
  }, [playlistId, trackKey, isPlaying])

  return plays
}
