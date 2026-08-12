import { describe, expect, it } from 'vitest'
import { applyProgress, requirementProgress } from '@/domain/requirements'
import type { Requirement } from '@/domain/types'

const base: Requirement = {
  id: 'r1',
  enrollmentId: 'e1',
  type: 'direct_deposit',
  label: 'DD',
  targetAmount: 500,
  currentAmount: 0,
  targetCount: 0,
  currentCount: 0,
  targetDays: 0,
  currentDays: 0,
  windowDays: 90,
  windowAnchor: 'open',
  startsAt: '2026-08-01',
  deadlineAt: '2026-10-30',
  dependsOnRequirementId: null,
  notes: '',
  completedAt: null,
}

describe('requirementProgress', () => {
  it('computes remaining and ratio', () => {
    const p = requirementProgress({ ...base, currentAmount: 200 })
    expect(p.ratio).toBeCloseTo(0.4)
    expect(p.remainingAmount).toBe(300)
    expect(p.isComplete).toBe(false)
  })

  it('marks complete and stamps completedAt via applyProgress', () => {
    const next = applyProgress(base, { currentAmount: 500 }, '2026-08-12')
    expect(next.completedAt).toBe('2026-08-12')
    expect(requirementProgress(next).isComplete).toBe(true)
  })

  it('requires amount and days for balance holds', () => {
    const hold: Requirement = {
      ...base,
      type: 'balance_days',
      label: 'Maintain',
      targetAmount: 20000,
      currentAmount: 20000,
      targetDays: 45,
      currentDays: 10,
    }
    const p = requirementProgress(hold)
    expect(p.isComplete).toBe(false)
    expect(p.remainingDays).toBe(35)
    expect(p.label).toContain('35d')
  })

  it('stays incomplete while awaiting dependency', () => {
    const hold: Requirement = {
      ...base,
      type: 'balance_days',
      label: 'Maintain',
      targetAmount: 20000,
      currentAmount: 20000,
      targetDays: 45,
      currentDays: 45,
      windowAnchor: 'after_previous',
      startsAt: null,
      deadlineAt: null,
      dependsOnRequirementId: 'r0',
    }
    const p = requirementProgress(hold)
    expect(p.awaitingDependency).toBe(true)
    expect(p.isComplete).toBe(false)
    expect(p.ratio).toBe(0)
  })
})
