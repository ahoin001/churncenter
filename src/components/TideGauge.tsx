import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { interaction } from '@/motion'

type TideGaugeProps = {
  value: number
  label: string
  className?: string
  celebrate?: boolean
}

export function TideGauge({ value, label, className, celebrate }: TideGaugeProps) {
  const reduce = useReducedMotion() ?? false
  const clamped = Math.max(0, Math.min(1, value))

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="cc-caption text-cc-ink-secondary">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-cc-ink">
          {Math.round(clamped * 100)}%
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-cc-full bg-cc-bg-soft ring-1 ring-cc-hairline">
        <motion.div
          className="h-full rounded-cc-full bg-cc-accent"
          initial={false}
          animate={{
            width: `${clamped * 100}%`,
            scale: celebrate && clamped >= 1 && !reduce ? [1, 1.02, 1] : 1,
          }}
          transition={interaction.animation(celebrate ? 'celebrate' : 'number', reduce)}
        />
      </div>
    </div>
  )
}
