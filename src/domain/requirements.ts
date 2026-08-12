import type { Requirement } from './types'
import { requirementIsAwaitingDependency } from './windows'

export type RequirementProgress = {
  ratio: number
  remainingAmount: number
  remainingCount: number
  remainingDays: number
  isComplete: boolean
  label: string
  awaitingDependency: boolean
}

export function requirementProgress(req: Requirement): RequirementProgress {
  const awaitingDependency = requirementIsAwaitingDependency(req)

  const amountRatio =
    req.targetAmount > 0 ? Math.min(1, req.currentAmount / req.targetAmount) : 1
  const countRatio =
    req.targetCount > 0 ? Math.min(1, req.currentCount / req.targetCount) : 1
  const daysRatio =
    req.targetDays > 0 ? Math.min(1, req.currentDays / req.targetDays) : 1

  const ratios = [
    req.targetAmount > 0 ? amountRatio : null,
    req.targetCount > 0 ? countRatio : null,
    req.targetDays > 0 ? daysRatio : null,
  ].filter((value): value is number => value !== null)

  const ratio =
    ratios.length === 0
      ? req.completedAt
        ? 1
        : 0
      : Math.min(...ratios)

  const isComplete =
    !awaitingDependency && (Boolean(req.completedAt) || ratio >= 1)

  let label = req.label
  if (awaitingDependency) {
    label = `${req.label} · waiting on prior step`
  } else if (req.type === 'direct_deposit' && req.targetAmount > 0) {
    const left = Math.max(0, req.targetAmount - req.currentAmount)
    label = isComplete ? 'Direct deposit met' : `Direct deposit · $${left.toFixed(0)} left`
  } else if (req.type === 'spend' && req.targetAmount > 0) {
    const left = Math.max(0, req.targetAmount - req.currentAmount)
    label = isComplete ? 'Spend met' : `Spend · $${left.toFixed(0)} left`
  } else if (req.type === 'balance_days') {
    const daysLeft = Math.max(0, req.targetDays - req.currentDays)
    const amountLeft = Math.max(0, req.targetAmount - req.currentAmount)
    if (isComplete) {
      label = 'Balance hold met'
    } else if (req.targetAmount > 0 && req.targetDays > 0) {
      label =
        amountLeft > 0
          ? `Hold ≥$${req.targetAmount.toFixed(0)} · fund $${amountLeft.toFixed(0)} more`
          : `Balance hold · ${daysLeft}d left`
    } else if (req.targetDays > 0) {
      label = `Balance hold · ${daysLeft}d left`
    }
  } else if (req.type === 'initial_fund' && req.targetAmount > 0) {
    const left = Math.max(0, req.targetAmount - req.currentAmount)
    label = isComplete ? 'Funded' : `Fund · $${left.toFixed(0)} left`
  } else if (req.type === 'wait' && req.targetDays > 0) {
    const left = Math.max(0, req.targetDays - req.currentDays)
    label = isComplete ? 'Wait complete' : `Waiting · ${left}d left`
  }

  return {
    ratio: isComplete ? 1 : awaitingDependency ? 0 : ratio,
    remainingAmount: Math.max(0, req.targetAmount - req.currentAmount),
    remainingCount: Math.max(0, req.targetCount - req.currentCount),
    remainingDays: Math.max(0, req.targetDays - req.currentDays),
    isComplete,
    label,
    awaitingDependency,
  }
}

export function applyProgress(
  req: Requirement,
  patch: Partial<Pick<Requirement, 'currentAmount' | 'currentCount' | 'currentDays'>>,
  nowIso: string,
): Requirement {
  const next: Requirement = {
    ...req,
    ...patch,
  }
  const progress = requirementProgress({ ...next, completedAt: null })
  return {
    ...next,
    completedAt: progress.isComplete ? req.completedAt ?? nowIso : null,
  }
}
