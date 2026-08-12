import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { interaction } from '@/motion'

type PageRevealProps = {
  children: ReactNode
  className?: string
}

/** Soft page accent — visible immediately; motion is additive, never opacity-gated. */
export function PageReveal({ children, className }: PageRevealProps) {
  const reduce = useReducedMotion() ?? false
  if (reduce) {
    return <div className={cn(className)}>{children}</div>
  }
  return (
    <motion.div
      className={cn(className)}
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={interaction.animation('content', false)}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'ol' | 'section'
  delayChildren?: number
}

export function Stagger({
  children,
  className,
  as = 'div',
  delayChildren = 0.06,
}: StaggerProps) {
  const reduce = useReducedMotion() ?? false
  const shared = {
    className,
    initial: 'hidden' as const,
    animate: 'show' as const,
    variants: {
      hidden: {},
      show: {
        transition: {
          staggerChildren: reduce ? 0 : 0.032,
          delayChildren: reduce ? 0 : delayChildren,
        },
      },
    },
    children,
  }

  if (as === 'ul') return <motion.ul {...shared} />
  if (as === 'ol') return <motion.ol {...shared} />
  if (as === 'section') return <motion.section {...shared} />
  return <motion.div {...shared} />
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'article'
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: StaggerItemProps) {
  const reduce = useReducedMotion() ?? false
  // Never gate visibility with opacity — a stalled stagger must not blank the page.
  const shared = {
    className,
    variants: {
      hidden: reduce ? {} : { y: 8 },
      show: {
        y: 0,
        transition: interaction.animation('content', reduce),
      },
    },
    children,
  }

  if (as === 'li') return <motion.li {...shared} />
  if (as === 'article') return <motion.article {...shared} />
  return <motion.div {...shared} />
}

type RevealTextProps = {
  as?: 'h1' | 'h2' | 'p' | 'span' | 'div'
  children: ReactNode
  className?: string
  delay?: number
}

/** Soft header/copy accent — y only; always readable. */
export function RevealText({
  as = 'div',
  children,
  className,
  delay = 0,
}: RevealTextProps) {
  const reduce = useReducedMotion() ?? false
  const props = {
    className,
    initial: reduce ? false : { y: 8 },
    animate: { y: 0 },
    transition: {
      ...interaction.animation(reduce ? 'ease' : 'gentle', reduce),
      delay: reduce ? 0 : delay,
    },
    children,
  }

  if (as === 'h1') return <motion.h1 {...props} />
  if (as === 'h2') return <motion.h2 {...props} />
  if (as === 'p') return <motion.p {...props} />
  if (as === 'span') return <motion.span {...props} />
  return <motion.div {...props} />
}
