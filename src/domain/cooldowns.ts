import { addMonths, formatISO, parseISO, isValid, isBefore } from 'date-fns'

export function computeReEligibleAt(closedAt: string, cooldownMonths: number): string {
  const closed = parseISO(closedAt)
  if (!isValid(closed)) return closedAt
  return formatISO(addMonths(closed, cooldownMonths), { representation: 'date' })
}

export function cooldownState(reEligibleAt: string | null, now = new Date()) {
  if (!reEligibleAt) {
    return { kind: 'unknown' as const, daysRemaining: null }
  }
  const unlock = parseISO(reEligibleAt)
  if (!isValid(unlock)) {
    return { kind: 'unknown' as const, daysRemaining: null }
  }
  if (isBefore(now, unlock)) {
    const days = Math.ceil((unlock.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { kind: 'cooling' as const, daysRemaining: days }
  }
  return { kind: 're_eligible' as const, daysRemaining: 0 }
}
