import { describe, expect, it } from 'vitest'
import {
  canAddCustomName,
  findDuplicateInstitution,
  matchPopularBank,
  normalizeInstitutionName,
  searchPopularBanks,
} from './institutions'
import type { Institution } from './types'

const owned: Institution[] = [
  {
    id: '1',
    name: 'Chase',
    notes: '',
    defaultCooldownMonths: 12,
    createdAt: '',
    updatedAt: '',
  },
]

describe('institution identity', () => {
  it('normalizes chase variants', () => {
    expect(normalizeInstitutionName('Chase Bank')).toBe('chase')
    expect(matchPopularBank('JPMorgan Chase')?.slug).toBe('chase')
  })

  it('detects duplicates via aliases', () => {
    expect(findDuplicateInstitution(owned, 'Chase Bank')?.id).toBe('1')
    expect(findDuplicateInstitution(owned, 'Ally')).toBeUndefined()
  })

  it('blocks adding chase again', () => {
    const result = canAddCustomName('chase', owned)
    expect(result.ok).toBe(false)
  })

  it('suggests popular banks excluding owned', () => {
    const results = searchPopularBanks('cap', owned)
    expect(results.some((b) => b.slug === 'capital-one')).toBe(true)
    expect(results.some((b) => b.slug === 'chase')).toBe(false)
  })
})
