import {
  addMonths,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfMonth,
} from 'date-fns'
import type { AppData, Enrollment } from './types'
import { enrollmentCompletion, selectActiveEnrollments, selectExpectedBonus } from './selectors'

export type WinEvent = {
  enrollmentId: string
  institutionName: string
  title: string
  amount: number
  postedAt: string
}

export type TidePoint = {
  /** Month key YYYY-MM */
  key: string
  label: string
  /** Bonus posted this month */
  amount: number
  /** Running lifetime total through this month */
  cumulative: number
}

export type ProjectionPoint = {
  key: string
  label: string
  amount: number
  items: Array<{ enrollmentId: string; name: string; amount: number }>
}

export type ChaseProgressRow = {
  enrollmentId: string
  institutionName: string
  title: string
  bonusAmount: number
  completion: number
  status: Enrollment['status']
}

export type MomentumSnapshot = {
  accrued: number
  winCount: number
  expected: number
  capitalLocked: number
  holdingInClawback: number
  wins: WinEvent[]
  tide: TidePoint[]
  projection: ProjectionPoint[]
  chases: ChaseProgressRow[]
  /** Accrued + still-expected (pipeline, not yet posted) */
  projectedLifetime: number
}

const POSTED_STATUSES = new Set([
  'bonus_posted',
  'clawback',
  'close_eligible',
  'closed',
  'cooling_down',
  're_eligible',
])

export function enrollmentHasPostedBonus(enrollment: Enrollment): boolean {
  if (enrollment.frozenBonusAmount <= 0) return false
  if (enrollment.bonusPostedAt) return true
  return POSTED_STATUSES.has(enrollment.status)
}

function institutionName(data: AppData, institutionId: string) {
  return data.institutions.find((i) => i.id === institutionId)?.name ?? 'Bank'
}

export function selectWinEvents(data: AppData): WinEvent[] {
  return data.enrollments
    .filter(enrollmentHasPostedBonus)
    .map((e) => {
      const postedAt =
        e.bonusPostedAt ??
        e.closedAt ??
        e.updatedAt.slice(0, 10)
      return {
        enrollmentId: e.id,
        institutionName: institutionName(data, e.institutionId),
        title: e.frozenTitle,
        amount: e.frozenBonusAmount,
        postedAt,
      }
    })
    .sort((a, b) => a.postedAt.localeCompare(b.postedAt))
}

export function selectAccruedBonus(data: AppData): number {
  return selectWinEvents(data).reduce((sum, w) => sum + w.amount, 0)
}

export function selectHoldingInClawback(data: AppData): number {
  return data.enrollments
    .filter((e) => e.status === 'clawback')
    .reduce((sum, e) => sum + e.frozenBonusAmount, 0)
}

/** Cumulative monthly tide of posted wins. */
export function buildWinsTide(wins: WinEvent[], now = new Date()): TidePoint[] {
  if (wins.length === 0) return []

  const byMonth = new Map<string, number>()
  for (const win of wins) {
    const d = parseISO(win.postedAt)
    if (!isValid(d)) continue
    const key = format(startOfMonth(d), 'yyyy-MM')
    byMonth.set(key, (byMonth.get(key) ?? 0) + win.amount)
  }

  const keys = [...byMonth.keys()].sort()
  if (keys.length === 0) return []

  // Pad to current month so the tide reaches "now"
  const endKey = format(startOfMonth(now), 'yyyy-MM')
  let cursor = parseISO(`${keys[0]}-01`)
  const end = parseISO(`${endKey}-01`)
  if (isValid(cursor) && isValid(end)) {
    while (format(cursor, 'yyyy-MM') < endKey) {
      cursor = addMonths(cursor, 1)
      const k = format(cursor, 'yyyy-MM')
      if (!byMonth.has(k)) byMonth.set(k, 0)
    }
  }

  const ordered = [...byMonth.keys()].sort()
  let cumulative = 0
  return ordered.map((key) => {
    const amount = byMonth.get(key) ?? 0
    cumulative += amount
    const monthDate = parseISO(`${key}-01`)
    return {
      key,
      label: isValid(monthDate) ? format(monthDate, 'MMM yyyy') : key,
      amount,
      cumulative,
    }
  })
}

const IN_FLIGHT_STATUSES = new Set([
  'researching',
  'applied',
  'opened',
  'funding',
  'meeting_requirements',
  'waiting_bonus',
  'disputed',
])

/** Next few months of expected bonus posts still in the pipeline. */
export function buildBonusProjection(
  data: AppData,
  monthsAhead = 4,
  now = new Date(),
): ProjectionPoint[] {
  const start = startOfMonth(now)
  const buckets = new Map<string, ProjectionPoint>()

  for (let i = 0; i < monthsAhead; i++) {
    const month = addMonths(start, i)
    const key = format(month, 'yyyy-MM')
    buckets.set(key, {
      key,
      label: format(month, 'MMM'),
      amount: 0,
      items: [],
    })
  }

  for (const enrollment of selectActiveEnrollments(data)) {
    if (!IN_FLIGHT_STATUSES.has(enrollment.status)) continue
    if (enrollmentHasPostedBonus(enrollment)) continue
    if (!enrollment.expectedBonusAt) continue

    const at = parseISO(enrollment.expectedBonusAt)
    if (!isValid(at)) continue
    const key = format(startOfMonth(at), 'yyyy-MM')
    const bucket = buckets.get(key)
    if (!bucket) continue

    bucket.amount += enrollment.frozenBonusAmount
    bucket.items.push({
      enrollmentId: enrollment.id,
      name: institutionName(data, enrollment.institutionId),
      amount: enrollment.frozenBonusAmount,
    })
  }

  return [...buckets.values()]
}

export function selectChaseProgress(data: AppData): ChaseProgressRow[] {
  return selectActiveEnrollments(data)
    .filter((e) => IN_FLIGHT_STATUSES.has(e.status))
    .map((e) => {
      const reqs = data.requirements.filter((r) => r.enrollmentId === e.id)
      return {
        enrollmentId: e.id,
        institutionName: institutionName(data, e.institutionId),
        title: e.frozenTitle,
        bonusAmount: e.frozenBonusAmount,
        completion: enrollmentCompletion(reqs),
        status: e.status,
      }
    })
    .sort((a, b) => b.completion - a.completion)
}

export function selectMomentum(data: AppData, now = new Date()): MomentumSnapshot {
  const wins = selectWinEvents(data)
  const accrued = wins.reduce((sum, w) => sum + w.amount, 0)
  const expected = selectExpectedBonus(data)
  const capitalLocked = selectActiveEnrollments(data).reduce((sum, e) => sum + e.capitalLocked, 0)

  return {
    accrued,
    winCount: wins.length,
    expected,
    capitalLocked,
    holdingInClawback: selectHoldingInClawback(data),
    wins,
    tide: buildWinsTide(wins, now),
    projection: buildBonusProjection(data, 4, now),
    chases: selectChaseProgress(data),
    projectedLifetime: accrued + expected,
  }
}

/** Days until next expected bonus post among active non-posted chases. */
export function selectDaysToNextBonus(data: AppData, now = new Date()): number | null {
  let best: number | null = null
  for (const e of selectActiveEnrollments(data)) {
    if (enrollmentHasPostedBonus(e)) continue
    if (!e.expectedBonusAt) continue
    const at = parseISO(e.expectedBonusAt)
    if (!isValid(at)) continue
    const days = differenceInCalendarDays(at, now)
    if (days < 0) continue
    if (best === null || days < best) best = days
  }
  return best
}
