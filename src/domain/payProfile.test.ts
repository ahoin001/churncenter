import { describe, expect, it } from 'vitest'
import {
  assessDdFeasibility,
  capacityInWindow,
  enumeratePaydays,
  isPayProfileReady,
  suggestOpenDate,
} from './payProfile'
import type { PayProfileSlice } from './payProfile'

const ready: PayProfileSlice = {
  payNetAmount: 1000,
  payFrequency: 'biweekly',
  nextPayday: '2026-08-14',
}

describe('payProfile', () => {
  it('requires amount, frequency, and next payday', () => {
    expect(isPayProfileReady({ ...ready, payNetAmount: 0 })).toBe(false)
    expect(isPayProfileReady({ ...ready, payFrequency: 'unknown' })).toBe(false)
    expect(isPayProfileReady({ ...ready, nextPayday: null })).toBe(false)
    expect(isPayProfileReady(ready)).toBe(true)
  })

  it('enumerates biweekly paydays inside a window', () => {
    const days = enumeratePaydays('2026-08-14', 'biweekly', '2026-08-01', '2026-09-30')
    expect(days).toEqual(['2026-08-14', '2026-08-28', '2026-09-11', '2026-09-25'])
  })

  it('marks $500 / 90d as on_track for $1000 biweekly', () => {
    const result = assessDdFeasibility(ready, {
      type: 'direct_deposit',
      targetAmount: 500,
      currentAmount: 0,
      windowDays: 90,
      startsAt: '2026-08-12',
      deadlineAt: '2026-11-10',
    })
    expect(result.status).toBe('on_track')
    expect(result.capacity).toBeGreaterThanOrEqual(500)
    expect(result.shortfall).toBe(0)
  })

  it('marks $2000 / 30d as short for $500 biweekly', () => {
    const tightPay: PayProfileSlice = {
      payNetAmount: 500,
      payFrequency: 'biweekly',
      nextPayday: '2026-08-14',
    }
    const result = assessDdFeasibility(tightPay, {
      type: 'direct_deposit',
      targetAmount: 2000,
      currentAmount: 0,
      windowDays: 30,
      startsAt: '2026-08-12',
      deadlineAt: '2026-09-11',
    })
    expect(result.status).toBe('short')
    expect(result.shortfall).toBeGreaterThan(0)
  })

  it('suggests an open date that fits enough paychecks', () => {
    const suggestion = suggestOpenDate(
      {
        payNetAmount: 500,
        payFrequency: 'biweekly',
        nextPayday: '2026-08-21',
      },
      1000,
      45,
      new Date('2026-08-12'),
    )
    expect(suggestion).not.toBeNull()
    expect(suggestion!.capacity).toBeGreaterThanOrEqual(1000)
    expect(suggestion!.paydayCount).toBeGreaterThanOrEqual(2)
  })

  it('computes capacity from payday count', () => {
    const { capacity, paydays } = capacityInWindow(ready, '2026-08-14', '2026-09-11')
    expect(paydays.length).toBe(3)
    expect(capacity).toBe(3000)
  })
})
