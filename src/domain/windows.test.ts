import { describe, expect, it } from 'vitest'
import {
  activateDependentsAfterComplete,
  earliestRequirementDeadline,
  materializeRequirementsFromOffer,
  scheduleFromAnchor,
} from '@/domain/windows'
import type { OfferRequirementBlueprint, Requirement } from '@/domain/types'

describe('scheduleFromAnchor', () => {
  it('schedules open windows from openedAt', () => {
    const s = scheduleFromAnchor({
      anchor: 'open',
      openedAt: '2026-08-12',
      windowDays: 30,
    })
    expect(s.startsAt).toBe('2026-08-12')
    expect(s.deadlineAt).toBe('2026-09-11')
  })

  it('keeps after_previous dormant until prior completes', () => {
    const dormant = scheduleFromAnchor({
      anchor: 'after_previous',
      openedAt: '2026-08-12',
      windowDays: 45,
      previousCompletedAt: null,
    })
    expect(dormant.startsAt).toBeNull()
    expect(dormant.deadlineAt).toBeNull()

    const live = scheduleFromAnchor({
      anchor: 'after_previous',
      openedAt: '2026-08-12',
      windowDays: 45,
      previousCompletedAt: '2026-08-20',
    })
    expect(live.startsAt).toBe('2026-08-20')
    expect(live.deadlineAt).toBe('2026-10-04')
  })
})

describe('materializeRequirementsFromOffer', () => {
  it('models ETRADE-style fund then maintain', () => {
    const blueprints: OfferRequirementBlueprint[] = [
      {
        id: 'bp1',
        type: 'initial_fund',
        label: 'Deposit $20,000',
        targetAmount: 20000,
        windowDays: 30,
        windowAnchor: 'open',
        notes: '',
      },
      {
        id: 'bp2',
        type: 'balance_days',
        label: 'Maintain $20,000',
        targetAmount: 20000,
        targetDays: 45,
        windowAnchor: 'after_previous',
        notes: '',
      },
    ]

    let n = 0
    const reqs = materializeRequirementsFromOffer({
      enrollmentId: 'e1',
      openedAt: '2026-08-12',
      blueprints,
      createId: () => `req-${++n}`,
    })

    expect(reqs).toHaveLength(2)
    expect(reqs[0].deadlineAt).toBe('2026-09-11')
    expect(reqs[0].windowAnchor).toBe('open')
    expect(reqs[1].dependsOnRequirementId).toBe(reqs[0].id)
    expect(reqs[1].startsAt).toBeNull()
    expect(reqs[1].deadlineAt).toBeNull()
    expect(reqs[1].targetAmount).toBe(20000)
    expect(reqs[1].targetDays).toBe(45)
    expect(reqs[1].windowDays).toBe(45)

    const afterFund = activateDependentsAfterComplete(
      reqs.map((r, i) =>
        i === 0 ? { ...r, completedAt: '2026-08-20T12:00:00.000Z' } : r,
      ),
      reqs[0].id,
      '2026-08-20T12:00:00.000Z',
    )

    expect(afterFund[1].startsAt).toBe('2026-08-20')
    expect(afterFund[1].deadlineAt).toBe('2026-10-04')
    expect(earliestRequirementDeadline(afterFund)).toBe('2026-10-04')
  })
})

describe('earliestRequirementDeadline', () => {
  it('ignores completed requirements', () => {
    const reqs: Pick<Requirement, 'deadlineAt' | 'completedAt'>[] = [
      { deadlineAt: '2026-09-01', completedAt: '2026-08-15' },
      { deadlineAt: '2026-10-01', completedAt: null },
    ]
    expect(earliestRequirementDeadline(reqs)).toBe('2026-10-01')
  })
})
