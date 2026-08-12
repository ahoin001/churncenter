import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  formatISO,
  isValid,
  parseISO,
} from 'date-fns'
import type { PayFrequency, Preferences, Requirement } from './types'
import { formatMoney } from '@/lib/format'

export type PayProfileSlice = Pick<
  Preferences,
  'payNetAmount' | 'payFrequency' | 'nextPayday'
>

export type DdFeasibilityStatus = 'unknown' | 'on_track' | 'tight' | 'short'

export type DdFeasibility = {
  status: DdFeasibilityStatus
  capacity: number
  remaining: number
  paydaysInWindow: string[]
  shortfall: number
  summary: string
}

export type OpenDateSuggestion = {
  openOn: string
  firstPayday: string
  paydayCount: number
  capacity: number
  reason: string
}

const FREQUENCY_LABELS: Record<Exclude<PayFrequency, 'unknown'>, string> = {
  weekly: 'every week',
  biweekly: 'every 2 weeks',
  semimonthly: 'twice a month',
  monthly: 'every month',
}

export function isPayProfileReady(prefs: PayProfileSlice): boolean {
  if (!(prefs.payNetAmount > 0)) return false
  if (prefs.payFrequency === 'unknown') return false
  if (!prefs.nextPayday) return false
  const d = parseISO(prefs.nextPayday)
  return isValid(d)
}

export function payFrequencyLabel(frequency: PayFrequency): string {
  if (frequency === 'unknown') return 'not set'
  return FREQUENCY_LABELS[frequency]
}

function toDateOnly(d: Date): string {
  return formatISO(d, { representation: 'date' })
}

function parseDateOnly(iso: string): Date | null {
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

/** Inclusive calendar window: payday counts if startsAt <= payday <= deadlineAt. */
export function enumeratePaydays(
  nextPayday: string,
  frequency: Exclude<PayFrequency, 'unknown'>,
  fromIso: string,
  toIso: string,
): string[] {
  const anchor = parseDateOnly(nextPayday)
  const from = parseDateOnly(fromIso)
  const to = parseDateOnly(toIso)
  if (!anchor || !from || !to) return []
  if (differenceInCalendarDays(to, from) < 0) return []

  let cursor = anchor
  let guard = 0
  while (differenceInCalendarDays(cursor, from) > 0 && guard < 400) {
    cursor = stepPaydayBack(cursor, frequency)
    guard += 1
  }
  while (differenceInCalendarDays(from, cursor) > 0 && guard < 800) {
    cursor = stepPaydayForward(cursor, frequency)
    guard += 1
  }

  const out: string[] = []
  guard = 0
  while (differenceInCalendarDays(to, cursor) >= 0 && guard < 400) {
    if (differenceInCalendarDays(cursor, from) >= 0) {
      out.push(toDateOnly(cursor))
    }
    cursor = stepPaydayForward(cursor, frequency)
    guard += 1
  }
  return out
}

function stepPaydayForward(d: Date, frequency: Exclude<PayFrequency, 'unknown'>): Date {
  switch (frequency) {
    case 'weekly':
      return addDays(d, 7)
    case 'biweekly':
      return addDays(d, 14)
    case 'semimonthly':
      return addDays(d, 15)
    case 'monthly':
      return addMonths(d, 1)
  }
}

function stepPaydayBack(d: Date, frequency: Exclude<PayFrequency, 'unknown'>): Date {
  switch (frequency) {
    case 'weekly':
      return addDays(d, -7)
    case 'biweekly':
      return addDays(d, -14)
    case 'semimonthly':
      return addDays(d, -15)
    case 'monthly':
      return addMonths(d, -1)
  }
}

export function capacityInWindow(
  prefs: PayProfileSlice,
  startsAt: string,
  deadlineAt: string,
): { capacity: number; paydays: string[] } {
  if (!isPayProfileReady(prefs) || prefs.payFrequency === 'unknown' || !prefs.nextPayday) {
    return { capacity: 0, paydays: [] }
  }
  const paydays = enumeratePaydays(prefs.nextPayday, prefs.payFrequency, startsAt, deadlineAt)
  return { capacity: paydays.length * prefs.payNetAmount, paydays }
}

export function assessDdFeasibility(
  prefs: PayProfileSlice,
  requirement: Pick<
    Requirement,
    'type' | 'targetAmount' | 'currentAmount' | 'windowDays' | 'startsAt' | 'deadlineAt'
  >,
  opts?: { asOf?: Date },
): DdFeasibility {
  const remaining = Math.max(0, requirement.targetAmount - requirement.currentAmount)
  const empty: DdFeasibility = {
    status: 'unknown',
    capacity: 0,
    remaining,
    paydaysInWindow: [],
    shortfall: remaining,
    summary: 'Set your pay schedule on Profile so we can check this DD window.',
  }

  if (requirement.type !== 'direct_deposit' || requirement.targetAmount <= 0) {
    return {
      ...empty,
      summary: 'Feasibility applies to amount-based direct deposit requirements.',
    }
  }

  if (!isPayProfileReady(prefs)) return empty

  const asOf = opts?.asOf ?? new Date()
  const asOfIso = toDateOnly(asOf)

  let startsAt = requirement.startsAt
  let deadlineAt = requirement.deadlineAt

  if (!startsAt || !deadlineAt) {
    const windowDays = Math.max(0, requirement.windowDays)
    if (windowDays <= 0) {
      return {
        ...empty,
        summary: 'Add a window length (days) so we can compare paychecks to the deadline.',
      }
    }
    startsAt = asOfIso
    deadlineAt = toDateOnly(addDays(asOf, windowDays))
  }

  const { capacity, paydays } = capacityInWindow(prefs, startsAt, deadlineAt)
  const shortfall = Math.max(0, remaining - capacity)

  if (remaining <= 0) {
    return {
      status: 'on_track',
      capacity,
      remaining: 0,
      paydaysInWindow: paydays,
      shortfall: 0,
      summary: 'Direct deposit amount already logged.',
    }
  }

  if (capacity < remaining) {
    return {
      status: 'short',
      capacity,
      remaining,
      paydaysInWindow: paydays,
      shortfall,
      summary: `About ${formatMoney(capacity)} can land from ${paydays.length} paycheck${paydays.length === 1 ? '' : 's'} in this window — short of ${formatMoney(remaining)}.`,
    }
  }

  const slack = capacity - remaining
  if (slack <= prefs.payNetAmount) {
    return {
      status: 'tight',
      capacity,
      remaining,
      paydaysInWindow: paydays,
      shortfall: 0,
      summary: `You should be able to hit ${formatMoney(remaining)} with ${paydays.length} paycheck${paydays.length === 1 ? '' : 's'} (${formatMoney(capacity)} capacity) — little room to miss one.`,
    }
  }

  return {
    status: 'on_track',
    capacity,
    remaining,
    paydaysInWindow: paydays,
    shortfall: 0,
    summary: `You should be able to deposit about ${formatMoney(remaining)} in this window — roughly ${formatMoney(capacity)} across ${paydays.length} paycheck${paydays.length === 1 ? '' : 's'}.`,
  }
}

/**
 * Earliest open date (from `fromDate`) where enough paychecks land in
 * [open, open+windowDays], preferring the first payday as early in the window as possible.
 */
export function suggestOpenDate(
  prefs: PayProfileSlice,
  targetAmount: number,
  windowDays: number,
  fromDate: Date = new Date(),
): OpenDateSuggestion | null {
  if (!isPayProfileReady(prefs) || prefs.payFrequency === 'unknown' || !prefs.nextPayday) {
    return null
  }
  if (!(targetAmount > 0) || !(windowDays > 0)) return null

  const searchHorizon = 60
  let best: (OpenDateSuggestion & { firstPaydayOffset: number; openOffset: number }) | null =
    null

  for (let offset = 0; offset <= searchHorizon; offset++) {
    const open = addDays(fromDate, offset)
    const openOn = toDateOnly(open)
    const deadlineAt = toDateOnly(addDays(open, windowDays))
    const { capacity, paydays } = capacityInWindow(prefs, openOn, deadlineAt)
    if (capacity < targetAmount || paydays.length === 0) continue

    const firstPayday = paydays[0]!
    const firstPaydayOffset = differenceInCalendarDays(parseISO(firstPayday), open)
    const candidate = {
      openOn,
      firstPayday,
      paydayCount: paydays.length,
      capacity,
      firstPaydayOffset,
      openOffset: offset,
      reason: `Open on ${format(open, 'MMM d')} so your first paycheck (${format(parseISO(firstPayday), 'MMM d')}) lands early — ${paydays.length} deposit${paydays.length === 1 ? '' : 's'} (~${formatMoney(capacity)}) fit the ${windowDays}-day window.`,
    }

    if (
      !best ||
      candidate.firstPaydayOffset < best.firstPaydayOffset ||
      (candidate.firstPaydayOffset === best.firstPaydayOffset &&
        candidate.openOffset < best.openOffset)
    ) {
      best = candidate
    }
  }

  if (!best) return null
  return {
    openOn: best.openOn,
    firstPayday: best.firstPayday,
    paydayCount: best.paydayCount,
    capacity: best.capacity,
    reason: best.reason,
  }
}

export function describePayProfile(prefs: PayProfileSlice): string {
  if (!isPayProfileReady(prefs) || !prefs.nextPayday) {
    return 'Pay schedule not set yet.'
  }
  return `About ${formatMoney(prefs.payNetAmount)} ${payFrequencyLabel(prefs.payFrequency)} · next deposit ${format(parseISO(prefs.nextPayday), 'MMM d, yyyy')}`
}
