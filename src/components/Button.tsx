import { forwardRef, type ReactNode, type MouseEventHandler } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { interaction } from '@/motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  children?: ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

const variants: Record<Variant, string> = {
  primary: 'bg-cc-ink text-cc-on-ink hover:bg-cc-ink/90 disabled:bg-cc-ink/40 disabled:text-cc-on-ink/70',
  secondary: 'bg-cc-accent-soft text-cc-accent-ink hover:bg-cc-accent-soft/80',
  ghost: 'bg-transparent text-cc-ink-secondary hover:bg-cc-bg-soft',
  danger: 'bg-cc-danger-soft text-cc-danger hover:bg-cc-danger-soft/80',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-cc-full gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] rounded-cc-full gap-2',
  lg: 'h-12 px-6 text-base rounded-cc-full gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      leadingIcon,
      trailingIcon,
      children,
      type = 'button',
      disabled,
      onClick,
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        )}
        whileTap={disabled ? undefined : interaction.press.whileTap}
        transition={interaction.press.transition()}
      >
        {leadingIcon}
        <span>{children}</span>
        {trailingIcon ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cc-on-ink/15">
            {trailingIcon}
          </span>
        ) : null}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
