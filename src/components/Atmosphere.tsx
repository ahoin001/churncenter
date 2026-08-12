import { motion, useReducedMotion } from 'motion/react'

/** Full-bleed Clearwater atmosphere — soft washes, no glass. */
export function Atmosphere() {
  const reduce = useReducedMotion() ?? false

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cc-bg"
    >
      <motion.div
        className="absolute -left-24 top-[-10%] h-[55vh] w-[55vh] rounded-full bg-cc-wash-a blur-3xl"
        animate={
          reduce
            ? undefined
            : {
                x: [0, 24, 0],
                y: [0, 16, 0],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 10, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        className="absolute -right-16 bottom-[-5%] h-[50vh] w-[50vh] rounded-full bg-cc-wash-b blur-3xl"
        animate={
          reduce
            ? undefined
            : {
                x: [0, -18, 0],
                y: [0, -12, 0],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 12, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--cc-atmosphere-sheen),_transparent_55%)]" />
    </div>
  )
}
