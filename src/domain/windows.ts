import { addDays, formatISO, isValid, parseISO } from 'date-fns'
import type {
  OfferRequirementBlueprint,
  Requirement,
  RequirementWindowAnchor,
} from './types'

export function toDateOnlyIso(dateIso: string): string | null {
  const parsed = parseISO(dateIso)
  if (!isValid(parsed)) return null
  return formatISO(parsed, { representation: 'date' })
}

export function addCalendarDaysIso(dateIso: string, days: number): string | null {
  const parsed = parseISO(dateIso)
  if (!isValid(parsed)) return null
  return formatISO(addDays(parsed, days), { representation: 'date' })
}

export function normalizeWindowAnchor(
  value: unknown,
): RequirementWindowAnchor {
  if (value === 'open' || value === 'absolute' || value === 'after_previous') {
    return value
  }
  return 'open'
}

/** Hold / wait duration used when a dependent window has no explicit windowDays. */
export function effectiveWindowDays(req: {
  windowDays?: number
  targetDays?: number
  type?: string
}): number {
  if (typeof req.windowDays === 'number' && req.windowDays > 0) return req.windowDays
  if (
    (req.type === 'balance_days' || req.type === 'wait') &&
    typeof req.targetDays === 'number' &&
    req.targetDays > 0
  ) {
    return req.targetDays
  }
  return 0
}

export function scheduleFromAnchor(args: {
  anchor: RequirementWindowAnchor
  openedAt: string | null
  windowDays: number
  absoluteDeadlineAt?: string | null
  previousCompletedAt?: string | null
}): { startsAt: string | null; deadlineAt: string | null } {
  const windowDays = Math.max(0, args.windowDays)

  if (args.anchor === 'absolute') {
    const deadline = args.absoluteDeadlineAt
      ? toDateOnlyIso(args.absoluteDeadlineAt)
      : null
    return { startsAt: args.openedAt ? toDateOnlyIso(args.openedAt) : null, deadlineAt: deadline }
  }

  if (args.anchor === 'after_previous') {
    const start = args.previousCompletedAt
      ? toDateOnlyIso(args.previousCompletedAt)
      : null
    if (!start) return { startsAt: null, deadlineAt: null }
    return {
      startsAt: start,
      deadlineAt: windowDays > 0 ? addCalendarDaysIso(start, windowDays) : null,
    }
  }

  // open
  const start = args.openedAt ? toDateOnlyIso(args.openedAt) : null
  if (!start) return { startsAt: null, deadlineAt: null }
  return {
    startsAt: start,
    deadlineAt: windowDays > 0 ? addCalendarDaysIso(start, windowDays) : null,
  }
}

export type MaterializedRequirement = Omit<
  Requirement,
  'currentAmount' | 'currentCount' | 'currentDays' | 'completedAt' | 'notes'
> & {
  notes: string
}

/**
 * Turn offer blueprints into enrollment requirements with starts/deadlines
 * and after_previous dependency wiring (list order).
 */
export function materializeRequirementsFromOffer(args: {
  enrollmentId: string
  openedAt: string
  blueprints: OfferRequirementBlueprint[]
  createId: () => string
}): Requirement[] {
  const ids = args.blueprints.map(() => args.createId())

  return args.blueprints.map((bp, index) => {
    const anchor = normalizeWindowAnchor(bp.windowAnchor ?? 'open')
    const windowDays = effectiveWindowDays({
      windowDays: bp.windowDays,
      targetDays: bp.targetDays,
      type: bp.type,
    })
    const dependsOnRequirementId =
      anchor === 'after_previous' && index > 0 ? ids[index - 1] : null

    const schedule = scheduleFromAnchor({
      anchor,
      openedAt: args.openedAt,
      windowDays,
      absoluteDeadlineAt: bp.absoluteDeadlineAt,
      previousCompletedAt: null,
    })

    return {
      id: ids[index],
      enrollmentId: args.enrollmentId,
      type: bp.type,
      label: bp.label,
      targetAmount: bp.targetAmount ?? 0,
      currentAmount: 0,
      targetCount: bp.targetCount ?? 0,
      currentCount: 0,
      targetDays: bp.targetDays ?? 0,
      currentDays: 0,
      windowDays,
      windowAnchor: anchor,
      startsAt: schedule.startsAt,
      deadlineAt: schedule.deadlineAt,
      dependsOnRequirementId,
      notes: bp.notes,
      completedAt: null,
    }
  })
}

/** Earliest actionable deadline among requirements (for enrollment.deadlineAt). */
export function earliestRequirementDeadline(
  requirements: Array<Pick<Requirement, 'deadlineAt' | 'completedAt'>>,
): string | null {
  const open = requirements
    .filter((r) => !r.completedAt && r.deadlineAt)
    .map((r) => r.deadlineAt as string)
    .sort()
  return open[0] ?? null
}

/**
 * When a requirement completes, start any dependents anchored after_previous.
 * Returns a new requirements array (immutable).
 */
export function activateDependentsAfterComplete(
  requirements: Requirement[],
  completedRequirementId: string,
  completedAtIso: string,
): Requirement[] {
  const completedAt = toDateOnlyIso(completedAtIso) ?? completedAtIso.slice(0, 10)

  return requirements.map((req) => {
    if (req.dependsOnRequirementId !== completedRequirementId) return req
    if (req.windowAnchor !== 'after_previous') return req
    if (req.startsAt) return req

    const windowDays = effectiveWindowDays(req)
    const schedule = scheduleFromAnchor({
      anchor: 'after_previous',
      openedAt: null,
      windowDays,
      previousCompletedAt: completedAt,
    })

    return {
      ...req,
      startsAt: schedule.startsAt,
      deadlineAt: schedule.deadlineAt,
    }
  })
}

export function requirementIsAwaitingDependency(req: Requirement): boolean {
  return (
    req.windowAnchor === 'after_previous' &&
    !req.startsAt &&
    !req.completedAt &&
    Boolean(req.dependsOnRequirementId)
  )
}

export function formatWindowSummary(req: {
  windowAnchor: RequirementWindowAnchor
  windowDays: number
  deadlineAt: string | null
  startsAt: string | null
  dependsOnRequirementId?: string | null
  completedAt?: string | null
}): string {
  const awaiting =
    req.windowAnchor === 'after_previous' &&
    !req.startsAt &&
    !req.completedAt &&
    Boolean(req.dependsOnRequirementId)
  if (awaiting) {
    return 'Starts after prior requirement'
  }
  if (req.deadlineAt) {
    return `Due ${req.deadlineAt}`
  }
  if (req.windowAnchor === 'open' && req.windowDays > 0) {
    return `Within ${req.windowDays}d of open`
  }
  if (req.windowAnchor === 'after_previous' && req.windowDays > 0) {
    return `${req.windowDays}d after prior step`
  }
  return ''
}
