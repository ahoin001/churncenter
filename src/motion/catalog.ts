/** Clearwater motion catalog — only place spring numbers live. */

export type SpringSpec = {
  type: 'spring'
  response: number
  damping: number
  mass?: number
}

export type EaseSpec = {
  type: 'tween'
  duration: number
  ease: number[] | 'easeOut' | 'easeInOut'
}

export type MotionStyleName =
  | 'quick'
  | 'snap'
  | 'content'
  | 'gentle'
  | 'sheet'
  | 'number'
  | 'celebrate'
  | 'ease'

export const motionCatalog = {
  springs: {
    quick: { type: 'spring', response: 0.2, damping: 0.78 } satisfies SpringSpec,
    snap: { type: 'spring', response: 0.26, damping: 0.84 } satisfies SpringSpec,
    content: { type: 'spring', response: 0.5, damping: 0.86 } satisfies SpringSpec,
    gentle: { type: 'spring', response: 0.52, damping: 0.9 } satisfies SpringSpec,
    sheet: { type: 'spring', response: 0.48, damping: 0.84 } satisfies SpringSpec,
    number: { type: 'spring', response: 0.34, damping: 0.84 } satisfies SpringSpec,
    celebrate: { type: 'spring', response: 0.48, damping: 0.58 } satisfies SpringSpec,
  },
  tweens: {
    ease: {
      type: 'tween',
      duration: 0.16,
      ease: [0.22, 1, 0.36, 1],
    } satisfies EaseSpec,
    reduceMotion: {
      type: 'tween',
      duration: 0.16,
      ease: 'easeInOut',
    } satisfies EaseSpec,
    breath: {
      type: 'tween',
      duration: 2.2,
      ease: 'easeInOut',
    } satisfies EaseSpec,
    washDrift: {
      type: 'tween',
      duration: 10,
      ease: 'easeInOut',
    } satisfies EaseSpec,
  },
  press: {
    scale: 0.97,
    opacity: 0.88,
  },
  appear: {
    y: 12,
    scale: 0.985,
  },
  staggerDenseMs: 32,
  sheetExitDismissDelayMs: 280,
} as const

export type MotionCatalog = typeof motionCatalog
