import type { Transition, Easing } from 'motion/react'
import { motionCatalog, type MotionStyleName } from './catalog'

/** Convert Companion-style response/damping into Motion spring params. */
function springFromResponse(response: number, damping: number, mass = 1): Transition {
  const stiffness = Math.round((mass * ((2 * Math.PI) / response) ** 2) * 100) / 100
  const damp = Math.round(2 * damping * Math.sqrt(stiffness * mass) * 100) / 100
  return {
    type: 'spring',
    stiffness,
    damping: damp,
    mass,
  }
}

export function transitionFor(
  style: MotionStyleName,
  reduceMotion: boolean,
): Transition {
  if (reduceMotion || style === 'ease') {
    const t = motionCatalog.tweens.reduceMotion
    return { type: 'tween', duration: t.duration, ease: t.ease as Easing }
  }

  const spring = motionCatalog.springs[style]
  return springFromResponse(spring.response, spring.damping, 1)
}

export const motionStyles = {
  transitionFor,
  pressScale: motionCatalog.press.scale,
  pressOpacity: motionCatalog.press.opacity,
  appearY: motionCatalog.appear.y,
  appearScale: motionCatalog.appear.scale,
  staggerDelay: (index: number, reduceMotion: boolean) =>
    reduceMotion ? 0 : (index * motionCatalog.staggerDenseMs) / 1000,
} as const
