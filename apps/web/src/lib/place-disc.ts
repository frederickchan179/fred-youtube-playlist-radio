export type DiscBox = {
  centerX: number
  centerY: number
  size: number
}

export type DiscFlight = {
  key: number
  cover: string | null
  from: DiscBox
  to: DiscBox
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const boxFromElement = (element: Element, minimumSize = 0): DiscBox => {
  const box = element.getBoundingClientRect()
  const size = Math.max(minimumSize, Math.min(box.width, box.height))
  return {
    centerX: box.left + box.width / 2,
    centerY: box.top + box.height / 2,
    size,
  }
}

/** Jacket vinyl → platter. Null if the platter is not on screen yet. */
export const measureDiscFlight = (
  jacket: HTMLElement,
): { from: DiscBox; to: DiscBox } | null => {
  const platter = document.querySelector('[data-platter]')
  if (!platter) return null

  const vinylPeekingFromSleeve = jacket.querySelector('.pressing-vinyl')
  const sleeve = jacket.querySelector('.pressing-jacket') ?? jacket
  const start = vinylPeekingFromSleeve ?? sleeve

  return {
    from: boxFromElement(start, 72),
    to: boxFromElement(platter),
  }
}
