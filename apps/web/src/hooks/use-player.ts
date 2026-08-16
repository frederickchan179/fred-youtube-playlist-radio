import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import type { Track } from '@radio/shared'
import { mediaUrl } from '../lib/api'
import { playFoley, unlockDeckFoley } from '../lib/deck-foley'

type PlayerState = {
  playlistId: string | null
  queue: Track[]
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

  const current = state.queue[state.index] ?? null

  const loadQueue = useCallback(
    (
      playlistId: string,
      tracks: Track[],
      startIndex = 0,
      options?: { autoplay?: boolean },
    ) => {
      setState((prev) => ({
        ...prev,
        playlistId,
        queue: tracks,
        index: Math.min(Math.max(0, startIndex), Math.max(0, tracks.length - 1)),
        currentTime: 0,
        duration: 0,
        playing: options?.autoplay ?? false,
      }))
    },
    [],
  )

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || stateRef.current.queue.length === 0) return
    unlockDeckFoley()
    if (audio.paused) {
      playFoley('needleDown')
      void audio.play()
      setState((s) => ({ ...s, playing: true }))
    } else {
      playFoley('needleUp')
      audio.pause()
      setState((s) => ({ ...s, playing: false }))
    }
  }, [])

  const pause = useCallback(() => {
    const audio = audioRef.current
    audio?.pause()
    setState((s) => (s.playing ? { ...s, playing: false } : s))
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setState((s) => ({ ...s, currentTime: time }))
  }, [])

  const playAt = useCallback((index: number) => {
    if (stateRef.current.queue.length === 0) return
    if (!stateRef.current.playing) {
      unlockDeckFoley()
      playFoley('needleDown')
    }
    setState((s) => {
      if (s.index === index && s.playing) {
        return { ...s, playing: true }
      }
      return {
        ...s,
        index,
        currentTime: 0,
        playing: true,
      }
    })
  }, [])

  const next = useCallback(() => {
    setState((s) => {
      if (s.queue.length === 0) return s
      if (s.shuffle) {
        if (s.queue.length === 1) return { ...s, playing: true }
        let nextIndex = s.index
        while (nextIndex === s.index) {
          nextIndex = Math.floor(Math.random() * s.queue.length)
        }
        return { ...s, index: nextIndex, currentTime: 0, playing: true }
      }
      const index = (s.index + 1) % s.queue.length
      return { ...s, index, currentTime: 0, playing: true }
    })
  }, [])

  const prev = useCallback(() => {
    setState((s) => {
      if (s.queue.length === 0) return s
      const audio = audioRef.current
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0
        return { ...s, currentTime: 0, playing: true }
      }
      const index = (s.index - 1 + s.queue.length) % s.queue.length
      return { ...s, index, currentTime: 0, playing: true }
    })
  }, [])

  const toggleShuffle = useCallback(() => {
    setState((s) => ({ ...s, shuffle: !s.shuffle }))
  }, [])

  // Bind audio element source when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !state.playlistId || !current) return

    const url = mediaUrl(state.playlistId, current.videoId, 'audio')
    const needsLoad = !audio.src.endsWith(url) && audio.dataset.videoId !== current.videoId
    if (needsLoad || audio.dataset.videoId !== current.videoId) {
      audio.dataset.videoId = current.videoId
      audio.src = url
      audio.load()
    }

    if (state.playing) {
      const playPromise = audio.play()
      playPromise?.catch(() => {
        setState((s) => ({ ...s, playing: false }))
      })
    } else {
      audio.pause()
    }
  }, [current, state.playlistId, state.playing, state.index])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () =>
      setState((s) => ({
        ...s,
        currentTime: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : s.duration,
      }))
    const onMeta = () =>
      setState((s) => ({
        ...s,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      }))
    const onEnded = () => next()
    const onPlay = () => setState((s) => ({ ...s, playing: true }))
    const onPause = () => setState((s) => ({ ...s, playing: false }))

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [next])

  return {
    audioRef: audioRef as RefObject<HTMLAudioElement | null>,
    state,
    current,
    loadQueue,
    toggle,
    pause,
    seek,
    playAt,
    next,
    prev,
    toggleShuffle,
  }
}

export type PlayerApi = ReturnType<typeof usePlayer>
