import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  elevation?: 'flat' | 'surface' | 'raised' | 'floating'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const elevClass = {
  flat: 'shadow-none',
  surface: 'shadow-cc-surface',
  raised: 'shadow-cc-raised',
  floating: 'shadow-cc-floating',
} as const

const padClass = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
} as const

export function Surface({
  children,
  className,
  elevation = 'surface',
  padding = 'md',
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-cc-lg bg-cc-surface text-cc-ink ring-1 ring-cc-hairline',
        elevClass[elevation],
        padClass[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
