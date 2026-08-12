import { Link, useNavigate } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import {
  Surface,
  StatusChip,
  TideGauge,
  EmptyState,
  Button,
  RevealText,
  Stagger,
  StaggerItem,
  AnimatedMoney,
  FeeGlanceChips,
} from '@/components'
import { useChurnStore } from '@/data/store'
import { pipelineColumns, statusLabels, isActiveStatus } from '@/domain/status'
import { enrollmentCompletion, selectRequirementsFor } from '@/domain/selectors'
import { formatMoney } from '@/lib/format'
import type { Enrollment } from '@/domain/types'

export function ActivePage() {
  const data = useChurnStore()
  const navigate = useNavigate()
  const active = data.enrollments.filter((e) => isActiveStatus(e.status))

  function removeFromActive(enrollment: Enrollment) {
    const institution = data.institutions.find((i) => i.id === enrollment.institutionId)
    const name = institution?.name ?? enrollment.frozenTitle
    if (
      !confirm(
        `Remove ${name} from active? You can still find it later as Abandoned, or delete it forever from the detail page.`,
      )
    ) {
      return
    }
    data.abandonEnrollment(enrollment.id)
  }

  if (active.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <RevealText as="h1" className="cc-display">
          Active
        </RevealText>
        <EmptyState
          title="No active chases"
          body="Enroll from your watchlist when an offer is ready to chase."
          actionLabel="Go to watchlist"
          onAction={() => navigate('/watch')}
        />
      </div>
    )
  }

  const columns = pipelineColumns().filter((status) =>
    active.some((e) => e.status === status),
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <RevealText as="h1" className="cc-display">
            Active
          </RevealText>
          <RevealText as="p" className="cc-body mt-2 text-cc-ink-secondary" delay={0.05}>
            Desktop board for scanning; tap a card for the full tide.
          </RevealText>
        </div>
        <Link to="/watch">
          <Button variant="secondary" size="sm">
            Enroll from watch
          </Button>
        </Link>
      </div>

      {/* Mobile: stacked cards — no nested AnimatePresence; Stagger owns enter */}
      <Stagger as="ul" className="space-y-3 lg:hidden" delayChildren={0.08}>
        {active.map((enrollment) => {
          const institution = data.institutions.find((i) => i.id === enrollment.institutionId)
          const reqs = selectRequirementsFor(data, enrollment.id)
          const progress = enrollmentCompletion(reqs)
          return (
            <StaggerItem key={enrollment.id} as="li" className="relative">
              <Link to={`/active/${enrollment.id}`} className="block">
                <Surface className="space-y-3 pr-12">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{institution?.name ?? 'Bank'}</p>
                      <p className="cc-caption">{enrollment.frozenTitle}</p>
                    </div>
                    <StatusChip label={statusLabels[enrollment.status]} tone="accent" />
                  </div>
                  <FeeGlanceChips conditions={enrollment.accountConditions} />
                  <TideGauge
                    value={progress}
                    label={`${formatMoney(enrollment.frozenBonusAmount)} bonus`}
                  />
                </Surface>
              </Link>
              <button
                type="button"
                aria-label={`Remove ${institution?.name ?? 'chase'} from active`}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-cc-full bg-cc-bg-soft text-cc-muted ring-1 ring-cc-hairline hover:text-cc-danger"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeFromActive(enrollment)
                }}
              >
                <X size={16} weight="bold" />
              </button>
            </StaggerItem>
          )
        })}
      </Stagger>

      {/* Desktop: columns */}
      <Stagger className="hidden gap-4 overflow-x-auto pb-4 lg:flex" delayChildren={0.08}>
        {columns.map((status) => {
          const cards = active.filter((e) => e.status === status)
          return (
            <StaggerItem key={status} className="w-72 shrink-0 space-y-3">
              <p className="cc-micro px-1">{statusLabels[status]}</p>
              {cards.map((enrollment) => {
                const institution = data.institutions.find(
                  (i) => i.id === enrollment.institutionId,
                )
                const reqs = selectRequirementsFor(data, enrollment.id)
                const progress = enrollmentCompletion(reqs)
                return (
                  <div key={enrollment.id} className="relative">
                    <Link to={`/active/${enrollment.id}`} className="block">
                      <Surface className="space-y-3 hover:shadow-cc-raised" padding="md">
                        <div className="flex items-start justify-between gap-2 pr-8">
                          <div>
                            <p className="font-semibold">{institution?.name ?? 'Bank'}</p>
                            <p className="cc-caption line-clamp-2">{enrollment.frozenTitle}</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold">
                          <AnimatedMoney value={enrollment.frozenBonusAmount} />
                        </p>
                        <FeeGlanceChips conditions={enrollment.accountConditions} />
                        <TideGauge value={progress} label="Requirements" />
                      </Surface>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Remove ${institution?.name ?? 'chase'} from active`}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-cc-full bg-cc-bg-soft text-cc-muted ring-1 ring-cc-hairline hover:text-cc-danger"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeFromActive(enrollment)
                      }}
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                )
              })}
            </StaggerItem>
          )
        })}
      </Stagger>
    </div>
  )
}
