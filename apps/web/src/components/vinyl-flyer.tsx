import { useLayoutEffect, useRef } from 'react'
import { durationArmMs, easeRoomCss } from '../lib/motion'
import type { DiscBox, DiscFlight } from '../lib/place-disc'

const START_TILT_DEG = -18
const MID_TILT_DEG = 9
const HAND_LIFT_PX = 36
const ARC_AT = 0.55

type Props = {
  flight: DiscFlight
  onLanded: () => void
}

const discTransform = (
  { centerX, centerY, size }: DiscBox,
  platterSize: number,
  tiltDeg: number,
) => {
  const scale = size / platterSize
  const left = centerX - platterSize / 2
  const top = centerY - platterSize / 2
  return `translate3d(${left}px, ${top}px, 0) rotate(${tiltDeg}deg) scale(${scale})`
}

const pointAlong = (from: DiscBox, to: DiscBox, progress: number): DiscBox => ({
  centerX: from.centerX + (to.centerX - from.centerX) * progress,
  centerY: from.centerY + (to.centerY - from.centerY) * progress,
  size: from.size + (to.size - from.size) * progress,
})

export const VinylFlyer = ({ flight, onLanded }: Props) => {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const onLandedRef = useRef(onLanded)
  onLandedRef.current = onLanded

  const platterSize = Math.max(1, flight.to.size)
  const startTransform = discTransform(flight.from, platterSize, START_TILT_DEG)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const { from, to } = flight
    const peak = pointAlong(from, to, ARC_AT)
    const lifted: DiscBox = {
      ...peak,
      centerY: peak.centerY - HAND_LIFT_PX,
    }

    const animation = node.animate(
      [
        { transform: discTransform(from, platterSize, START_TILT_DEG), offset: 0 },
        { transform: discTransform(lifted, platterSize, MID_TILT_DEG), offset: 0.58 },
        { transform: discTransform(to, platterSize, 0), offset: 1 },
      ],
      {
        duration: durationArmMs,
        easing: easeRoomCss,
        fill: 'forwards',
      },
    )

    let wasCancelled = false
    let didLand = false
    const finish = () => {
      if (wasCancelled) return
      didLand = true
      onLandedRef.current()
    }

    animation.addEventListener('finish', finish)
    return () => {
      wasCancelled = true
      animation.removeEventListener('finish', finish)
      if (!didLand) animation.cancel()
    }
    // Restart only when a new disc takes off. Path is from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight.key])

  return (
    <div
      ref={nodeRef}
      className="vinyl-flyer"
      style={{ width: platterSize, height: platterSize, transform: startTransform }}
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
