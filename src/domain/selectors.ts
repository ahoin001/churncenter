import { differenceInCalendarDays, parseISO, isValid } from 'date-fns'
import type { AppData, Enrollment, Requirement } from './types'
import { isActiveStatus } from './status'
import { requirementProgress } from './requirements'
import { requirementIsAwaitingDependency } from './windows'
import { assessDdFeasibility, isPayProfileReady } from './payProfile'

export type ActionItem = {
  id: string
  enrollmentId: string | null
  offerId?: string
  priority: number
  title: string
  detail: string
  tone: 'calm' | 'nudge' | 'hold'
}

export function selectActiveEnrollments(data: AppData) {
  return data.enrollments.filter((e) => isActiveStatus(e.status))
}

export function selectExpectedBonus(data: AppData) {
  return selectActiveEnrollments(data)
    .filter((e) => !['bonus_posted', 'clawback', 'close_eligible'].includes(e.status))
    .reduce((sum, e) => sum + e.frozenBonusAmount, 0)
}

export function selectCapitalLocked(data: AppData) {
  return selectActiveEnrollments(data).reduce((sum, e) => sum + e.capitalLocked, 0)
}

export function selectRequirementsFor(data: AppData, enrollmentId: string) {
  return data.requirements.filter((r) => r.enrollmentId === enrollmentId)
}

export function selectUnlockingSoon(data: AppData, withinDays = 45) {
  const now = new Date()
  return data.enrollments
    .filter((e) => e.status === 'cooling_down' || e.status === 'closed')
    .map((e) => {
      if (!e.reEligibleAt) return null
      const at = parseISO(e.reEligibleAt)
      if (!isValid(at)) return null
      const days = differenceInCalendarDays(at, now)
      if (days < 0 || days > withinDays) return null
      const institution = data.institutions.find((i) => i.id === e.institutionId)
      return { enrollment: e, days, institutionName: institution?.name ?? 'Bank' }
    })
    .filter(Boolean) as Array<{
    enrollment: Enrollment
    days: number
    institutionName: string
  }>
}

export function buildActionQueue(data: AppData, now = new Date()): ActionItem[] {
  const items: ActionItem[] = []

  for (const enrollment of selectActiveEnrollments(data)) {
    const institution = data.institutions.find((i) => i.id === enrollment.institutionId)
    const name = institution?.name ?? enrollment.frozenTitle
    const reqs = selectRequirementsFor(data, enrollment.id)

    for (const req of reqs) {
      const progress = requirementProgress(req)
      if (progress.isComplete || progress.awaitingDependency) continue
      if (!req.deadlineAt) continue
      const deadline = parseISO(req.deadlineAt)
      if (!isValid(deadline)) continue
      const daysLeft = differenceInCalendarDays(deadline, now)
      if (daysLeft > 14) continue
      items.push({
        id: `req-deadline-${req.id}`,
        enrollmentId: enrollment.id,
        priority: daysLeft <= 5 ? 100 - daysLeft : 72 - daysLeft,
        title: `${name}: ${progress.label}`,
        detail:
          daysLeft < 0
            ? 'Requirement window passed — review terms or dates'
            : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on this step`,
        tone: daysLeft <= 5 ? 'nudge' : 'calm',
      })
    }

    // Fallback: enrollment-level deadline when no per-req deadlines fired
    if (
      enrollment.deadlineAt &&
      !items.some((i) => i.enrollmentId === enrollment.id && i.id.startsWith('req-deadline-'))
    ) {
      const deadline = parseISO(enrollment.deadlineAt)
      if (isValid(deadline)) {
        const daysLeft = differenceInCalendarDays(deadline, now)
        const incomplete = reqs.filter((r) => !requirementProgress(r).isComplete)
        if (daysLeft <= 14 && incomplete.length > 0) {
          const top = incomplete.find((r) => !requirementIsAwaitingDependency(r)) ?? incomplete[0]
          const progress = requirementProgress(top)
          items.push({
            id: `deadline-${enrollment.id}`,
            enrollmentId: enrollment.id,
            priority: daysLeft <= 5 ? 100 - daysLeft : 70 - daysLeft,
            title: `${name}: ${progress.label}`,
            detail:
              daysLeft < 0
                ? 'Deadline passed — review or update dates'
                : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to finish requirements`,
            tone: daysLeft <= 5 ? 'nudge' : 'calm',
          })
        }
      }
    }

    if (enrollment.status === 'clawback' && enrollment.clawbackEndsAt) {
      const end = parseISO(enrollment.clawbackEndsAt)
      if (isValid(end)) {
        const days = differenceInCalendarDays(end, now)
        items.push({
          id: `clawback-${enrollment.id}`,
          enrollmentId: enrollment.id,
          priority: 40,
          title: `${name}: keep account open`,
          detail:
            days <= 0
              ? 'Clawback window should be clear — confirm before closing'
              : `Clawback ends in ${days} day${days === 1 ? '' : 's'}`,
          tone: 'hold',
        })
      }
    }

    if (enrollment.status === 'waiting_bonus' && enrollment.expectedBonusAt) {
      const expected = parseISO(enrollment.expectedBonusAt)
      if (isValid(expected) && differenceInCalendarDays(now, expected) >= 3) {
        items.push({
          id: `late-bonus-${enrollment.id}`,
          enrollmentId: enrollment.id,
          priority: 55,
          title: `${name}: bonus may be late`,
          detail: 'Expected post date has passed — check statements or start a calm follow-up',
          tone: 'calm',
        })
      }
    }

    if (enrollment.status === 'meeting_requirements' || enrollment.status === 'funding') {
      for (const req of reqs) {
        const p = requirementProgress(req)
        if (!p.isComplete && !p.awaitingDependency && p.ratio > 0) {
          items.push({
            id: `req-${req.id}`,
            enrollmentId: enrollment.id,
            priority: 30 + Math.round(p.ratio * 10),
            title: `${name}: ${p.label}`,
            detail: 'Steady progress — keep using your planned path',
            tone: 'calm',
          })
        }
      }
    }

    const fees = enrollment.accountConditions
    if (fees?.monthlyFeeKind === 'flat_monthly') {
      items.push({
        id: `fee-flat-${enrollment.id}`,
        enrollmentId: enrollment.id,
        priority: 48,
        title: `${name}: monthly fee active`,
        detail:
          fees.monthlyFeeAmount > 0
            ? `$${fees.monthlyFeeAmount}/mo is not waivable — keep it in net bonus math`
            : 'Flat monthly fee — confirm the amount so you do not leak cash',
        tone: 'nudge',
      })
    } else if (fees?.monthlyFeeKind === 'waivable' && !fees.waiverSatisfied) {
      items.push({
        id: `fee-waive-${enrollment.id}`,
        enrollmentId: enrollment.id,
        priority: 52,
        title: `${name}: waive the monthly fee`,
        detail:
          fees.waiverDetail ||
          (fees.minBalanceToAvoidFee > 0
            ? `Keep at least $${fees.minBalanceToAvoidFee} or complete the waiver action`
            : 'Complete this cycle’s waiver action so the fee does not post'),
        tone: 'nudge',
      })
    } else if (fees?.monthlyFeeKind === 'unknown' || fees?.openingDepositKind === 'unknown') {
      items.push({
        id: `fee-unknown-${enrollment.id}`,
        enrollmentId: enrollment.id,
        priority: 28,
        title: `${name}: set fee conditions`,
        detail: 'Add monthly fee / opening deposit details so nothing sneaks up on you',
        tone: 'calm',
      })
    }

    for (const req of reqs) {
      if (req.type !== 'direct_deposit') continue
      const progress = requirementProgress(req)
      if (progress.isComplete) continue

      if (!isPayProfileReady(data.preferences)) {
        if (!items.some((i) => i.id === `pay-profile-${enrollment.id}`)) {
          items.push({
            id: `pay-profile-${enrollment.id}`,
            enrollmentId: enrollment.id,
            priority: 34,
            title: `${name}: set your pay schedule`,
            detail: 'Profile pay amount + next payday lets us check if this DD window fits',
            tone: 'calm',
          })
        }
        continue
      }

      const feasibility = assessDdFeasibility(data.preferences, req, { asOf: now })
      if (feasibility.status === 'short') {
        items.push({
          id: `dd-short-${req.id}`,
          enrollmentId: enrollment.id,
          priority: 58,
          title: `${name}: DD window may be short`,
          detail: feasibility.summary,
          tone: 'nudge',
        })
      } else if (feasibility.status === 'tight') {
        items.push({
          id: `dd-tight-${req.id}`,
          enrollmentId: enrollment.id,
          priority: 36,
          title: `${name}: DD window is tight`,
          detail: feasibility.summary,
          tone: 'calm',
        })
      }
    }
  }

  for (const watch of data.watchlist) {
    const offer = data.offers.find((o) => o.id === watch.offerId)
    if (!offer?.expiresAt) continue
    const expires = parseISO(offer.expiresAt)
    if (!isValid(expires)) continue
    const daysLeft = differenceInCalendarDays(expires, now)
    if (daysLeft > 45) continue
    const institution = data.institutions.find((i) => i.id === offer.institutionId)
    const name = institution?.name ?? offer.title
    items.push({
      id: `offer-expires-${offer.id}`,
      enrollmentId: null,
      offerId: offer.id,
      priority: daysLeft <= 14 ? 65 - daysLeft : 35 - Math.min(daysLeft, 30),
      title: `${name}: offer expires soon`,
      detail:
        daysLeft < 0
          ? 'Offer expiry passed — remove or confirm terms'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to open under this deal`,
      tone: daysLeft <= 14 ? 'nudge' : 'calm',
    })
  }

  for (const unlock of selectUnlockingSoon(data, 30)) {
    items.push({
      id: `unlock-${unlock.enrollment.id}`,
      enrollmentId: unlock.enrollment.id,
      priority: 20 + (30 - unlock.days),
      title: `${unlock.institutionName} unlocks soon`,
      detail:
        unlock.days === 0
          ? 'Re-eligible today — check your watchlist'
          : `Re-eligible in ${unlock.days} day${unlock.days === 1 ? '' : 's'}`,
      tone: 'calm',
    })
  }

  return items.sort((a, b) => b.priority - a.priority)
}

export function enrollmentCompletion(reqs: Requirement[]) {
  if (reqs.length === 0) return 0
  const sum = reqs.reduce((acc, r) => acc + requirementProgress(r).ratio, 0)
  return sum / reqs.length
}
