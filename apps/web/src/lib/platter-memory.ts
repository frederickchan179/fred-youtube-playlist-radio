const STORAGE_KEY = 'fred-radio:platter'

export type PlatterMemory = {
  playlistId: string
  videoId: string
  currentTime: number
  shuffle: boolean
}

export const readPlatterMemory = (): PlatterMemory | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PlatterMemory>
    if (typeof parsed.playlistId !== 'string' || parsed.playlistId.length === 0) {
      return null
    }
    if (typeof parsed.videoId !== 'string' || parsed.videoId.length === 0) {
      return null
    }
    return {
      playlistId: parsed.playlistId,
      videoId: parsed.videoId,
      currentTime:
        typeof parsed.currentTime === 'number' && Number.isFinite(parsed.currentTime)
          ? Math.max(0, parsed.currentTime)
          : 0,
      shuffle: parsed.shuffle === true,
    }
  } catch {
    return null
  }
}

export const writePlatterMemory = (memory: PlatterMemory): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    /* private mode / quota */
  }
}
