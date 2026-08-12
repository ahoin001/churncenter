import { describe, expect, it } from 'vitest'
import { createDemoSeed } from '@/data/seed/demo'
import {
  buildBonusProjection,
  buildWinsTide,
  selectAccruedBonus,
  selectMomentum,
  selectWinEvents,
} from './momentum'

describe('momentum', () => {
  it('sums posted wins from demo seed', () => {
    const data = createDemoSeed()
    const wins = selectWinEvents(data)
    expect(wins.length).toBeGreaterThanOrEqual(2)
    expect(selectAccruedBonus(data)).toBe(600)
  })

  it('builds a rising cumulative tide', () => {
    const data = createDemoSeed()
    const tide = buildWinsTide(selectWinEvents(data))
    expect(tide.length).toBeGreaterThan(0)
    expect(tide[tide.length - 1]?.cumulative).toBe(600)
    for (let i = 1; i < tide.length; i++) {
      expect(tide[i]!.cumulative).toBeGreaterThanOrEqual(tide[i - 1]!.cumulative)
    }
  })

  it('projects expected bonuses into future months', () => {
    const data = createDemoSeed()
    const projection = buildBonusProjection(data)
    const total = projection.reduce((sum, p) => sum + p.amount, 0)
    expect(total).toBe(300)
  })

  it('assembles a full momentum snapshot', () => {
    const data = createDemoSeed()
    const snap = selectMomentum(data)
    expect(snap.accrued).toBe(600)
    expect(snap.expected).toBe(300)
    expect(snap.projectedLifetime).toBe(900)
    expect(snap.holdingInClawback).toBe(200)
    expect(snap.chases.length).toBeGreaterThanOrEqual(1)
  })
})
