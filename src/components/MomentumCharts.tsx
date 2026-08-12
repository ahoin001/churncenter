import { useId, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { interaction } from '@/motion'
import type { ChaseProgressRow, ProjectionPoint, TidePoint } from '@/domain/momentum'
import { AnimatedMoney } from './AnimatedNumber'
import { Surface } from './Surface'

type WinsTideChartProps = {
  points: TidePoint[]
  className?: string
}

/** Cumulative posted-bonus tide — soft area geometry, Clearwater mint. */
export function WinsTideChart({ points, className }: WinsTideChartProps) {
  const reduce = useReducedMotion() ?? false
  const uid = useId().replace(/:/g, '')
  const fillId = `tide-fill-${uid}`
  const strokeId = `tide-stroke-${uid}`

  const geometry = useMemo(() => {
    if (points.length === 0) return null
    const w = 640
    const h = 168
    const padX = 8
    const padTop = 18
    const padBottom = 28
    const maxY = Math.max(...points.map((p) => p.cumulative), 1)
    const step = points.length === 1 ? 0 : (w - padX * 2) / (points.length - 1)

    const coords = points.map((p, i) => {
      const x = padX + i * step
      const y = padTop + (1 - p.cumulative / maxY) * (h - padTop - padBottom)
      return { x, y, ...p }
    })

    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ')
    const area = `${line} L ${coords[coords.length - 1]!.x.toFixed(1)} ${h - padBottom} L ${coords[0]!.x.toFixed(1)} ${h - padBottom} Z`

    return { w, h, padBottom, coords, line, area, maxY }
  }, [points])

  if (!geometry) {
    return (
      <div
        className={cn(
          'flex h-40 items-end rounded-cc-md bg-cc-bg-soft/80 px-4 py-3 ring-1 ring-cc-hairline',
          className,
        )}
      >
        <p className="cc-body text-cc-muted">Your tide rises when the first bonus posts.</p>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${geometry.w} ${geometry.h}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label="Cumulative bonus wins over time"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cc-accent)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--cc-accent)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--cc-accent-ink)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--cc-accent)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={8}
            x2={geometry.w - 8}
            y1={18 + (1 - t) * (geometry.h - 18 - geometry.padBottom)}
            y2={18 + (1 - t) * (geometry.h - 18 - geometry.padBottom)}
            stroke="var(--cc-hairline)"
            strokeWidth={1}
          />
        ))}

        <motion.path
          d={geometry.area}
          fill={`url(#${fillId})`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={interaction.animation('gentle', reduce)}
        />
        <motion.path
          d={geometry.line}
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ ...interaction.animation('number', reduce), duration: reduce ? 0 : 1.1 }}
        />

        {geometry.coords.map((c) =>
          c.amount > 0 ? (
            <motion.circle
              key={c.key}
              cx={c.x}
              cy={c.y}
              r={4.5}
              fill="var(--cc-surface)"
              stroke="var(--cc-accent)"
              strokeWidth={2}
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={interaction.animation('snap', reduce)}
            />
          ) : null,
        )}

        {geometry.coords
          .filter((_, i, arr) => i === 0 || i === arr.length - 1 || arr[i]!.amount > 0)
          .map((c) => (
            <text
              key={`lbl-${c.key}`}
              x={c.x}
              y={geometry.h - 8}
              textAnchor="middle"
              className="fill-cc-muted"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {c.label.split(' ')[0]}
            </text>
          ))}
      </svg>
    </div>
  )
}

type ProjectionChartProps = {
  points: ProjectionPoint[]
  className?: string
}

/** Soft monthly bars for bonuses still expected to post. */
export function ProjectionChart({ points, className }: ProjectionChartProps) {
  const reduce = useReducedMotion() ?? false
  const max = Math.max(...points.map((p) => p.amount), 1)
  const total = points.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="cc-title">Coming ashore</p>
          <p className="cc-caption mt-1 text-cc-ink-secondary">
            Expected posts over the next few months
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums text-cc-accent-ink">
          <AnimatedMoney value={total} />
        </p>
      </div>

      <div className="flex h-40 items-end gap-3 sm:gap-4">
        {points.map((point, index) => {
          const height = point.amount > 0 ? Math.max(12, (point.amount / max) * 100) : 4
          const detail =
            point.items.length === 0
              ? 'Quiet month'
              : point.items.map((i) => `${i.name} ${formatMoney(i.amount)}`).join(' · ')

          return (
            <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <p className="cc-micro tabular-nums text-cc-ink-secondary">
                {point.amount > 0 ? formatMoney(point.amount) : '—'}
              </p>
              <div className="flex h-28 w-full items-end justify-center">
                <motion.div
                  className={cn(
                    'w-full max-w-[3.25rem] origin-bottom rounded-t-cc-md',
                    point.amount > 0 ? 'bg-cc-accent' : 'bg-cc-bg-soft ring-1 ring-cc-hairline',
                  )}
                  title={detail}
                  initial={reduce ? false : { scaleY: 0, opacity: 0.5 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    ...interaction.animation('number', reduce),
                    delay: reduce ? 0 : index * 0.06,
                  }}
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="cc-caption font-semibold text-cc-ink">{point.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type ChaseProgressChartProps = {
  chases: ChaseProgressRow[]
  className?: string
}

/** Named requirement progress lanes — why the work still matters. */
export function ChaseProgressChart({ chases, className }: ChaseProgressChartProps) {
  const reduce = useReducedMotion() ?? false

  if (chases.length === 0) {
    return (
      <Surface className={className}>
        <p className="cc-title">Active tides</p>
        <p className="cc-body mt-2 text-cc-ink-secondary">
          No open chases right now. Watch for the next unlock, or pick something from Watch.
        </p>
      </Surface>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <p className="cc-title">Active tides</p>
        <p className="cc-caption mt-1 text-cc-ink-secondary">
          Requirement progress toward each bonus
        </p>
      </div>

      <ul className="space-y-4">
        {chases.map((chase, index) => {
          const pct = Math.round(Math.max(0, Math.min(1, chase.completion)) * 100)
          return (
            <li key={chase.enrollmentId}>
              <Link
                to={`/active/${chase.enrollmentId}`}
                className="group block space-y-2 rounded-cc-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cc-accent"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-cc-ink group-hover:text-cc-accent-ink">
                      {chase.institutionName}
                    </p>
                    <p className="cc-caption truncate">{chase.title}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-cc-accent-ink">
                    {formatMoney(chase.bonusAmount)}
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-cc-full bg-cc-bg-soft ring-1 ring-cc-hairline">
                  <motion.div
                    className="h-full rounded-cc-full bg-cc-accent"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      ...interaction.animation('number', reduce),
                      delay: reduce ? 0 : 0.08 + index * 0.05,
                    }}
                  />
                </div>
                <p className="cc-micro tabular-nums text-cc-muted">{pct}% of requirements</p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
