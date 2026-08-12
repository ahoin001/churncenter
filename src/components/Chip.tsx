import type { ReactNode, MouseEventHandler } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { interaction } from '@/motion'

type ChipProps = {
  selected?: boolean
  leadingIcon?: ReactNode
  children?: ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export function Chip({
  className,
  selected,
  leadingIcon,
  children,
  type = 'button',
  disabled,
  onClick,
}: ChipProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-cc-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition-colors',
        selected
          ? 'bg-cc-ink text-cc-on-ink ring-cc-ink'
          : 'bg-cc-surface text-cc-ink-secondary ring-cc-border hover:bg-cc-bg-soft',
        className,
      )}
      whileTap={disabled ? undefined : interaction.press.whileTap}
      transition={interaction.press.transition()}
    >
      {leadingIcon}
      {children}
    </motion.button>
  )
}
