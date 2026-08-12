import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { DdFeasibility, OpenDateSuggestion } from '@/domain/payProfile'
import { formatShortDate } from '@/lib/format'

type DdFeasibilityBannerProps = {
  feasibility: DdFeasibility
  suggestion?: OpenDateSuggestion | null
  className?: string
  /** When unknown, show link to Profile */
  showProfileLink?: boolean
}

const toneClass: Record<DdFeasibility['status'], string> = {
  unknown: 'bg-cc-bg-soft text-cc-ink-secondary',
  on_track: 'bg-cc-success-soft text-cc-accent-ink',
  tight: 'bg-cc-warn-soft text-cc-ink',
  short: 'bg-cc-danger-soft text-cc-ink',
}

const titleFor: Record<DdFeasibility['status'], string> = {
  unknown: 'Pay schedule needed',
  on_track: 'DD window looks workable',
  tight: 'DD window is tight',
  short: 'May not fit enough paychecks',
}

export function DdFeasibilityBanner({
  feasibility,
  suggestion,
  className,
  showProfileLink = true,
}: DdFeasibilityBannerProps) {
  return (
    <div
      className={cn('space-y-2 rounded-cc-md px-3.5 py-3', toneClass[feasibility.status], className)}
      role="status"
    >
      <p className="text-sm font-semibold">{titleFor[feasibility.status]}</p>
      <p className="cc-caption opacity-95">{feasibility.summary}</p>
      {suggestion ? (
        <p className="cc-caption font-semibold">
          Suggested start: {formatShortDate(suggestion.openOn)} — {suggestion.reason}
        </p>
      ) : null}
      {feasibility.status === 'unknown' && showProfileLink ? (
        <Link to="/profile" className="cc-caption font-semibold underline-offset-2 hover:underline">
          Set pay schedule on Profile
        </Link>
      ) : null}
    </div>
  )
}
