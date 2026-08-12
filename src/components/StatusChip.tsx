import { cn } from '@/lib/cn'

type StatusTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger'

const tones: Record<StatusTone, string> = {
  neutral: 'bg-cc-bg-soft text-cc-ink-secondary',
  accent: 'bg-cc-accent-soft text-cc-accent-ink',
  success: 'bg-cc-success-soft text-cc-accent-ink',
  warn: 'bg-cc-warn-soft text-cc-warn',
  danger: 'bg-cc-danger-soft text-cc-danger',
}

export function StatusChip({
  label,
  tone = 'neutral',
  className,
}: {
  label: string
  tone?: StatusTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-cc-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
