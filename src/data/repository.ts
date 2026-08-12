import type { AppData } from '@/domain/types'

export interface ChurnRepository {
  load(): AppData
  save(data: AppData): void
  clear(): void
}

/** Stable localStorage key — bump only for a hard cutover that cannot migrate. */
export const STORAGE_KEY = 'churncenter.app.v1'

/**
 * Persistence policy: ledger data never expires.
 * localStorage has no TTL API; we do not store expiresAt/maxAge/TTL on the blob,
 * and load() must never discard data based on age. Only the user (reset/clear/
 * browser site-data wipe) or an explicit clear() removes it.
 */
export const PERSISTENCE_NEVER_EXPIRES = true as const
