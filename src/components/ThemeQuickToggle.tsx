import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { interaction } from '@/motion'
import { nextThemeMode, resolveTheme, type ThemeMode } from '@/lib/theme'

export function ThemeQuickToggle({
  mode,
  onChange,
  className,
}: {
  mode: ThemeMode
  onChange: (mode: ThemeMode) => void
  className?: string
}) {
  const resolved = resolveTheme(mode)
  const Icon = mode === 'system' ? Desktop : resolved === 'dark' ? Moon : Sun
  const label =
    mode === 'system'
      ? `Theme system (${resolved})`
      : mode === 'dark'
        ? 'Theme dark'
        : 'Theme light'

  return (
    <motion.button
      type="button"
      aria-label={`${label}. Click to cycle.`}
      title={`${label} — click to cycle`}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-cc-full bg-cc-surface text-cc-ink-secondary shadow-cc-surface ring-1 ring-cc-hairline hover:text-cc-ink',
        className,
      )}
      whileTap={interaction.press.whileTap}
      transition={interaction.press.transition()}
      onClick={() => onChange(nextThemeMode(mode))}
    >
      <Icon size={18} weight="light" />
    </motion.button>
  )
}
