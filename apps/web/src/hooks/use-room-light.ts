import { useEffect, type RefObject } from 'react'
import { prefersReducedMotion } from '../lib/place-disc'

const ORBIT_MS = 72_000
/** Start the lamp in the upper-left of the room. */
const START_ANGLE = (5 * Math.PI) / 4

export const useRoomLight = (stageRef: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (prefersReducedMotion()) return

    const startedAt = performance.now()
    let frame = 0

    const orbit = (now: number) => {
      const turns = (now - startedAt) / ORBIT_MS
      const angle = turns * Math.PI * 2 + START_ANGLE
      const east = Math.cos(angle)
      const north = Math.sin(angle)

      stage.style.setProperty('--light-az', `${((angle * 180) / Math.PI - 90).toFixed(2)}deg`)
      stage.style.setProperty('--light-x', `${(50 + east * 38).toFixed(2)}%`)
      stage.style.setProperty('--light-y', `${(40 + north * 28).toFixed(2)}%`)
      stage.style.setProperty('--ref-x', `${(50 + east * 30).toFixed(2)}%`)
      stage.style.setProperty('--ref-y', `${(50 + north * 28).toFixed(2)}%`)
      stage.style.setProperty('--light-gain', (0.86 - north * 0.1).toFixed(3))
      stage.style.setProperty('--shadow-x', `${(-east * 22).toFixed(1)}px`)
      stage.style.setProperty('--shadow-y', `${(16 - north * 14).toFixed(1)}px`)

      frame = requestAnimationFrame(orbit)
    }

    frame = requestAnimationFrame(orbit)
    return () => cancelAnimationFrame(frame)
  }, [stageRef])
}
