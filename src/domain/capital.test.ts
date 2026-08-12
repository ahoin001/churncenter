import { describe, expect, it } from 'vitest'
import { assessCapitalFit, capitalFitMessage, selectLiquidAvailable } from './capital'
import { createDefaultAccountConditions } from './fees'
import { createEmptyAppData } from './types'

describe('capital affordability', () => {
  it('returns null available when liquid capital unset', () => {
    const data = createEmptyAppData()
    expect(selectLiquidAvailable(data)).toBeNull()
    expect(assessCapitalFit(null, 20000)).toBe('unknown')
    expect(capitalFitMessage('unknown', null, 20000)).toBeNull()
  })

  it('subtracts locked capital from liquid', () => {
    const data = createEmptyAppData()
    data.preferences.liquidCapital = 50000
    data.enrollments.push({
      id: 'e1',
      offerId: 'o1',
      institutionId: 'i1',
      householdMemberId: 'you',
      status: 'meeting_requirements',
      frozenTitle: 'x',
      frozenBonusAmount: 500,
      frozenCapitalRequired: 20000,
      frozenTermsNotes: '',
      openedAt: null,
      deadlineAt: null,
      expectedBonusAt: null,
      bonusPostedAt: null,
      clawbackEndsAt: null,
      closedAt: null,
      reEligibleAt: null,
      capitalLocked: 20000,
      whatCountedNotes: '',
      accountConditions: createDefaultAccountConditions(),
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(selectLiquidAvailable(data)).toBe(30000)
    expect(assessCapitalFit(30000, 25000)).toBe('ok')
    expect(assessCapitalFit(30000, 35000)).toBe('tight')
    expect(capitalFitMessage('tight', 30000, 35000)).toMatch(/Soft heads-up/)
  })
})
