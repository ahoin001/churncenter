import { describe, expect, it } from 'vitest'
import { assessFeeRisk, createDefaultAccountConditions } from './fees'

describe('assessFeeRisk', () => {
  it('flags unmet waivable fees', () => {
    const risk = assessFeeRisk({
      ...createDefaultAccountConditions(),
      monthlyFeeKind: 'waivable',
      monthlyFeeAmount: 12,
      waiverAction: 'direct_deposit',
      waiverSatisfied: false,
    })
    expect(risk.level).toBe('watch')
    expect(risk.chips.some((c) => c.tone === 'warn')).toBe(true)
  })

  it('treats no monthly fee as clear', () => {
    const risk = assessFeeRisk({
      ...createDefaultAccountConditions(),
      openingDepositKind: 'none',
      monthlyFeeKind: 'none',
      waiverSatisfied: true,
    })
    expect(risk.level).toBe('clear')
  })
})
