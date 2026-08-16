const STORAGE_KEY = 'fred-radio:plays'

const readAll = (): Record<string, number> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const counts: Record<string, number> = {}
    for (const [playlistId, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        counts[playlistId] = Math.floor(value)
      }
    }
    return counts
  } catch {
    return {}
  }
}

export const readPlayCount = (playlistId: string): number =>
  readAll()[playlistId] ?? 0

export const bumpPlayCount = (playlistId: string): number => {
  const counts = readAll()
  const next = (counts[playlistId] ?? 0) + 1
  counts[playlistId] = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
  } catch {
    /* private mode / quota */
  }
  return next
}
