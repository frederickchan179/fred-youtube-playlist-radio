import type { Transition } from 'motion/react'

/** Same curve as `--ease` in index.css — mass settling, not a UI bounce. */
export const easeRoom = [0.22, 1, 0.36, 1] as const

/** Seconds. Keep in lockstep with `--motion` (380ms). */
export const durationRoom = 0.38

/** Keep in lockstep with `--motion-arm` (700ms). */
export const durationArmMs = 700

export const easeRoomCss = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const roomTransition: Transition = {
  duration: durationRoom,
  ease: easeRoom,
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: roomTransition,
}

export const fadeLift = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: roomTransition,
}
