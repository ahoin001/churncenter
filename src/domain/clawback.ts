import { addDays, formatISO, isValid, parseISO } from 'date-fns'

/** Common bank bonus clawback window — used as a soft default only. */
export const DEFAULT_CLAWBACK_DAYS = 90

export function addCalendarDaysIso(dateIso: string, days: number): string | null {
  const parsed = parseISO(dateIso)
  if (!isValid(parsed)) return null
  return formatISO(addDays(parsed, days), { representation: 'date' })
}

export function defaultClawbackFromBonusDate(
  bonusDateIso: string | null | undefined,
  days: number = DEFAULT_CLAWBACK_DAYS,
): string | null {
  if (!bonusDateIso) return null
  return addCalendarDaysIso(bonusDateIso, days)
}

/**
 * Decide the next clawback date when a bonus date changes.
 * Preserves manual clawback edits; only fills/updates when empty or still on the prior auto default.
 */
export function resolveClawbackAfterBonusChange(args: {
  previousBonusDate: string | null
  nextBonusDate: string | null
  currentClawback: string | null
  clawbackDays?: number
}): string | null | undefined {
  const days = args.clawbackDays ?? DEFAULT_CLAWBACK_DAYS
  const previousAuto = defaultClawbackFromBonusDate(args.previousBonusDate, days)
  const wasAuto =
    !args.currentClawback ||
    (previousAuto !== null && args.currentClawback === previousAuto)

  if (!wasAuto) {
    // Caller should leave clawback untouched
    return undefined
  }

  if (!args.nextBonusDate) {
    // Bonus cleared while clawback was auto — clear with it
    return null
  }

  return defaultClawbackFromBonusDate(args.nextBonusDate, days)
}
