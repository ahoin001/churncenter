import { createEmptyAppData, SCHEMA_VERSION, type AppData } from '@/domain/types'
import { STORAGE_KEY, type ChurnRepository } from './repository'
import { migrate } from './migrations'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Browser localStorage ledger — no TTL; data lasts until the user clears it. */
export class LocalStorageRepository implements ChurnRepository {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createEmptyAppData()
      const parsed: unknown = JSON.parse(raw)
      if (!isObject(parsed)) return createEmptyAppData()
      // Never reject or prune based on age — PERSISTENCE_NEVER_EXPIRES in repository.ts.
      return migrate(parsed)
    } catch {
      return createEmptyAppData()
    }
  }

  save(data: AppData): void {
    // Domain payload only — do not wrap with expiresAt / maxAge / TTL.
    const payload: AppData = {
      ...data,
      meta: {
        ...data.meta,
        schemaVersion: SCHEMA_VERSION,
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const localRepository = new LocalStorageRepository()
