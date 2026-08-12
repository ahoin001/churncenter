import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CLAWBACK_DAYS,
  defaultClawbackFromBonusDate,
  resolveClawbackAfterBonusChange,
} from './clawback'

describe('clawback defaults', () => {
  it('defaults to 90 days after bonus date', () => {
    expect(DEFAULT_CLAWBACK_DAYS).toBe(90)
    expect(defaultClawbackFromBonusDate('2026-01-15')).toBe('2026-04-15')
  })

  it('auto-fills when clawback empty', () => {
    expect(
      resolveClawbackAfterBonusChange({
        previousBonusDate: null,
        nextBonusDate: '2026-01-15',
        currentClawback: null,
      }),
    ).toBe('2026-04-15')
  })

  it('retargets when previous clawback was the auto default', () => {
    expect(
      resolveClawbackAfterBonusChange({
        previousBonusDate: '2026-01-15',
        nextBonusDate: '2026-02-01',
        currentClawback: '2026-04-15',
      }),
    ).toBe('2026-05-02')
  })

  it('does not overwrite a manual clawback', () => {
    expect(
      resolveClawbackAfterBonusChange({
        previousBonusDate: '2026-01-15',
        nextBonusDate: '2026-02-01',
        currentClawback: '2026-06-01',
      }),
    ).toBeUndefined()
  })
})
