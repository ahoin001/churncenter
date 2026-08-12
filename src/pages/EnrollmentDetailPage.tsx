import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import {
  Button,
  Surface,
  StatusChip,
  TideGauge,
  TextField,
  TextAreaField,
  SelectField,
  RevealText,
  Stagger,
  StaggerItem,
  AnimatedMoney,
  AccountConditionsEditor,
  FeeGlanceChips,
  FeeRiskBanner,
  DdFeasibilityBanner,
} from '@/components'
import { useChurnStore } from '@/data/store'
import { statusLabels, suggestedNext, isActiveStatus } from '@/domain/status'
import type { EnrollmentStatus } from '@/domain/types'
import { requirementProgress } from '@/domain/requirements'
import { selectRequirementsFor } from '@/domain/selectors'
import { formatShortDate } from '@/lib/format'
import { formatWindowSummary } from '@/domain/windows'
import { assessDdFeasibility, suggestOpenDate } from '@/domain/payProfile'

export function EnrollmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = useChurnStore()
  const enrollment = data.enrollments.find((e) => e.id === id)

  if (!enrollment) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className="cc-body">Enrollment not found.</p>
        <Button variant="secondary" onClick={() => navigate('/active')}>
          Back to active
        </Button>
      </div>
    )
  }

  const institution = data.institutions.find((i) => i.id === enrollment.institutionId)
  const reqs = selectRequirementsFor(data, enrollment.id)
  const next = suggestedNext[enrollment.status]
  const activities = data.activities
    .filter((a) => a.enrollmentId === enrollment.id)
    .sort((a, b) => b.at.localeCompare(a.at))
  const active = isActiveStatus(enrollment.status)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/active"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cc-ink-secondary"
      >
        <ArrowLeft size={16} weight="light" /> Active
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <RevealText as="h1" className="cc-display">
              {institution?.name ?? 'Bank'}
            </RevealText>
            <RevealText as="p" className="cc-body mt-2 text-cc-ink-secondary" delay={0.05}>
              {enrollment.frozenTitle}
            </RevealText>
          </div>
          <StatusChip label={statusLabels[enrollment.status]} tone="accent" />
        </div>
        <p className="cc-numeric-hero text-cc-accent-ink">
          <AnimatedMoney value={enrollment.frozenBonusAmount} />
        </p>
        <FeeGlanceChips conditions={enrollment.accountConditions} />
        <FeeRiskBanner conditions={enrollment.accountConditions} />
      </header>

      <Surface className="grid gap-4 sm:grid-cols-2" padding="lg">
        <div>
          <p className="cc-caption">Opened</p>
          <p className="font-semibold">{formatShortDate(enrollment.openedAt)}</p>
        </div>
        <div>
          <p className="cc-caption">Deadline</p>
          <p className="font-semibold">{formatShortDate(enrollment.deadlineAt)}</p>
        </div>
        <div>
          <p className="cc-caption">Expected bonus</p>
          <p className="font-semibold">{formatShortDate(enrollment.expectedBonusAt)}</p>
        </div>
        <div>
          <p className="cc-caption">Capital locked</p>
          <p className="font-semibold">
            <AnimatedMoney value={enrollment.capitalLocked} />
          </p>
        </div>
      </Surface>

      <section className="space-y-3">
        <RevealText as="h2" className="cc-title">
          Requirements
        </RevealText>
        {reqs.length === 0 ? (
          <Surface>
            <p className="cc-body text-cc-muted">No typed requirements on this enrollment.</p>
          </Surface>
        ) : (
          <Stagger className="space-y-3" delayChildren={0.08}>
            {reqs.map((req) => {
              const progress = requirementProgress(req)
              const windowLabel = formatWindowSummary(req)
              return (
                <StaggerItem key={req.id}>
                  <Surface className="space-y-4">
                    <div className="space-y-1">
                      <TideGauge
                        value={progress.ratio}
                        label={progress.label}
                        celebrate={progress.isComplete}
                      />
                      {windowLabel ? (
                        <p className="cc-caption">{windowLabel}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-3 cc-caption">
                        {req.startsAt ? (
                          <span>Starts {formatShortDate(req.startsAt)}</span>
                        ) : null}
                        {req.deadlineAt ? (
                          <span>Due {formatShortDate(req.deadlineAt)}</span>
                        ) : null}
                        {req.targetAmount > 0 && req.type === 'balance_days' ? (
                          <span>Min balance ${req.targetAmount.toLocaleString('en-US')}</span>
                        ) : null}
                      </div>
                    </div>
                    {req.type === 'direct_deposit' && !progress.isComplete
                      ? (() => {
                          const feasibility = assessDdFeasibility(data.preferences, req)
                          const suggestion =
                            (feasibility.status === 'short' ||
                              feasibility.status === 'unknown') &&
                            req.windowDays > 0 &&
                            req.targetAmount > 0
                              ? suggestOpenDate(
                                  data.preferences,
                                  Math.max(0, req.targetAmount - req.currentAmount),
                                  req.windowDays,
                                )
                              : null
                          return (
                            <DdFeasibilityBanner
                              feasibility={feasibility}
                              suggestion={suggestion}
                            />
                          )
                        })()
                      : null}
                    {progress.awaitingDependency ? (
                      <p className="cc-body text-cc-muted">
                        This step unlocks when the prior requirement is complete.
                      </p>
                    ) : (
                      <>
                        {req.targetAmount > 0 ? (
                          <div className="flex flex-wrap items-end gap-3">
                            <TextField
                              label={
                                req.type === 'balance_days'
                                  ? 'Balance held $'
                                  : 'Logged amount'
                              }
                              type="number"
                              min={0}
                              defaultValue={req.currentAmount}
                              onBlur={(e) => {
                                const value = Number(e.target.value)
                                if (Number.isFinite(value)) {
                                  data.updateRequirementProgress(req.id, {
                                    currentAmount: value,
                                  })
                                  data.addActivity({
                                    enrollmentId: enrollment.id,
                                    requirementId: req.id,
                                    kind: 'progress',
                                    amount: value,
                                    label: `Updated ${req.label} to $${value}`,
                                    at: new Date().toISOString().slice(0, 10),
                                  })
                                }
                              }}
                            />
                          </div>
                        ) : null}
                        {req.targetDays > 0 ? (
                          <TextField
                            label="Days logged"
                            type="number"
                            min={0}
                            defaultValue={req.currentDays}
                            onBlur={(e) => {
                              const value = Number(e.target.value)
                              if (Number.isFinite(value)) {
                                data.updateRequirementProgress(req.id, {
                                  currentDays: value,
                                })
                              }
                            }}
                          />
                        ) : null}
                      </>
                    )}
                  </Surface>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </section>

      <section className="space-y-3">
        <RevealText as="h2" className="cc-title">
          Account fees & conditions
        </RevealText>
        <Surface className="space-y-4" padding="lg">
          <p className="cc-caption">
            Track monthly fees, opening deposits, and waiver actions so the bonus stays net
            positive.
          </p>
          <AccountConditionsEditor
            value={enrollment.accountConditions}
            onChange={(accountConditions) =>
              data.updateEnrollment(enrollment.id, { accountConditions })
            }
          />
        </Surface>
      </section>

      <section className="space-y-3">
        <RevealText as="h2" className="cc-title">
          Status & dates
        </RevealText>
        <Surface className="space-y-4">
          <SelectField
            label="Status"
            value={enrollment.status}
            onChange={(e) =>
              data.setEnrollmentStatus(enrollment.id, e.target.value as EnrollmentStatus)
            }
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Deadline"
              type="date"
              value={enrollment.deadlineAt ?? ''}
              onChange={(e) =>
                data.updateEnrollment(enrollment.id, {
                  deadlineAt: e.target.value || null,
                })
              }
            />
            <TextField
              label="Expected bonus date"
              type="date"
              value={enrollment.expectedBonusAt ?? ''}
              onChange={(e) =>
                data.updateEnrollment(enrollment.id, {
                  expectedBonusAt: e.target.value || null,
                })
              }
            />
            <TextField
              label="Bonus posted date"
              type="date"
              value={enrollment.bonusPostedAt ?? ''}
              onChange={(e) =>
                data.updateEnrollment(enrollment.id, {
                  bonusPostedAt: e.target.value || null,
                })
              }
            />
            <div className="space-y-1.5">
              <TextField
                label="Clawback ends"
                type="date"
                value={enrollment.clawbackEndsAt ?? ''}
                onChange={(e) =>
                  data.updateEnrollment(enrollment.id, {
                    clawbackEndsAt: e.target.value || null,
                  })
                }
              />
              <p className="cc-caption">
                Auto-fills to {data.preferences.defaultClawbackDays} days after the bonus
                date — change anytime.
              </p>
            </div>
            <TextField
              label="Capital locked"
              type="number"
              value={enrollment.capitalLocked}
              onChange={(e) =>
                data.updateEnrollment(enrollment.id, {
                  capitalLocked: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <TextAreaField
            label="Frozen terms / what counted"
            value={enrollment.frozenTermsNotes}
            onChange={(e) =>
              data.updateEnrollment(enrollment.id, { frozenTermsNotes: e.target.value })
            }
          />
          <TextAreaField
            label="Playbook notes"
            value={enrollment.whatCountedNotes}
            onChange={(e) =>
              data.updateEnrollment(enrollment.id, { whatCountedNotes: e.target.value })
            }
          />
          <div className="flex flex-wrap gap-3">
            {next ? (
              <Button
                variant="secondary"
                onClick={() => data.setEnrollmentStatus(enrollment.id, next)}
              >
                Advance to {statusLabels[next]}
              </Button>
            ) : null}
            {enrollment.status === 'close_eligible' || enrollment.status === 'clawback' ? (
              <Button onClick={() => data.closeEnrollment(enrollment.id)}>
                Close & start cooldown
              </Button>
            ) : null}
            {active ? (
              <Button
                variant="ghost"
                onClick={() => {
                  if (
                    confirm(
                      `Remove ${institution?.name ?? 'this chase'} from active? It will be marked Abandoned.`,
                    )
                  ) {
                    data.abandonEnrollment(enrollment.id)
                    navigate('/active')
                  }
                }}
              >
                Remove from active
              </Button>
            ) : null}
            <Button
              variant="danger"
              onClick={() => {
                if (
                  confirm(
                    'Delete this enrollment forever? Requirements and activity will be removed.',
                  )
                ) {
                  data.removeEnrollment(enrollment.id)
                  navigate('/active')
                }
              }}
            >
              Delete forever
            </Button>
          </div>
        </Surface>
      </section>

      <section className="space-y-3">
        <RevealText as="h2" className="cc-title">
          Activity
        </RevealText>
        <Surface className="space-y-3">
          {activities.length === 0 ? (
            <p className="cc-caption">No activity yet.</p>
          ) : (
            <Stagger className="space-y-2" delayChildren={0.05}>
              {activities.map((a) => (
                <StaggerItem
                  key={a.id}
                  className="flex items-baseline justify-between gap-3 border-b border-cc-hairline pb-2 last:border-0"
                >
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="cc-caption tabular-nums">{formatShortDate(a.at)}</p>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </Surface>
      </section>
    </div>
  )
}
