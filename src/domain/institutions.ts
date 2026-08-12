import type { Institution } from './types'
import { POPULAR_BANKS, type PopularBank } from './popularBanks'

/** Normalize for duplicate / search matching. */
export function normalizeInstitutionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(banks?|the|n\.?a\.?|national association)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function popularMatchKeys(bank: PopularBank): string[] {
  return [bank.name, ...bank.aliases].map(normalizeInstitutionName).filter(Boolean)
}

export function matchPopularBank(name: string): PopularBank | undefined {
  const key = normalizeInstitutionName(name)
  if (!key) return undefined
  return POPULAR_BANKS.find((bank) => popularMatchKeys(bank).includes(key))
}

export function institutionIdentityKeys(name: string): string[] {
  const keys = new Set<string>()
  const normalized = normalizeInstitutionName(name)
  if (normalized) keys.add(normalized)
  const popular = matchPopularBank(name)
  if (popular) {
    keys.add(`slug:${popular.slug}`)
    for (const k of popularMatchKeys(popular)) keys.add(k)
  }
  return [...keys]
}

export function findDuplicateInstitution(
  institutions: Institution[],
  name: string,
  excludeId?: string,
): Institution | undefined {
  const incoming = new Set(institutionIdentityKeys(name))
  if (incoming.size === 0) return undefined

  return institutions.find((inst) => {
    if (excludeId && inst.id === excludeId) return false
    const existing = institutionIdentityKeys(inst.name)
    return existing.some((key) => incoming.has(key))
  })
}

export function searchPopularBanks(
  query: string,
  owned: Institution[],
  limit = 8,
): PopularBank[] {
  const q = normalizeInstitutionName(query)
  const ownedSlugs = new Set(
    owned
      .map((inst) => matchPopularBank(inst.name)?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  )
  const ownedKeys = new Set(owned.flatMap((inst) => institutionIdentityKeys(inst.name)))

  const available = POPULAR_BANKS.filter((bank) => {
    if (ownedSlugs.has(bank.slug)) return false
    return !popularMatchKeys(bank).some((key) => ownedKeys.has(key))
  })

  if (!q) {
    return available.slice(0, limit)
  }

  const scored = available
    .map((bank) => {
      const keys = popularMatchKeys(bank)
      let score = 0
      for (const key of keys) {
        if (key === q) score = Math.max(score, 100)
        else if (key.startsWith(q)) score = Math.max(score, 80)
        else if (key.includes(q)) score = Math.max(score, 50)
      }
      return { bank, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.bank.name.localeCompare(b.bank.name))

  return scored.slice(0, limit).map((row) => row.bank)
}

export function canAddCustomName(
  name: string,
  institutions: Institution[],
  excludeId?: string,
): { ok: true } | { ok: false; reason: string; existing?: Institution } {
  const trimmed = name.trim()
  if (!trimmed) {
    return { ok: false, reason: 'Enter a bank name.' }
  }
  const duplicate = findDuplicateInstitution(institutions, trimmed, excludeId)
  if (duplicate) {
    return {
      ok: false,
      reason: `You already have ${duplicate.name}.`,
      existing: duplicate,
    }
  }
  return { ok: true }
}
