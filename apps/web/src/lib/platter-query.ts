export type PlatterQuery = {
  playlistId: string
  videoId: string
  currentTime: number
  shuffle: boolean
}

export const readPlatterQuery = (): PlatterQuery | null => {
  const params = new URLSearchParams(window.location.search)
  const playlistId = params.get('playlist')
  const videoId = params.get('video') ?? params.get('v')
  if (!playlistId || !videoId) return null

  const timeRaw = params.get('t')
  const parsedTime = timeRaw == null ? 0 : Number(timeRaw)

  return {
    playlistId,
    videoId,
    currentTime:
      Number.isFinite(parsedTime) && parsedTime > 0 ? parsedTime : 0,
    shuffle: params.get('shuffle') === '1',
  }
}

export const writePlatterQuery = (
  query: PlatterQuery,
  history: 'replace' | 'push' = 'replace',
): void => {
  const url = new URL(window.location.href)
  url.searchParams.set('playlist', query.playlistId)
  url.searchParams.set('video', query.videoId)
  url.searchParams.delete('v')
  url.searchParams.delete('title')

  const seconds = Math.floor(query.currentTime)
  if (seconds > 0) url.searchParams.set('t', String(seconds))
  else url.searchParams.delete('t')

  if (query.shuffle) url.searchParams.set('shuffle', '1')
  else url.searchParams.delete('shuffle')

  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next === current) return

  if (history === 'push') {
    window.history.pushState(window.history.state, '', next)
    return
  }
  window.history.replaceState(window.history.state, '', next)
}
