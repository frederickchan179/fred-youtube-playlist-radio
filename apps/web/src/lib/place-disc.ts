export type DiscRect = {
  cx: number
  cy: number
  size: number
}

export type DiscFlight = {
  key: number
  cover: string | null
  from: DiscRect
  to: DiscRect
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const discRectFromElement = (el: Element, minSize = 72): DiscRect => {
  const box = el.getBoundingClientRect()
  const size = Math.max(minSize, Math.min(box.width, box.height))
  return {
    cx: box.left + box.width / 2,
    cy: box.top + box.height / 2,
    size,
  }
}

export const originFromJacket = (jacket: HTMLElement): Element =>
  jacket.querySelector('.pressing-vinyl') ??
  jacket.querySelector('.pressing-jacket') ??
  jacket

export const platterElement = (): Element | null =>
  document.querySelector('[data-platter]')

export const measureDiscFlight = (
  origin: HTMLElement,
): { from: DiscRect; to: DiscRect } | null => {
  const platter = platterElement()
  if (!platter) return null
  return {
    from: discRectFromElement(originFromJacket(origin), 72),
    to: discRectFromElement(platter, 0),
  }
}
