import type { Transition } from 'motion/react'
import { motionStyles } from './styles'
import type { MotionStyleName } from './catalog'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const interaction = {
  animation(style: MotionStyleName, reduceMotion = prefersReducedMotion()): Transition {
    return motionStyles.transitionFor(style, reduceMotion)
  },

  staggerDelay(index: number, reduceMotion = prefersReducedMotion()): number {
    return motionStyles.staggerDelay(index, reduceMotion)
  },

  press: {
    whileTap: {
      scale: motionStyles.pressScale,
      opacity: motionStyles.pressOpacity,
    },
    transition: (reduceMotion = prefersReducedMotion()) =>
      motionStyles.transitionFor('quick', reduceMotion),
  },

  appear: (reduceMotion = prefersReducedMotion()) => ({
    initial: reduceMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          y: motionStyles.appearY,
          scale: motionStyles.appearScale,
        },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 8, scale: 0.99 },
  }),
} as const
