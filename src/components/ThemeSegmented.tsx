import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { interaction } from '@/motion'
import type { ThemeMode } from '@/lib/theme'

const options: Array<{
  value: ThemeMode
  label: string
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Desktop },
]

export function ThemeSegmented({
  value,
  onChange,
  className,
}: {
  value: ThemeMode
  onChange: (mode: ThemeMode) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        'grid grid-cols-3 gap-1 rounded-cc-full bg-cc-bg-soft p-1 ring-1 ring-cc-hairline',
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <motion.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-cc-full px-3 py-2 text-sm font-semibold transition-colors',
              selected
                ? 'bg-cc-surface text-cc-ink shadow-cc-surface'
                : 'text-cc-muted hover:text-cc-ink',
            )}
            whileTap={interaction.press.whileTap}
            transition={interaction.press.transition()}
            onClick={() => onChange(option.value)}
          >
            <Icon size={16} weight="light" />
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}
