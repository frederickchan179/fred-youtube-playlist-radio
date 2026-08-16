import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { mediaUrl, type QueuedTrack } from '../lib/api'
import { playFoley, unlockDeckFoley } from '../lib/deck-foley'

type PlayerState = {
  playlistId: string | null
  queue: QueuedTrack[]
  index: number
  playing: boolean
  currentTime: number
  duration: number
  shuffle: boolean
}

const initial: PlayerState = {
  playlistId: null,
  queue: [],
  index: 0,
  playing: false,
  currentTime: 0,
  duration: 0,
  shuffle: false,
}

export const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<PlayerState>(initial)
  const stateRef = useRef(state)
  stateRef.current = state

  const currentTrack = state.queue[state.index] ?? null

  const loadQueue = useCallback(
    (
      playlistId: string,
      tracks: QueuedTrack[],
      startIndex = 0,
      options?: { autoplay?: boolean; shuffle?: boolean },
    ) => {
      setState((previous) => ({
        ...previous,
        playlistId,
        queue: tracks,
        index: Math.min(Math.max(0, startIndex), Math.max(0, tracks.length - 1)),
        currentTime: 0,
        duration: 0,
        playing: options?.autoplay ?? false,
        shuffle: options?.shuffle ?? previous.shuffle,
      }))
    },
    [],
  )

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || stateRef.current.queue.length === 0) return
    unlockDeckFoley()
    if (audio.paused) {
      playFoley('needleDown')
      void audio.play()
      setState((previous) => ({ ...previous, playing: true }))
    } else {
      playFoley('needleUp')
      audio.pause()
      setState((previous) => ({ ...previous, playing: false }))
    }
  }, [])

  const pause = useCallback(() => {
    const audio = audioRef.current
    audio?.pause()
    setState((previous) =>
      previous.playing ? { ...previous, playing: false } : previous,
    )
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setState((previous) => ({ ...previous, currentTime: time }))
  }, [])

  const playTrackAt = useCallback((index: number) => {
    if (stateRef.current.queue.length === 0) return
    if (!stateRef.current.playing) {
      unlockDeckFoley()
      playFoley('needleDown')
    }
    setState((previous) => {
      if (previous.index === index && previous.playing) {
        return { ...previous, playing: true }
      }
      return {
        ...previous,
        index,
        currentTime: 0,
        playing: true,
      }
    })
  }, [])

  const next = useCallback(() => {
    setState((previous) => {
      if (previous.queue.length === 0) return previous
      if (previous.shuffle) {
        if (previous.queue.length === 1) return { ...previous, playing: true }
        let nextIndex = previous.index
        while (nextIndex === previous.index) {
          nextIndex = Math.floor(Math.random() * previous.queue.length)
        }
        return { ...previous, index: nextIndex, currentTime: 0, playing: true }
      }
      const index = (previous.index + 1) % previous.queue.length
      return { ...previous, index, currentTime: 0, playing: true }
    })
  }, [])

  const prev = useCallback(() => {
    setState((previous) => {
      if (previous.queue.length === 0) return previous
      const audio = audioRef.current
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0
        return { ...previous, currentTime: 0, playing: true }
      }
      const index =
        (previous.index - 1 + previous.queue.length) % previous.queue.length
      return { ...previous, index, currentTime: 0, playing: true }
    })
  }, [])

  const toggleShuffle = useCallback(() => {
    setState((previous) => ({ ...previous, shuffle: !previous.shuffle }))
  }, [])

  // Bind audio element source when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    const url = mediaUrl(currentTrack.sourcePlaylistId, currentTrack.videoId, 'audio')
    const sourceKey = `${currentTrack.sourcePlaylistId}:${currentTrack.videoId}`
    const needsLoad =
      !audio.src.endsWith(url) && audio.dataset.sourceKey !== sourceKey
    if (needsLoad || audio.dataset.sourceKey !== sourceKey) {
      audio.dataset.sourceKey = sourceKey
      audio.src = url
      audio.load()
    }

    if (state.playing) {
      const playPromise = audio.play()
      playPromise?.catch(() => {
        setState((previous) => ({ ...previous, playing: false }))
      })
    } else {
      audio.pause()
    }
  }, [currentTrack, state.playing, state.index])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () =>
      setState((previous) => ({
        ...previous,
        currentTime: audio.currentTime,
        duration: Number.isFinite(audio.duration)
          ? audio.duration
          : previous.duration,
      }))
    const onLoadedMetadata = () =>
      setState((previous) => ({
        ...previous,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      }))
    const onEnded = () => next()
    const onPlay = () =>
      setState((previous) => ({ ...previous, playing: true }))
    const onPause = () =>
      setState((previous) => ({ ...previous, playing: false }))

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [next])

  return {
    audioRef: audioRef as RefObject<HTMLAudioElement | null>,
    state,
    currentTrack,
    loadQueue,
    togglePlayPause,
    pause,
    seek,
    playTrackAt,
    next,
    prev,
    toggleShuffle,
  }
}

export type PlayerApi = ReturnType<typeof usePlayer>
