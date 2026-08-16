import { useLayoutEffect, useRef } from 'react'
import { durationArmMs, easeRoomCss } from '../lib/motion'
import {
  measureDiscFlight,
  prefersReducedMotion,
  type DiscFlight,
} from '../lib/place-disc'

export { measureDiscFlight, prefersReducedMotion }
export type { DiscFlight }

type Props = {
  flight: DiscFlight
  onLanded: () => void
}

const transformAt = (
  cx: number,
  cy: number,
  size: number,
  dest: number,
  rotate: number,
) => {
  const scale = size / dest
  return `translate3d(${cx - dest / 2}px, ${cy - dest / 2}px, 0) rotate(${rotate}deg) scale(${scale})`
}

export const VinylFlyer = ({ flight, onLanded }: Props) => {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const landedRef = useRef(onLanded)
  landedRef.current = onLanded

  const dest = Math.max(1, flight.to.size)
  const start = transformAt(
    flight.from.cx,
    flight.from.cy,
    flight.from.size,
    dest,
    -18,
  )

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const { from, to } = flight
    const size = Math.max(1, to.size)
    const midCx = from.cx + (to.cx - from.cx) * 0.55
    const midCy = from.cy + (to.cy - from.cy) * 0.42 - 36
    const midSize = from.size + (to.size - from.size) * 0.58

    const fromFrame = transformAt(from.cx, from.cy, from.size, size, -18)
    const mid = transformAt(midCx, midCy, midSize, size, 9)
    const end = transformAt(to.cx, to.cy, to.size, size, 0)

    const animation = node.animate(
      [
        { transform: fromFrame, offset: 0 },
        { transform: mid, offset: 0.58 },
        { transform: end, offset: 1 },
      ],
      {
        duration: durationArmMs,
        easing: easeRoomCss,
        fill: 'forwards',
      },
    )

    let cancelled = false
    let settled = false
    const finish = () => {
      if (cancelled) return
      settled = true
      landedRef.current()
    }

    animation.addEventListener('finish', finish)
    return () => {
      cancelled = true
      animation.removeEventListener('finish', finish)
      if (!settled) animation.cancel()
    }
    // New disc = new key. Positions are read from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight.key])

  return (
    <div
      ref={nodeRef}
      className="vinyl-flyer"
      style={{ width: dest, height: dest, transform: start }}
      aria-hidden
    >
      <div className="vinyl h-full w-full">
        {flight.cover ? (
          <img src={flight.cover} alt="" className="vinyl-press" />
        ) : null}
        <div className="vinyl-grooves" />
        <div className="vinyl-label">
          {flight.cover ? (
            <img src={flight.cover} alt="" className="vinyl-label-art" />
          ) : (
            <div className="vinyl-label-blank">
              <span>Fred</span>
            </div>
          )}
          <div className="vinyl-label-paper" />
        </div>
      </div>
    </div>
  )
}
