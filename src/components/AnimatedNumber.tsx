import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

type AnimatedNumberProps = {
  value: number
  className?: string
  format?: (value: number) => string
  duration?: number
}

/** Counts toward target with Clearwater number ease. */
export function AnimatedNumber({
  value,
  className,
  format = (n) => Math.round(n).toLocaleString('en-US'),
  duration = 0.7,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion() ?? false
  const valueRef = useRef(reduce ? value : 0)
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      valueRef.current = value
      setDisplay(value)
      return
    }

    const controls = animate(valueRef.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        valueRef.current = latest
        setDisplay(latest)
      },
    })

    return () => controls.stop()
  }, [value, reduce, duration])

  return <span className={cn('tabular-nums', className)}>{format(display)}</span>
}

type AnimatedMoneyProps = {
  value: number
  className?: string
}

export function AnimatedMoney({ value, className }: AnimatedMoneyProps) {
  return (
    <AnimatedNumber
      value={value}
      className={className}
      format={(n) => formatMoney(n)}
      duration={0.75}
    />
  )
}
