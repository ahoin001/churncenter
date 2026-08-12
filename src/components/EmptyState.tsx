import type { ReactNode } from 'react'
import { Surface } from './Surface'
import { Button } from './Button'

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <Surface className="flex flex-col items-start gap-4" elevation="surface" padding="lg">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-cc-md bg-cc-accent-soft text-cc-accent-ink">
          {icon}
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="cc-title">{title}</h2>
        <p className="cc-body max-w-md text-cc-ink-secondary">{body}</p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </Surface>
  )
}
