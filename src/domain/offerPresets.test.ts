import { describe, expect, it } from 'vitest'
import {
  buildCheckingActivity,
  buildSavingsFundHold,
  buildSimpleNotes,
  previewCheckingActivity,
  previewSavingsFundHold,
  validateDealPattern,
} from './offerPresets'

describe('offerPresets', () => {
  it('builds E*TRADE-style savings fund then hold', () => {
    let n = 0
    const reqs = buildSavingsFundHold(
      { amount: 20000, fundWithinDays: 30, holdDays: 45 },
      () => `bp-${++n}`,
    )
    expect(reqs).toHaveLength(2)
    expect(reqs[0]).toMatchObject({
      type: 'initial_fund',
      targetAmount: 20000,
      windowDays: 30,
      windowAnchor: 'open',
    })
    expect(reqs[1]).toMatchObject({
      type: 'balance_days',
      targetAmount: 20000,
      targetDays: 45,
      windowAnchor: 'after_previous',
    })
    expect(previewSavingsFundHold({ amount: 20000, fundWithinDays: 30, holdDays: 45 })).toBe(
      'Fund $20,000 within 30 days of open, then hold 45 days.',
    )
  })

  it('builds checking DD and spend with open windows', () => {
    const reqs = buildCheckingActivity({
      ddAmount: 500,
      ddDays: 90,
      spendAmount: 300,
      spendDays: 90,
    })
    expect(reqs).toHaveLength(2)
    expect(reqs[0].type).toBe('direct_deposit')
    expect(reqs[1].type).toBe('spend')
    expect(previewCheckingActivity({
      ddAmount: 500,
      ddDays: 90,
      spendAmount: 0,
      spendDays: 90,
    })).toContain('DD within 90 days')
  })

  it('simple notes has no typed requirements', () => {
    expect(buildSimpleNotes()).toEqual([])
  })

  it('validates pattern inputs', () => {
    expect(
      validateDealPattern('savings_fund_hold', {
        savings: { amount: 0, fundWithinDays: 30, holdDays: 45 },
        checking: { ddAmount: 0, ddDays: 90, spendAmount: 0, spendDays: 90 },
      }),
    ).toMatch(/amount/i)

    expect(
      validateDealPattern('simple_notes', {
        savings: { amount: 0, fundWithinDays: 0, holdDays: 0 },
        checking: { ddAmount: 0, ddDays: 90, spendAmount: 0, spendDays: 90 },
      }),
    ).toBeNull()

    expect(
      validateDealPattern('checking_activity', {
        savings: { amount: 20000, fundWithinDays: 30, holdDays: 45 },
        checking: { ddAmount: 0, ddDays: 90, spendAmount: 0, spendDays: 90 },
      }),
    ).toMatch(/direct deposit|spend/i)
  })
})
